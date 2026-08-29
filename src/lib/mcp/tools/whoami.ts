import { defineTool } from "@lovable.dev/mcp-js";
import { createMcpSupabase } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description:
    "Return the signed-in user's profile, app role, organization, and linked employee record (job title, org unit).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, organization_id, organizations(name, industry, country)")
      .eq("id", ctx.getUserId())
      .single();
    if (error) return mcpError(error.message);

    const { data: employee } = await supabase
      .from("employees")
      .select(
        "id, first_name, last_name, email, job_title, org_unit_id, manager_id, org_unit:org_units(id, name), manager:employees!employees_manager_id_fkey(id, first_name, last_name, job_title)",
      )
      .eq("profile_id", ctx.getUserId())
      .maybeSingle();

    return mcpJson({ profile, employee: employee ?? null });
  },
});
