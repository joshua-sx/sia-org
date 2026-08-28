import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";

export interface PersistedUnitNode {
  name: string;
  children: PersistedUnitNode[];
}

interface TypeCreator {
  mutateAsync: (types: { name: string; level: number }[]) => Promise<OrgUnitType[]>;
}

interface UnitCreator {
  mutateAsync: (unit: {
    name: string;
    unit_type_id: string;
    parent_id?: string | null;
  }) => Promise<OrgUnit>;
}

interface PersistOrgStructureOptions {
  levels: string[];
  units: PersistedUnitNode[];
  createTypes: TypeCreator;
  addUnit: UnitCreator;
  requireUnits?: boolean;
}

export async function persistOrgStructure({
  levels,
  units,
  createTypes,
  addUnit,
  requireUnits = false,
}: PersistOrgStructureOptions): Promise<void> {
  if (requireUnits && units.length === 0) {
    throw new Error("At least one organization unit is required");
  }

  const createdTypes = await createTypes.mutateAsync(
    levels.map((name, index) => ({ name, level: index + 1 })),
  );
  const typeIdByLevel = new Map(createdTypes.map((type) => [type.level, type.id]));

  const persistNodes = async (
    nodes: PersistedUnitNode[],
    depth: number,
    parentId: string | null,
  ): Promise<void> => {
    const typeId = typeIdByLevel.get(depth + 1);
    if (!typeId) return;

    const createdNodes = await Promise.all(
      nodes.map((node) =>
        addUnit.mutateAsync({
          name: node.name,
          unit_type_id: typeId,
          parent_id: parentId,
        }),
      ),
    );

    await Promise.all(
      nodes.map((node, index) =>
        node.children.length > 0
          ? persistNodes(node.children, depth + 1, createdNodes[index].id)
          : Promise.resolve(),
      ),
    );
  };

  await persistNodes(units, 0, null);
}
