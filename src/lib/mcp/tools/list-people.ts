import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createMcpSupabase, EMPLOYEE_SELECT } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "list_people",
  title: "List people",
  description:
    "List employee records in the signed-in user's organization, including job title, org unit, and reporting line.",
  inputSchema: {
    org_unit_id: z.string().uuid().optional().describe("Optional org unit filter."),
    employment_status: z
      .enum(["active", "on_leave", "terminated"])
      .optional()
      .describe("Optional employment status filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ org_unit_id, employment_status }, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    let query = supabase.from("employees").select(EMPLOYEE_SELECT).order("last_name").order("first_name");
    if (org_unit_id) query = query.eq("org_unit_id", org_unit_id);
    if (employment_status) query = query.eq("employment_status", employment_status);

    const { data, error } = await query;
    if (error) return mcpError(error.message);
    return mcpJson({ people: data ?? [] });
  },
});
