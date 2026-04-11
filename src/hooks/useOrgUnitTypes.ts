import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrgUnitType {
  id: string;
  organization_id: string;
  name: string;
  level: number;
  created_at: string | null;
}

export function useOrgUnitTypes() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["org_unit_types", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("org_unit_types")
        .select("*")
        .order("level", { ascending: true });
      if (error) throw error;
      return data as OrgUnitType[];
    },
    enabled: !!organization,
  });

  const createTypes = useMutation({
    mutationFn: async (types: { name: string; level: number }[]) => {
      if (!organization) throw new Error("No organization");
      const rows = types.map((t) => ({
        organization_id: organization.id,
        name: t.name,
        level: t.level,
      }));
      const { data, error } = await supabase
        .from("org_unit_types")
        .insert(rows)
        .select();
      if (error) throw error;
      return data as OrgUnitType[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_unit_types"] });
    },
  });

  const renameType = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("org_unit_types")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_unit_types"] });
    },
  });

  return { ...query, createTypes, renameType };
}
