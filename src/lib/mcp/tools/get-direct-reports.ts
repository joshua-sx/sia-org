import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase, EMPLOYEE_SELECT, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_direct_reports",
  title: "Get direct reports",
  description: "List people who report directly to the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const caller = await getCallerEmployee(supabase, ctx.getUserId());
    if (!caller) {
      return mcpError("No employee record linked to your profile. Ask HR to link your account.");
    }

    const { data, error } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("manager_id", caller.id)
      .order("last_name")
      .order("first_name");
    if (error) return mcpError(error.message);

    return mcpJson({
      manager_employee_id: caller.id,
      direct_reports: data ?? [],
    });
  },
});
