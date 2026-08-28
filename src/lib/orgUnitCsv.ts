import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";

export interface OrgUnitCsvRow {
  values: string[];
  error?: string;
  imported?: boolean;
}

export interface OrgUnitCsvMapping {
  name: string;
  type: string;
  parent: string;
}

export interface OrgUnitCsvImportPlan {
  orderedIndexes: number[];
  unresolvedErrors: Map<number, string>;
}

const normalized = (value: string | undefined) => (value ?? "").trim().toLowerCase();

const columnIndex = (value: string) => Number.parseInt(value, 10);

export function inferOrgUnitCsvMapping(headers: string[]): OrgUnitCsvMapping {
  const mapping: OrgUnitCsvMapping = { name: "", type: "", parent: "" };

  headers.forEach((header, index) => {
    const key = normalized(header);
    if (key.includes("unit_name") || key === "name") mapping.name = String(index);
    if (key.includes("unit_type") || key === "type") mapping.type = String(index);
    if (key.includes("parent")) mapping.parent = String(index);
  });

  return mapping;
}

export function validateOrgUnitCsvRows(
  rows: OrgUnitCsvRow[],
  mapping: OrgUnitCsvMapping,
  unitTypes: OrgUnitType[],
  existingUnits: OrgUnit[],
): OrgUnitCsvRow[] {
  const nameIndex = columnIndex(mapping.name);
  const typeIndex = columnIndex(mapping.type);
  const parentIndex = columnIndex(mapping.parent);
  const sortedTypes = [...unitTypes].sort((left, right) => left.level - right.level);
  const typeByName = new Map(sortedTypes.map((type) => [normalized(type.name), type]));
  const typeById = new Map(sortedTypes.map((type) => [type.id, type]));
  const nameCounts = new Map<string, number>();

  for (const row of rows) {
    const name = normalized(row.values[nameIndex]);
    if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  // Keep the existing lookup behavior: the last matching database unit wins.
  const existingByName = new Map(existingUnits.map((unit) => [normalized(unit.name), unit]));
  const csvRowsByName = new Map<string, OrgUnitCsvRow[]>();
  for (const row of rows) {
    const name = normalized(row.values[nameIndex]);
    if (!name) continue;
    const matches = csvRowsByName.get(name) ?? [];
    matches.push(row);
    csvRowsByName.set(name, matches);
  }

  const csvParentByName = new Map<string, string>();
  for (const [name, matchingRows] of csvRowsByName) {
    if (matchingRows.length !== 1 || existingByName.has(name)) continue;
    const parentName = normalized(matchingRows[0].values[parentIndex]);
    if (parentName) csvParentByName.set(name, parentName);
  }
  const hasCyclicParentChain = (startName: string): boolean => {
    const visited = new Set<string>();
    let currentName: string | undefined = startName;
    while (currentName) {
      if (visited.has(currentName)) return true;
      visited.add(currentName);
      currentName = csvParentByName.get(currentName);
    }
    return false;
  };

  return rows.map((row) => {
    const name = row.values[nameIndex]?.trim();
    const typeName = row.values[typeIndex]?.trim();
    const parentName = row.values[parentIndex]?.trim();
    const nameKey = normalized(name);

    if (!name) return { ...row, error: "Missing unit name" };
    if (!typeName) return { ...row, error: "Missing unit type" };
    if ((nameCounts.get(nameKey) ?? 0) > 1) {
      return { ...row, error: `Duplicate unit name in CSV: "${name}"` };
    }

    const unitType = typeByName.get(normalized(typeName));
    if (!unitType) return { ...row, error: `Unknown type: "${typeName}"` };

    if (!parentName) {
      if (unitType.level !== sortedTypes[0]?.level) {
        return { ...row, error: `Non-top-level type "${typeName}" requires a parent` };
      }
      return { ...row, error: undefined };
    }

    const parentKey = normalized(parentName);
    const existingParent = existingByName.get(parentKey);
    const csvParentRows = csvRowsByName.get(parentKey) ?? [];
    if (!existingParent && csvParentRows.length === 0) {
      return { ...row, error: `Parent not found: "${parentName}"` };
    }
    if (!existingParent && hasCyclicParentChain(nameKey)) {
      return { ...row, error: `Cyclic parent reference involving "${parentName}"` };
    }

    const parentType = existingParent
      ? typeById.get(existingParent.unit_type_id)
      : csvParentRows.length === 1
        ? typeByName.get(normalized(csvParentRows[0].values[typeIndex]))
        : undefined;
    if (parentType && unitType.level === sortedTypes[0]?.level) {
      return { ...row, error: `Top-level type "${typeName}" cannot have a parent` };
    }
    const expectedParentType = sortedTypes.find((type) => type.level === unitType.level - 1);
    if (parentType && expectedParentType && parentType.id !== expectedParentType.id) {
      return {
        ...row,
        error: `Parent "${parentName}" must have type "${expectedParentType.name}"`,
      };
    }

    return { ...row, error: undefined };
  });
}

export function planOrgUnitCsvImport(
  rows: OrgUnitCsvRow[],
  mapping: OrgUnitCsvMapping,
  existingUnits: OrgUnit[],
): OrgUnitCsvImportPlan {
  const nameIndex = columnIndex(mapping.name);
  const parentIndex = columnIndex(mapping.parent);
  const availableNames = new Set(existingUnits.map((unit) => normalized(unit.name)));
  const pending = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !row.error && !row.imported);
  const orderedIndexes: number[] = [];

  let progressed = true;
  while (progressed && pending.length > orderedIndexes.length) {
    progressed = false;
    for (const { row, index } of pending) {
      if (orderedIndexes.includes(index)) continue;
      const parentName = normalized(row.values[parentIndex]);
      if (parentName && !availableNames.has(parentName)) continue;
      orderedIndexes.push(index);
      availableNames.add(normalized(row.values[nameIndex]));
      progressed = true;
    }
  }

  const unresolved = pending.filter(({ index }) => !orderedIndexes.includes(index));
  const unresolvedByName = new Map(
    unresolved.map(({ row, index }) => [normalized(row.values[nameIndex]), { row, index }]),
  );
  const unresolvedErrors = new Map<number, string>();

  const hasCycleInParentChain = (startIndex: number): boolean => {
    const visited = new Set<number>();
    let current = unresolved.find(({ index }) => index === startIndex);
    while (current) {
      if (visited.has(current.index)) return true;
      visited.add(current.index);
      const parentKey = normalized(current.row.values[parentIndex]);
      current = unresolvedByName.get(parentKey);
    }
    return false;
  };

  for (const { row, index } of unresolved) {
    const parentName = row.values[parentIndex]?.trim();
    unresolvedErrors.set(
      index,
      hasCycleInParentChain(index)
        ? `Cyclic parent reference involving "${parentName}"`
        : `Parent "${parentName}" could not be resolved because its row is invalid or missing`,
    );
  }

  return { orderedIndexes, unresolvedErrors };
}
