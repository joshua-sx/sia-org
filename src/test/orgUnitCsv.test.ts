import { describe, expect, it } from "vitest";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import {
  inferOrgUnitCsvMapping,
  planOrgUnitCsvImport,
  validateOrgUnitCsvRows,
  type OrgUnitCsvMapping,
  type OrgUnitCsvRow,
} from "@/lib/orgUnitCsv";

const types: OrgUnitType[] = [
  {
    id: "division-type",
    organization_id: "org-1",
    name: "Division",
    level: 1,
    created_at: null,
  },
  {
    id: "team-type",
    organization_id: "org-1",
    name: "Team",
    level: 2,
    created_at: null,
  },
];

const mapping: OrgUnitCsvMapping = { name: "0", type: "1", parent: "2" };
const row = (name: string, type: string, parent = ""): OrgUnitCsvRow => ({
  values: [name, type, parent],
});
const existingUnit = (name: string, typeId: string): OrgUnit => ({
  id: `id-${name}`,
  organization_id: "org-1",
  parent_id: null,
  unit_type_id: typeId,
  name,
  depth: null,
  is_active: true,
  created_at: null,
  updated_at: null,
});

describe("org-unit CSV helpers", () => {
  it("infers standard column mappings", () => {
    expect(
      inferOrgUnitCsvMapping(["unit_name", "unit_type", "parent_unit_name"]),
    ).toEqual(mapping);
  });

  it("accepts a forward parent reference and orders the parent first", () => {
    const rows = [row("Payroll", "Team", "Finance"), row("Finance", "Division")];
    const validated = validateOrgUnitCsvRows(rows, mapping, types, []);

    expect(validated.map(({ error }) => error)).toEqual([undefined, undefined]);
    expect(planOrgUnitCsvImport(validated, mapping, []).orderedIndexes).toEqual([1, 0]);
  });

  it("uses existing parent lookup and validates the parent's type level", () => {
    const existing = [existingUnit("Finance", "division-type")];
    const valid = validateOrgUnitCsvRows(
      [row("Payroll", "Team", "Finance")],
      mapping,
      types,
      existing,
    );
    const invalid = validateOrgUnitCsvRows(
      [row("Treasury", "Division", "Finance")],
      mapping,
      types,
      existing,
    );

    expect(valid[0].error).toBeUndefined();
    expect(planOrgUnitCsvImport(valid, mapping, existing).orderedIndexes).toEqual([0]);
    expect(invalid[0].error).toBe('Top-level type "Division" cannot have a parent');
  });

  it("validates an in-file parent's type when it is unambiguous", () => {
    const validated = validateOrgUnitCsvRows(
      [row("Platform", "Team", "Payroll"), row("Payroll", "Team", "Finance")],
      mapping,
      types,
      [existingUnit("Finance", "division-type")],
    );

    expect(validated[0].error).toBe('Parent "Payroll" must have type "Division"');
    expect(validated[1].error).toBeUndefined();
  });

  it("rejects duplicate names within a CSV case-insensitively", () => {
    const validated = validateOrgUnitCsvRows(
      [row("Finance", "Division"), row(" finance ", "Division")],
      mapping,
      types,
      [],
    );

    expect(validated.map(({ error }) => error)).toEqual([
      'Duplicate unit name in CSV: "Finance"',
      'Duplicate unit name in CSV: "finance"',
    ]);
  });

  it("keeps valid rows importable when another row has a missing parent", () => {
    const validated = validateOrgUnitCsvRows(
      [row("Finance", "Division"), row("Payroll", "Team", "Missing")],
      mapping,
      types,
      [],
    );

    expect(validated[1].error).toBe('Parent not found: "Missing"');
    expect(planOrgUnitCsvImport(validated, mapping, []).orderedIndexes).toEqual([0]);
  });

  it("reports cyclic parent references clearly", () => {
    const cyclicRows = [
      row("Alpha", "Team", "Beta"),
      row("Beta", "Team", "Alpha"),
    ];
    const validated = validateOrgUnitCsvRows(cyclicRows, mapping, types, []);
    const plan = planOrgUnitCsvImport(cyclicRows, mapping, []);

    expect(validated.map(({ error }) => error)).toEqual([
      'Cyclic parent reference involving "Beta"',
      'Cyclic parent reference involving "Alpha"',
    ]);
    expect(plan.orderedIndexes).toEqual([]);
    expect(plan.unresolvedErrors.get(0)).toBe(
      'Cyclic parent reference involving "Beta"',
    );
    expect(plan.unresolvedErrors.get(1)).toBe(
      'Cyclic parent reference involving "Alpha"',
    );
  });

  it("distinguishes an invalid parent row from a cycle", () => {
    const rows = [
      row("Payroll", "Team", "Finance"),
      { ...row("Finance", "Division"), error: "Unknown type" },
    ];
    const plan = planOrgUnitCsvImport(rows, mapping, []);

    expect(plan.unresolvedErrors.get(0)).toBe(
      'Parent "Finance" could not be resolved because its row is invalid or missing',
    );
  });
});
