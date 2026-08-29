import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_team_goals",
  title: "Get team goals",
  description:
    "Return goals for each direct report of the signed-in user in the active appraisal cycle. Requires a linked employee record and manager reporting line.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const caller = await getCallerEmployee(supabase, ctx.getUserId());
    if (!caller) return mcpError("No employee record linked to your profile.");

    const { data: cycle, error: cycleError } = await supabase
      .from("appraisal_cycles")
      .select("id, name")
      .eq("status", "active")
      .maybeSingle();
    if (cycleError) return mcpError(cycleError.message);
    if (!cycle) return mcpJson({ cycle: null, team: [] });

    const { data: participants, error: pError } = await supabase
      .from("cycle_participants")
      .select(
        "id, employee_id, employee:employees!cycle_participants_employee_id_fkey(id, first_name, last_name, job_title)",
      )
      .eq("cycle_id", cycle.id)
      .eq("manager_id", caller.id);
    if (pError) return mcpError(pError.message);

    const team = [];
    for (const participant of participants ?? []) {
      const { data: goals } = await supabase
        .from("goals")
        .select("id, title, weight")
        .eq("participant_id", participant.id)
        .order("created_at");
      // To-one embed is an object at runtime; typegen infers an array. See
      // get-appraisal-history.ts for the same convention.
      const employee = participant.employee as unknown as {
        id: string;
        first_name: string;
        last_name: string;
        job_title: string | null;
      } | null;
      team.push({
        employee_id: participant.employee_id,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}`.trim() : null,
        job_title: employee?.job_title ?? null,
        participant_id: participant.id,
        goals: goals ?? [],
        weight_sum: (goals ?? []).reduce((sum, g) => sum + (g.weight ?? 0), 0),
      });
    }

    return mcpJson({ cycle, team });
  },
});
