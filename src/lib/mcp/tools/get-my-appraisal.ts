import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";
import { participantTableForRole } from "../participantTable";

export default defineTool({
  name: "get_my_appraisal",
  title: "Get my appraisal",
  description:
    "Return the signed-in user's appraisal status and scores for the active cycle. Interim scores are hidden from employees until final submission.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const caller = await getCallerEmployee(supabase, ctx.getUserId());
    if (!caller) return mcpError("No employee record linked to your profile.");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", ctx.getUserId()).single();
    const participantTable = participantTableForRole(profile?.role);

    const { data: cycle, error: cycleError } = await supabase
      .from("appraisal_cycles")
      .select("id, name, status, acknowledgement_due")
      .eq("status", "active")
      .maybeSingle();
    if (cycleError) return mcpError(cycleError.message);
    if (!cycle) return mcpJson({ cycle: null, participant: null });

    const { data: participant, error: pError } = await supabase
      .from(participantTable)
      .select(
        "id, interim_submitted_at, final_submitted_at, interim_score, final_score, overall_score, acknowledged_at",
      )
      .eq("cycle_id", cycle.id)
      .eq("employee_id", caller.id)
      .maybeSingle();
    if (pError) return mcpError(pError.message);

    return mcpJson({ cycle, participant: participant ?? null });
  },
});
