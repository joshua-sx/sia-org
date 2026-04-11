import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrgUnit {
  id: string;
  organization_id: string;
  parent_id: string | null;
  unit_type_id: string;
  name: string;
  depth: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrgUnitTreeNode extends OrgUnit {
  children: OrgUnitTreeNode[];
  typeName: string;
  typeLevel: number;
}

export function buildTree(
  units: OrgUnit[],
  typeMap: Record<string, { name: string; level: number }>
): OrgUnitTreeNode[] {
  const nodeMap = new Map<string, OrgUnitTreeNode>();
  const roots: OrgUnitTreeNode[] = [];

  for (const u of units) {
    const t = typeMap[u.unit_type_id] ?? { name: "Unknown", level: 0 };
    nodeMap.set(u.id, { ...u, children: [], typeName: t.name, typeLevel: t.level });
  }

  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: OrgUnitTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

export function useOrgUnits() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["org_units", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("org_units")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as OrgUnit[];
    },
    enabled: !!organization,
  });

  const addUnit = useMutation({
    mutationFn: async (unit: {
      name: string;
      unit_type_id: string;
      parent_id?: string | null;
    }) => {
      if (!organization) throw new Error("No organization");
      const { data, error } = await supabase
        .from("org_units")
        .insert({
          organization_id: organization.id,
          name: unit.name,
          unit_type_id: unit.unit_type_id,
          parent_id: unit.parent_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as OrgUnit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_units"] });
    },
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from("org_units")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_units"] });
    },
  });

  return { ...query, addUnit, updateUnit };
}
