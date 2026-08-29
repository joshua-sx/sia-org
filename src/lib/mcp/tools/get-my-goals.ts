import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";
import { participantTableForRole } from "../participantTable";

export default defineTool({
  name: "get_my_goals",
  title: "Get my goals",
  description: "Return weighted goals for the signed-in user in the active appraisal cycle.",
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
      .select("id, name")
      .eq("status", "active")
      .maybeSingle();
    if (cycleError) return mcpError(cycleError.message);
    if (!cycle) return mcpJson({ cycle: null, goals: [], weight_sum: 0 });

    const { data: participant, error: pError } = await supabase
      .from(participantTable)
      .select("id")
      .eq("cycle_id", cycle.id)
      .eq("employee_id", caller.id)
      .maybeSingle();
    if (pError) return mcpError(pError.message);
    if (!participant) return mcpJson({ cycle, goals: [], weight_sum: 0 });

    const { data: goals, error: gError } = await supabase
      .from("goals")
      .select("id, title, weight, created_at")
      .eq("participant_id", participant.id)
      .order("created_at");
    if (gError) return mcpError(gError.message);

    const weightSum = (goals ?? []).reduce((sum, g) => sum + (g.weight ?? 0), 0);
    return mcpJson({ cycle, goals: goals ?? [], weight_sum: weightSum });
  },
});
