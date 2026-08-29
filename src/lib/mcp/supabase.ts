import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type McpAuthContext = {
  isAuthenticated(): boolean;
  getToken(): string;
  getUserId(): string;
};

export function createMcpSupabase(ctx: McpAuthContext): SupabaseClient | null {
  if (!ctx.isAuthenticated()) return null;
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const EMPLOYEE_SELECT = `
  id,
  employee_code,
  first_name,
  last_name,
  email,
  job_title,
  employment_type,
  employment_status,
  org_unit_id,
  manager_id,
  profile_id,
  org_unit:org_units(id, name, depth, unit_type_id, org_unit_types(name, level)),
  manager:employees!employees_manager_id_fkey(id, first_name, last_name, job_title)
`;

export async function getCallerEmployee(
  supabase: SupabaseClient,
  profileId: string,
): Promise<{ id: string; first_name: string; last_name: string; job_title: string | null } | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, job_title")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
