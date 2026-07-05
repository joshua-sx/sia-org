# Fix "can't create cycle" + drop confusing "draft" wording

Two things going on. The runtime error `acknowledgement_due — Must be on or after final window end` shows the form's zod validation is firing: the acknowledgement date is before the final-window-end date, so submit is silently rejected. Nothing surfaces to the user because that field is inline-only and `form.handleSubmit` never reaches the `try/catch` that would toast. Separately, "draft" is jargon — every newly created cycle is a draft until launched; the noun adds no information.

## Changes

**`src/components/appraisals/CycleFormModal.tsx`**
- Button label: `Create draft cycle` → `Create cycle` (and keep `Save changes` when editing).
- Wrap submit in a handler that, on invalid, shows `toast.error("Fix the highlighted fields")` so the user isn't left wondering why the button seems dead. Use `form.handleSubmit(onValid, onInvalid)`.
- Optional polish: default `acknowledgement_due` to auto-follow `final_window_end` when it's still empty (via a small `useEffect` watching `final_window_end`) so the common case just works. Users can still edit it.

**`src/pages/AppraisalCycleDetail.tsx`**
- Line 172: `Delete this draft cycle?` → `Delete this cycle?`
- Line 175: reword "cycle is a draft" → "cycle hasn't launched yet."
- Keep the `status === "draft"` logic as-is; that's an internal state name, not user-facing copy.

**Not changed**
- DB `status` enum stays `draft | active | completed` (matches migrations, RPC guards, and existing `CYCLE_STATUS_LABELS.draft = "Draft"` which is fine as a badge).
- `CycleStatusBadge` label "Draft" is a legitimate lifecycle badge — kept.

## Verification
- Open the New cycle modal, submit with acknowledgement date before final end → red inline error + toast.
- Submit with valid dates → cycle created, modal closes.
- Detail page delete dialog reads "Delete this cycle?".
