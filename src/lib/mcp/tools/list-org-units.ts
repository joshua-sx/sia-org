import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_org_units",
  title: "List organizational units",
  description:
    "List all organizational units (departments, teams, etc.) in the signed-in user's organization, with hierarchy path and type.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await supabase
      .from("org_units")
      .select("id, name, parent_id, depth, is_active, unit_type_id, org_unit_types(name, level)")
      .order("depth", { ascending: true })
      .order("name", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { units: data ?? [] },
    };
  },
});
