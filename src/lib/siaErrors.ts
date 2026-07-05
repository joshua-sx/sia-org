/**
 * The appraisal guard triggers and submit RPC raise Postgres exceptions whose
 * messages start with a stable SIA_* code (see
 * supabase/migrations/20260705121000_appraisal_policies_rpc.sql). Map them to
 * copy suitable for a toast instead of surfacing raw Postgres errors.
 */
const SIA_MESSAGES: Record<string, string> = {
  SIA_WINDOW_CLOSED: "This window is closed — changes aren't allowed right now.",
  SIA_STAGE_LOCKED: "This item is locked because the stage has been submitted.",
  SIA_CYCLE_NOT_ACTIVE: "The appraisal cycle isn't active.",
  SIA_COLUMN_FORBIDDEN: "You don't have permission to make that change.",
  SIA_NOT_AUTHORIZED: "You don't have permission to do that.",
  SIA_NOT_SCORED: "The overall score isn't available yet.",
  SIA_NO_GOALS: "No goals have been set for this participant.",
  SIA_WEIGHTS_NOT_100: "Goal weights must add up to 100% before submitting.",
  SIA_RATINGS_INCOMPLETE: "Every goal needs a rating before you can submit.",
  SIA_INTERIM_NOT_SUBMITTED: "Submit the interim assessment before the final one.",
  SIA_INVALID_STAGE: "Unknown assessment stage.",
  SIA_NOT_FOUND: "This participant no longer exists.",
};

export function friendlyError(err: unknown, fallback = "Something went wrong"): string {
  const raw =
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err ?? "");
  for (const [code, friendly] of Object.entries(SIA_MESSAGES)) {
    if (raw.includes(code)) return friendly;
  }
  return raw || fallback;
}
