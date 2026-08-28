import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_employees",
  title: "List employees",
  description:
    "List employees (profiles) in the signed-in user's organization. Optionally filter by role (hr_admin, manager, employee).",
  inputSchema: {
    role: z
      .enum(["hr_admin", "manager", "employee"])
      .optional()
      .describe("Optional role filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ role }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("full_name", { ascending: true });
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { employees: data ?? [] },
    };
  },
});
