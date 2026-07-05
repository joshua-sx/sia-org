import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toDbPayload, type EmployeeFormValues } from "@/lib/employeeSchema";

export interface Employee {
  id: string;
  organization_id: string;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  org_unit_id: string | null;
  manager_id: string | null;
  employment_type: "full_time" | "part_time" | "contractor" | "intern";
  employment_status: "active" | "on_leave" | "terminated";
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  phone: string | null;
  notes: string | null;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  const { organization } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["employees", organization?.id],
    queryFn: async () => {
      if (!organization) return [] as Employee[];
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Employee[];
    },
    enabled: !!organization,
  });

  const createEmployee = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      if (!organization) throw new Error("No organization");
      const payload = toDbPayload(values);
      const { data, error } = await supabase
        .from("employees")
        .insert({ ...payload, organization_id: organization.id })
        .select()
        .single();
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EmployeeFormValues }) => {
      const payload = toDbPayload(values);
      const { data, error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const bulkInsert = useMutation({
    mutationFn: async (
      rows: Array<{
        first_name: string;
        last_name: string;
        email: string;
        employee_code: string | null;
        job_title: string | null;
        org_unit_id: string | null;
        employment_type: string;
        employment_status: string;
        start_date: string | null;
        location: string | null;
        phone: string | null;
        manager_email_pending?: string | null;
      }>
    ) => {
      if (!organization) throw new Error("No organization");
      if (!rows.length) return { inserted: [] as Employee[] };

      const payload = rows.map((r) => ({
        organization_id: organization.id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        employee_code: r.employee_code,
        job_title: r.job_title,
        org_unit_id: r.org_unit_id,
        employment_type: r.employment_type as Employee["employment_type"],
        employment_status: r.employment_status as Employee["employment_status"],
        start_date: r.start_date,
        location: r.location,
        phone: r.phone,
      }));

      const { data, error } = await supabase.from("employees").insert(payload).select();
      if (error) throw error;

      const inserted = (data ?? []) as Employee[];

      // Resolve managers by email in a second pass
      const emailToId = new Map(inserted.map((e) => [e.email.toLowerCase(), e.id]));
      const updates = rows
        .map((r, i) => ({ row: r, insertedId: inserted[i]?.id }))
        .filter((x) => x.row.manager_email_pending && x.insertedId)
        .map((x) => ({
          id: x.insertedId!,
          manager_id: emailToId.get(x.row.manager_email_pending!.toLowerCase()) ?? null,
        }))
        .filter((u) => u.manager_id);

      for (const u of updates) {
        await supabase.from("employees").update({ manager_id: u.manager_id }).eq("id", u.id);
      }

      return { inserted };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  return { ...query, createEmployee, updateEmployee, deleteEmployee, bulkInsert };
}
