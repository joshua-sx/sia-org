import { describe, expect, it } from "vitest";
import { hrDashboardNextAction } from "@/lib/hrDashboardNextAction";

describe("hrDashboardNextAction", () => {
  it("points at a draft cycle so HR can launch after setup", () => {
    const next = hrDashboardNextAction([
      { id: "c1", name: "2026 Annual Review", status: "draft" },
    ]);
    expect(next.href).toBe("/appraisals/c1");
    expect(next.ctaLabel).toBe("Open cycle");
    expect(next.title).toContain("2026 Annual Review");
  });

  it("prefers a running cycle over a leftover draft", () => {
    const next = hrDashboardNextAction([
      { id: "draft", name: "Draft", status: "draft" },
      { id: "live", name: "Q2 Review", status: "active" },
    ]);
    expect(next.href).toBe("/appraisals/live");
    expect(next.cycleStatus).toBe("active");
  });

  it("sends HR to create a cycle when none exist", () => {
    const next = hrDashboardNextAction([]);
    expect(next.href).toBe("/appraisals");
    expect(next.ctaLabel).toBe("Create a cycle");
  });
});
