import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_active_cycle",
  title: "Get active appraisal cycle",
  description:
    "Return the currently active appraisal cycle with window dates. Use this to answer when appraisals are due.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const { data, error } = await supabase
      .from("appraisal_cycles")
      .select(
        "id, name, status, goal_window_start, goal_window_end, interim_window_start, interim_window_end, final_window_start, final_window_end, acknowledgement_due, interim_weight_pct, final_weight_pct",
      )
      .eq("status", "active")
      .maybeSingle();
    if (error) return mcpError(error.message);
    return mcpJson({ cycle: data ?? null });
  },
});
