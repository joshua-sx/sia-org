import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOrgStructureRpcPayload,
  persistOrgStructure,
  validateOrgStructureForSave,
} from "@/lib/persistOrgStructure";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc },
}));

describe("persistOrgStructure", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: undefined, error: null });
  });

  it("maps ordered levels and the nested tree into one RPC call", async () => {
    await persistOrgStructure({
      levels: ["Division", "Team"],
      units: [
        {
          name: "Operations",
          children: [{ name: "Logistics", children: [] }],
        },
      ],
    });

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("create_org_structure", {
      p_levels: [
        { name: "Division", level: 1 },
        { name: "Team", level: 2 },
      ],
      p_units: [
        {
          name: "Operations",
          children: [{ name: "Logistics", children: [] }],
        },
      ],
    });
  });

  it("supports SetupWizard's types-only save with an empty units array", async () => {
    await persistOrgStructure({
      levels: ["Division"],
      units: [],
    });

    expect(rpc).toHaveBeenCalledWith("create_org_structure", {
      p_levels: [{ name: "Division", level: 1 }],
      p_units: [],
    });
  });

  it("enforces onboarding's unit requirement before invoking the RPC", async () => {
    await expect(
      persistOrgStructure({
        levels: ["Division"],
        units: [],
        requireUnits: true,
      }),
    ).rejects.toThrow("At least one organization unit is required");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propagates the database RPC error", async () => {
    const failure = { message: "SIA_INVALID_ORG_STRUCTURE: invalid tree" };
    rpc.mockResolvedValue({ data: undefined, error: failure });

    await expect(
      persistOrgStructure({
        levels: ["Division"],
        units: [],
      }),
    ).rejects.toBe(failure);
  });
});

describe("organization structure payload and validation", () => {
  it("strips UI-only fields while recursively preserving sibling order", () => {
    const units = [
      {
        name: "Operations",
        expanded: true,
        children: [
          { name: "Logistics", expanded: false, children: [] },
          { name: "Facilities", expanded: true, children: [] },
        ],
      },
    ];

    expect(buildOrgStructureRpcPayload(["Division", "Team"], units)).toEqual({
      p_levels: [
        { name: "Division", level: 1 },
        { name: "Team", level: 2 },
      ],
      p_units: [
        {
          name: "Operations",
          children: [
            { name: "Logistics", children: [] },
            { name: "Facilities", children: [] },
          ],
        },
      ],
    });
  });

  it("validates requireUnits without depending on a caller or mutation mock", () => {
    expect(() => validateOrgStructureForSave([], false)).not.toThrow();
    expect(() => validateOrgStructureForSave([], true)).toThrow(
      "At least one organization unit is required",
    );
  });
});
