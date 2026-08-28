import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface PersistedUnitNode {
  name: string;
  children: PersistedUnitNode[];
}

interface PersistOrgStructureOptions {
  levels: string[];
  units: PersistedUnitNode[];
  requireUnits?: boolean;
}

export function validateOrgStructureForSave(
  units: PersistedUnitNode[],
  requireUnits: boolean,
): void {
  if (requireUnits && units.length === 0) {
    throw new Error("At least one organization unit is required");
  }
}

export function buildOrgStructureRpcPayload(
  levels: string[],
  units: PersistedUnitNode[],
): { p_levels: Json; p_units: Json } {
  const mapUnit = (unit: PersistedUnitNode): Json => ({
    name: unit.name,
    children: unit.children.map(mapUnit),
  });

  return {
    p_levels: levels.map((name, index) => ({ name, level: index + 1 })),
    p_units: units.map(mapUnit),
  };
}

export async function persistOrgStructure({
  levels,
  units,
  requireUnits = false,
}: PersistOrgStructureOptions): Promise<void> {
  validateOrgStructureForSave(units, requireUnits);

  const { error } = await supabase.rpc(
    "create_org_structure",
    buildOrgStructureRpcPayload(levels, units),
  );
  if (error) throw error;
}
