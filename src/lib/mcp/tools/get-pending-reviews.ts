import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createMcpSupabase } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_pending_reviews",
  title: "Get pending reviews",
  description:
    "Return outstanding and overdue appraisal tasks scoped to the caller's permissions. HR sees org-wide data including department aggregates; managers see their team; employees see their own tasks.",
  inputSchema: {
    cycle_id: z.string().uuid().optional().describe("Optional cycle id. Defaults to the active cycle."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ cycle_id }, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const { data, error } = await supabase.rpc("mcp_get_pending_reviews", {
      p_cycle_id: cycle_id ?? null,
    });
    if (error) return mcpError(error.message);
    if (!data) return mcpError("Unable to load pending reviews");
    return mcpJson(data as Record<string, unknown>);
  },
});
