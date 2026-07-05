import type { OrgUnit } from "@/hooks/useOrgUnits";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";

export interface LevelDescriptor {
  type: OrgUnitType;
  index: number; // 0-based
}

export function orderedLevels(types: OrgUnitType[]): LevelDescriptor[] {
  return [...types]
    .sort((a, b) => a.level - b.level)
    .map((type, index) => ({ type, index }));
}

/** Build a map from unit id -> ordered ancestor chain (root first, self last). */
export function buildAncestryMap(units: OrgUnit[]): Map<string, OrgUnit[]> {
  const byId = new Map(units.map((u) => [u.id, u]));
  const cache = new Map<string, OrgUnit[]>();
  const resolve = (id: string): OrgUnit[] => {
    if (cache.has(id)) return cache.get(id)!;
    const u = byId.get(id);
    if (!u) return [];
    const chain = u.parent_id ? [...resolve(u.parent_id), u] : [u];
    cache.set(id, chain);
    return chain;
  };
  units.forEach((u) => resolve(u.id));
  return cache;
}

/** For a given unit id + ordered types, return [unitAtLevel0, unitAtLevel1, ...] with nulls for missing levels. */
export function unitsByLevel(
  unitId: string | null | undefined,
  ancestry: Map<string, OrgUnit[]>,
  levels: LevelDescriptor[]
): (OrgUnit | null)[] {
  const chain = unitId ? ancestry.get(unitId) ?? [] : [];
  return levels.map((lvl) => chain.find((u) => u.unit_type_id === lvl.type.id) ?? null);
}

/** Children of a parent (or roots when parentId is null) at a specific unit type. */
export function childrenAt(
  units: OrgUnit[],
  parentId: string | null,
  typeId: string
): OrgUnit[] {
  return units
    .filter((u) => u.unit_type_id === typeId && (u.parent_id ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Human-readable breadcrumb "A / B / C" for a unit id. */
export function unitBreadcrumb(
  unitId: string | null | undefined,
  ancestry: Map<string, OrgUnit[]>
): string {
  if (!unitId) return "";
  return (ancestry.get(unitId) ?? []).map((u) => u.name).join(" / ");
}

/** Resolve a "A / B / C" path string to a unit id by walking the tree. */
export function resolvePathString(
  pathStr: string,
  units: OrgUnit[],
  levels: LevelDescriptor[]
): string | null {
  const parts = pathStr
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  let parentId: string | null = null;
  let lastId: string | null = null;
  for (let i = 0; i < parts.length; i++) {
    const level = levels[i];
    if (!level) return lastId;
    const match = units.find(
      (u) =>
        u.unit_type_id === level.type.id &&
        (u.parent_id ?? null) === parentId &&
        u.name.toLowerCase() === parts[i].toLowerCase()
    );
    if (!match) return lastId;
    lastId = match.id;
    parentId = match.id;
  }
  return lastId;
}
