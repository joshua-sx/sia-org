import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createMcpSupabase } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "list_profiles",
  title: "List signed-in users",
  description:
    "List profiles (signed-in app users) in the organization. Optionally filter by app role (hr_admin, manager, employee).",
  inputSchema: {
    role: z.enum(["hr_admin", "manager", "employee"]).optional().describe("Optional app role filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ role }, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("full_name", { ascending: true });
    if (role) query = query.eq("role", role);

    const { data, error } = await query;
    if (error) return mcpError(error.message);
    return mcpJson({ profiles: data ?? [] });
  },
});
