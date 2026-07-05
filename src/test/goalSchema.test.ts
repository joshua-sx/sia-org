import { describe, it, expect } from "vitest";
import { goalFormSchema } from "@/lib/goalSchema";
import { weightSum } from "@/lib/scoring";

describe("goalFormSchema", () => {
  it("accepts a valid goal", () => {
    const res = goalFormSchema.safeParse({ title: "Ship the redesign", description: "", weight: 40 });
    expect(res.success).toBe(true);
  });

  it("rejects weight below 1 or above 100", () => {
    expect(goalFormSchema.safeParse({ title: "x", weight: 0 }).success).toBe(false);
    expect(goalFormSchema.safeParse({ title: "x", weight: 101 }).success).toBe(false);
  });

  it("rejects a non-integer weight", () => {
    expect(goalFormSchema.safeParse({ title: "x", weight: 33.5 }).success).toBe(false);
  });

  it("requires a title", () => {
    expect(goalFormSchema.safeParse({ title: "", weight: 50 }).success).toBe(false);
  });
});

describe("weight sum readiness (list-level check surfaced in MyGoals/ParticipantGoalsCard)", () => {
  it("is ready only when goal weights sum to exactly 100", () => {
    expect(weightSum([{ weight: 60 }, { weight: 40 }])).toBe(100);
    expect(weightSum([{ weight: 60 }, { weight: 30 }])).not.toBe(100);
    expect(weightSum([{ weight: 60 }, { weight: 50 }])).not.toBe(100);
  });
});
