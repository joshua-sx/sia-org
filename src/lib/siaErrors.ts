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
  SIA_CYCLE_NOT_DRAFT: "Only a draft cycle can be launched.",
  SIA_LAUNCH_VIA_RPC: "Use the launch action to start this cycle.",
  SIA_CLOSE_VIA_RPC: "Use the complete-cycle action to close this cycle.",
  SIA_INVALID_CYCLE_TRANSITION: "That cycle status change isn't allowed.",
  SIA_CYCLE_WINDOWS_LOCKED: "Cycle dates can't be changed after launch.",
  SIA_DELETE_DRAFT_ONLY: "Only draft cycles can be deleted.",
  SIA_CYCLE_CLOSED: "This cycle is completed and can no longer be changed.",
  SIA_NO_PARTICIPANTS: "There are no participants to launch with.",
  SIA_CYCLE_ALREADY_ACTIVE: "Another cycle is already active — complete it before launching this one.",
  SIA_INVALID_PARTICIPANT: "A participant or manager is missing or isn't in this organization.",
  SIA_EMPLOYEE_NOT_ACTIVE: "Only active employees can be included in a launch.",
  SIA_INVALID_TASK: "Unknown task type.",
  SIA_NO_ACCOUNT: "That person doesn't have a sign-in account yet, so they can't be reminded.",
  SIA_ALREADY_DONE: "That task is already complete — no reminder needed.",
  SIA_NUDGE_COOLDOWN: "A reminder for this task was already sent in the last 24 hours.",
  SIA_IMMUTABLE: "This record can't be changed.",
  SIA_INVALID_ORG_STRUCTURE: "The organization structure is invalid. Review the levels and units.",
  SIA_ORG_STRUCTURE_EXISTS: "This organization already has a structure.",
};

function errorMessage(err: unknown): string {
  return (
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : typeof err === "string"
          ? err
          : ""
  );
}

export function hasSiaErrorCode(err: unknown, code: keyof typeof SIA_MESSAGES): boolean {
  return errorMessage(err).includes(code);
}

export function friendlyError(err: unknown, fallback = "Something went wrong"): string {
  const raw = errorMessage(err);
  for (const [code, friendly] of Object.entries(SIA_MESSAGES)) {
    if (raw.includes(code)) return friendly;
  }
  return raw || fallback;
}
