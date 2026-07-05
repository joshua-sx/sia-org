/**
 * Client-side mirror of the scoring math in the `submit_assessment_stage`
 * Postgres RPC (supabase/migrations/20260705121000_appraisal_policies_rpc.sql).
 * The RPC is the authoritative implementation — these functions exist for
 * live form previews and unit tests. The shared test vectors live in
 * src/test/scoring.test.ts and are duplicated in the RPC's comment; if the
 * math changes, both must change together.
 *
 * All arithmetic is done in integer space so that rounding matches Postgres
 * `round(numeric, 2)` (half away from zero) instead of IEEE-754 half-even
 * drift, e.g. overall(4.05, 3.20, 30, 70) = 3.455 must round to 3.46.
 */

export interface GoalRatingInput {
  /** 1–5, or null while the manager hasn't rated the goal yet. */
  rating: number | null;
  /** Goal weight in percent (1–100). */
  weight: number;
}

/** Round to 2 decimals, half away from zero, matching SQL round(numeric, 2). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Weighted stage score: Σ(rating × weight) / 100, on the 1–5 scale.
 * Returns null unless every goal is rated and weights sum to exactly 100 —
 * the same conditions the RPC enforces before computing a score.
 */
export function stageScore(ratings: GoalRatingInput[]): number | null {
  if (ratings.length === 0) return null;
  let weightSum = 0;
  let weighted = 0;
  for (const { rating, weight } of ratings) {
    if (rating === null) return null;
    weightSum += weight;
    weighted += rating * weight;
  }
  if (weightSum !== 100) return null;
  // rating and weight are integers, so weighted/100 is exact at 2 decimals.
  return weighted / 100;
}

/**
 * Overall score from the two stage scores (already 2-dp values) and the
 * organization's stage weights (integers summing to 100):
 * round(interim × interimPct/100 + final × finalPct/100, 2).
 */
export function overallScore(
  interim: number,
  final: number,
  interimPct: number,
  finalPct: number,
): number {
  // Work in "cents" (score × 100) so the half-up rounding is exact.
  const interimCents = Math.round(interim * 100);
  const finalCents = Math.round(final * 100);
  const totalCents = (interimCents * interimPct + finalCents * finalPct) / 100;
  return Math.round(totalCents) / 100;
}

/** Sum of goal weights — UI readiness check (must equal 100 to submit). */
export function weightSum(goals: Array<{ weight: number }>): number {
  return goals.reduce((acc, g) => acc + g.weight, 0);
}

/** Format a 2-dp score for display, e.g. 3.5 -> "3.50". */
export function formatScore(score: number | null | undefined): string {
  return score == null ? "—" : score.toFixed(2);
}
