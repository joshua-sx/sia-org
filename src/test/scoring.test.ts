import { describe, it, expect } from "vitest";
import { stageScore, overallScore, weightSum, formatScore } from "@/lib/scoring";

/**
 * Shared test vectors — duplicated in the comment on the
 * submit_assessment_stage RPC (supabase/migrations/20260705121000_*.sql).
 * If any expected value changes here, the SQL must change too.
 */
describe("stageScore", () => {
  it("computes the weighted score for uneven weights (50/30/20)", () => {
    expect(
      stageScore([
        { rating: 4, weight: 50 },
        { rating: 3, weight: 30 },
        { rating: 2, weight: 20 },
      ]),
    ).toBe(3.3);
  });

  it("computes 60/40 split", () => {
    expect(
      stageScore([
        { rating: 5, weight: 60 },
        { rating: 4, weight: 40 },
      ]),
    ).toBe(4.6);
  });

  it("computes 33/33/34 split with exact 2-dp result", () => {
    expect(
      stageScore([
        { rating: 3, weight: 33 },
        { rating: 4, weight: 33 },
        { rating: 5, weight: 34 },
      ]),
    ).toBe(4.01);
  });

  it("returns null when any goal is unrated", () => {
    expect(
      stageScore([
        { rating: 4, weight: 50 },
        { rating: null, weight: 50 },
      ]),
    ).toBeNull();
  });

  it("returns null when weights do not sum to 100", () => {
    expect(
      stageScore([
        { rating: 4, weight: 50 },
        { rating: 5, weight: 40 },
      ]),
    ).toBeNull();
  });

  it("returns null for an empty goal list", () => {
    expect(stageScore([])).toBeNull();
  });

  it("hits the scale bounds exactly", () => {
    expect(stageScore([{ rating: 5, weight: 100 }])).toBe(5);
    expect(stageScore([{ rating: 1, weight: 100 }])).toBe(1);
  });
});

describe("overallScore", () => {
  it("combines stage scores with the default 30/70 weights", () => {
    // 3.30 * 0.3 + 4.10 * 0.7 = 0.99 + 2.87 = 3.86
    expect(overallScore(3.3, 4.1, 30, 70)).toBe(3.86);
  });

  it("rounds a 3-dp intermediate down (3.534 -> 3.53)", () => {
    // 4.01 * 0.3 + 3.33 * 0.7 = 1.203 + 2.331 = 3.534
    expect(overallScore(4.01, 3.33, 30, 70)).toBe(3.53);
  });

  it("rounds an exact half up like SQL round(numeric, 2) (3.455 -> 3.46)", () => {
    // 4.05 * 0.3 + 3.20 * 0.7 = 1.215 + 2.240 = 3.455
    expect(overallScore(4.05, 3.2, 30, 70)).toBe(3.46);
  });

  it("supports non-default org weights (50/50)", () => {
    // 3.33 * 0.5 + 4.01 * 0.5 = 1.665 + 2.005 = 3.67
    expect(overallScore(3.33, 4.01, 50, 50)).toBe(3.67);
  });

  it("is exact at the bounds", () => {
    expect(overallScore(5, 5, 30, 70)).toBe(5);
    expect(overallScore(1, 1, 30, 70)).toBe(1);
  });
});

describe("weightSum", () => {
  it("sums goal weights", () => {
    expect(weightSum([{ weight: 40 }, { weight: 35 }, { weight: 25 }])).toBe(100);
    expect(weightSum([])).toBe(0);
  });
});

describe("formatScore", () => {
  it("renders two decimals or an em dash", () => {
    expect(formatScore(3.5)).toBe("3.50");
    expect(formatScore(4.01)).toBe("4.01");
    expect(formatScore(null)).toBe("—");
    expect(formatScore(undefined)).toBe("—");
  });
});
