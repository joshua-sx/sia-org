import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_org_chart",
  title: "Get org chart",
  description:
    "Return the organization's unit tree and people with reporting relationships. Answers who works here and what a department looks like.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const { data, error } = await supabase.rpc("mcp_get_org_chart");
    if (error) return mcpError(error.message);
    if (!data) return mcpError("Unable to load org chart");
    return mcpJson(data as Record<string, unknown>);
  },
});
