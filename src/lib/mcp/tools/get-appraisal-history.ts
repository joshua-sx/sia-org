import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createMcpSupabase, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";
import { participantTableForRole } from "../participantTable";

export default defineTool({
  name: "get_appraisal_history",
  title: "Get appraisal history",
  description:
    "Return completed-cycle appraisal records. Employees see their own history; managers see direct reports; HR sees org-wide history.",
  inputSchema: {
    employee_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional employee id. Defaults to the signed-in user. Managers/HR may query reports."),
    limit: z.number().int().min(1).max(20).optional().describe("Max cycles to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ employee_id, limit = 10 }, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", ctx.getUserId()).single();
    const participantTable = participantTableForRole(profile?.role);

    let targetEmployeeId = employee_id;
    if (!targetEmployeeId) {
      const caller = await getCallerEmployee(supabase, ctx.getUserId());
      if (!caller) return mcpError("No employee record linked to your profile.");
      targetEmployeeId = caller.id;
    } else if (profile?.role === "employee") {
      const caller = await getCallerEmployee(supabase, ctx.getUserId());
      if (!caller || caller.id !== targetEmployeeId) {
        return mcpError("Employees may only view their own appraisal history.");
      }
    } else if (profile?.role === "manager" && employee_id) {
      const { data: report } = await supabase
        .from("employees")
        .select("id")
        .eq("id", employee_id)
        .eq("manager_id", (await getCallerEmployee(supabase, ctx.getUserId()))?.id ?? "")
        .maybeSingle();
      if (!report) return mcpError("Managers may only view appraisal history for direct reports.");
    }

    const { data: participants, error } = await supabase
      .from(participantTable)
      .select(
        `
        id,
        interim_submitted_at,
        final_submitted_at,
        interim_score,
        final_score,
        overall_score,
        acknowledged_at,
        cycle:appraisal_cycles!inner(id, name, status, closed_at)
      `,
      )
      .eq("employee_id", targetEmployeeId)
      .eq("cycle.status", "completed")
      .limit(limit);
    if (error) return mcpError(error.message);

    // To-one embeds come back as objects at runtime, but typegen lacks
    // relationship metadata for the masked participant view, so postgrest-js
    // infers arrays. Same convention as the app hooks (e.g. useCycleParticipants).
    const history = [...(participants ?? [])].sort((a, b) => {
      const aClosed = (a.cycle as unknown as { closed_at: string | null } | null)?.closed_at ?? "";
      const bClosed = (b.cycle as unknown as { closed_at: string | null } | null)?.closed_at ?? "";
      return bClosed.localeCompare(aClosed);
    });

    return mcpJson({ employee_id: targetEmployeeId, history });
  },
});
