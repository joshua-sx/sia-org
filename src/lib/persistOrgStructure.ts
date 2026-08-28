import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { hasSiaErrorCode } from "@/lib/siaErrors";

export interface PersistedUnitNode {
  name: string;
  children: PersistedUnitNode[];
}

interface PersistOrgStructureOptions {
  levels: string[];
  units: PersistedUnitNode[];
  requireUnits?: boolean;
}

export type PersistOrgStructureResult = "created" | "already_exists";

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
}: PersistOrgStructureOptions): Promise<PersistOrgStructureResult> {
  validateOrgStructureForSave(units, requireUnits);

  const { error } = await supabase.rpc(
    "create_org_structure",
    buildOrgStructureRpcPayload(levels, units),
  );
  if (error) {
    // A committed response can be lost in transit, or another administrator can
    // win the initialization race. Callers refresh structure data on completion.
    if (hasSiaErrorCode(error, "SIA_ORG_STRUCTURE_EXISTS")) {
      return "already_exists";
    }
    throw error;
  }
  return "created";
}
