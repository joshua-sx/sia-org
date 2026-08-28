import { describe, expect, it, vi } from "vitest";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import { persistOrgStructure } from "@/lib/persistOrgStructure";

const orgUnitType = (id: string, level: number): OrgUnitType => ({
  id,
  level,
  name: `Level ${level}`,
  organization_id: "org-1",
  created_at: null,
});

const orgUnit = (id: string, name: string): OrgUnit => ({
  id,
  name,
  organization_id: "org-1",
  parent_id: null,
  unit_type_id: "",
  depth: null,
  is_active: true,
  created_at: null,
  updated_at: null,
});

describe("persistOrgStructure", () => {
  it("creates types first and persists each depth with resolved parent IDs", async () => {
    const events: string[] = [];
    const createTypes = {
      mutateAsync: vi.fn(async () => {
        events.push("types");
        return [orgUnitType("type-1", 1), orgUnitType("type-2", 2)];
      }),
    };
    const addUnit = {
      mutateAsync: vi.fn(async ({ name, unit_type_id, parent_id }) => {
        events.push(`${name}:${unit_type_id}:${parent_id ?? "root"}`);
        return orgUnit(`id-${name}`, name);
      }),
    };

    await persistOrgStructure({
      levels: ["Division", "Team"],
      units: [
        {
          name: "Operations",
          children: [{ name: "Logistics", children: [] }],
        },
        {
          name: "Finance",
          children: [{ name: "Payroll", children: [] }],
        },
      ],
      createTypes,
      addUnit,
    });

    expect(createTypes.mutateAsync).toHaveBeenCalledWith([
      { name: "Division", level: 1 },
      { name: "Team", level: 2 },
    ]);
    expect(events).toEqual([
      "types",
      "Operations:type-1:root",
      "Finance:type-1:root",
      "Logistics:type-2:id-Operations",
      "Payroll:type-2:id-Finance",
    ]);
  });

  it("supports SetupWizard's types-only save", async () => {
    const createTypes = {
      mutateAsync: vi.fn(async () => [orgUnitType("type-1", 1)]),
    };
    const addUnit = {
      mutateAsync: vi.fn(async ({ name }) => orgUnit(`id-${name}`, name)),
    };

    await persistOrgStructure({
      levels: ["Division"],
      units: [],
      createTypes,
      addUnit,
    });

    expect(createTypes.mutateAsync).toHaveBeenCalledOnce();
    expect(addUnit.mutateAsync).not.toHaveBeenCalled();
  });

  it("enforces onboarding's unit requirement before writing types", async () => {
    const createTypes = {
      mutateAsync: vi.fn(async () => [] as OrgUnitType[]),
    };
    const addUnit = {
      mutateAsync: vi.fn(async ({ name }) => orgUnit(`id-${name}`, name)),
    };

    await expect(
      persistOrgStructure({
        levels: ["Division"],
        units: [],
        createTypes,
        addUnit,
        requireUnits: true,
      }),
    ).rejects.toThrow("At least one organization unit is required");
    expect(createTypes.mutateAsync).not.toHaveBeenCalled();
  });

  it("propagates unit creation failures and does not create descendants", async () => {
    const failure = new Error("insert failed");
    const createTypes = {
      mutateAsync: vi.fn(async () => [
        orgUnitType("type-1", 1),
        orgUnitType("type-2", 2),
      ]),
    };
    const addUnit = {
      mutateAsync: vi.fn(async ({ name }) => {
        if (name === "Operations") throw failure;
        return orgUnit(`id-${name}`, name);
      }),
    };

    await expect(
      persistOrgStructure({
        levels: ["Division", "Team"],
        units: [
          {
            name: "Operations",
            children: [{ name: "Logistics", children: [] }],
          },
        ],
        createTypes,
        addUnit,
      }),
    ).rejects.toBe(failure);
    expect(addUnit.mutateAsync).toHaveBeenCalledOnce();
  });
});
