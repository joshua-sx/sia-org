import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toDbPayload, type EmployeeFormValues } from "@/lib/employeeSchema";
import {
  fromBulkImportResult,
  toBulkImportArgs,
  type BulkEmployeeImportRow,
} from "@/lib/employeeImport";
import type { Tables } from "@/integrations/supabase/types";

export type Employee = Tables<"employees">;

export function useEmployees() {
  const { organization, profile } = useAuth();
  const qc = useQueryClient();
  // Plain employees may only read the column-limited directory (no phone,
  // notes, employee code, location or employment dates). HR admins and
  // managers keep full-row access via RLS.
  const directoryOnly = profile?.role !== "hr_admin" && profile?.role !== "manager";

  const query = useQuery({
    queryKey: ["employees", organization?.id, directoryOnly ? "directory" : "full"],
    queryFn: async () => {
      if (!organization) return [] as Employee[];
      if (!directoryOnly) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("last_name", { ascending: true });
        if (error) throw error;
        return (data ?? []) as Employee[];
      }
      const { data, error } = await supabase
        .from("employee_directory")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        employee_code: null,
        start_date: null,
        end_date: null,
        location: null,
        phone: null,
        notes: null,
        ...row,
      })) as Employee[];
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
    mutationFn: async (rows: BulkEmployeeImportRow[]) => {
      if (!organization) throw new Error("No organization");
      if (!rows.length) return { inserted: [] as Employee[], unresolvedManagers: [] as string[] };

      const { data, error } = await supabase.rpc(
        "bulk_import_employees",
        toBulkImportArgs(rows),
      );
      if (error) throw error;
      return fromBulkImportResult(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  return { ...query, createEmployee, updateEmployee, deleteEmployee, bulkInsert };
}
