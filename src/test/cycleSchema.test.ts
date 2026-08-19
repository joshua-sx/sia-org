import { describe, it, expect } from "vitest";
import {
  cycleFormSchema,
  formatDate,
  formatWindow,
  windowState,
  canAcknowledge,
  type CycleFormValues,
} from "@/lib/cycleSchema";

function validForm(): CycleFormValues {
  return {
    name: "FY26 Annual Review",
    goal_window_start: "2026-01-01",
    goal_window_end: "2026-01-31",
    interim_window_start: "2026-06-01",
    interim_window_end: "2026-06-30",
    final_window_start: "2026-11-01",
    final_window_end: "2026-11-30",
    acknowledgement_due: "2026-12-15",
  };
}

describe("cycleFormSchema", () => {
  it("accepts a correctly ordered timeline", () => {
    expect(cycleFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it("allows windows to share boundary dates (inclusive ordering)", () => {
    const v = validForm();
    v.interim_window_start = v.goal_window_end;
    expect(cycleFormSchema.safeParse(v).success).toBe(true);
  });

  it("rejects a window that ends before it starts", () => {
    const v = validForm();
    v.goal_window_end = "2025-12-31";
    const res = cycleFormSchema.safeParse(v);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("goal_window_end"))).toBe(true);
    }
  });

  it("rejects an interim window that starts before goal setting ends", () => {
    const v = validForm();
    v.interim_window_start = "2026-01-15";
    const res = cycleFormSchema.safeParse(v);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("interim_window_start"))).toBe(true);
    }
  });

  it("rejects an acknowledgement due date before the final window closes", () => {
    const v = validForm();
    v.acknowledgement_due = "2026-11-15";
    expect(cycleFormSchema.safeParse(v).success).toBe(false);
  });

  it("requires a name and all dates", () => {
    const v = { ...validForm(), name: "", final_window_start: "" };
    const res = cycleFormSchema.safeParse(v);
    expect(res.success).toBe(false);
  });
});

describe("windowState", () => {
  it("classifies today against an inclusive window", () => {
    expect(windowState("2026-01-01", "2026-01-31", "2025-12-31")).toBe("upcoming");
    expect(windowState("2026-01-01", "2026-01-31", "2026-01-01")).toBe("open");
    expect(windowState("2026-01-01", "2026-01-31", "2026-01-31")).toBe("open");
    expect(windowState("2026-01-01", "2026-01-31", "2026-02-01")).toBe("closed");
  });
});

describe("formatWindow", () => {
  it("formats a same-month window as 'Jul 8 → Jul 18, 2026'", () => {
    expect(formatWindow("2026-07-08", "2026-07-18")).toBe("Jul 8 → Jul 18, 2026");
  });

  it("formats a different-month same-year window as 'Jul 30 → Aug 1, 2026'", () => {
    expect(formatWindow("2026-07-30", "2026-08-01")).toBe("Jul 30 → Aug 1, 2026");
  });

  it("formats a year-spanning window as 'Dec 28, 2026 → Jan 3, 2027'", () => {
    expect(formatWindow("2026-12-28", "2027-01-03")).toBe("Dec 28, 2026 → Jan 3, 2027");
  });
});

describe("formatDate", () => {
  it("formats a single date as 'Jul 8, 2026'", () => {
    expect(formatDate("2026-07-08")).toBe("Jul 8, 2026");
  });
});

describe("canAcknowledge", () => {
  it("is false before the overall score exists", () => {
    expect(canAcknowledge({ overall_score: null, acknowledged_at: null })).toBe(false);
  });

  it("is true once scored and not yet acknowledged", () => {
    expect(canAcknowledge({ overall_score: 4.2, acknowledged_at: null })).toBe(true);
  });

  it("is false once already acknowledged (cannot re-acknowledge)", () => {
    expect(
      canAcknowledge({ overall_score: 4.2, acknowledged_at: "2026-07-01T00:00:00Z" }),
    ).toBe(false);
  });
});
