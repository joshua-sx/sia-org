# Appraisal Cycles — Todo

See `tasks/plan.md` for full context, data model, and acceptance criteria.

## Phase 0
- [x] Task 0 — `tasks/plan.md` + `tasks/todo.md`

## Phase 1: Foundation
- [x] Task 1 — Migration: appraisal schema + baseline RLS; extend `src/integrations/supabase/types.ts`
- [x] Task 2 — Migration: role policies, window/lock/column-guard triggers, `submit_assessment_stage` RPC; types.ts `Functions` entry
- [x] Task 3 — `src/lib/scoring.ts` + `src/test/scoring.test.ts`
- [x] Checkpoint A — `npm test` + `npm run lint` + `npm run build` green locally.
      **Outstanding:** the two migrations have not been applied to the live Lovable Cloud
      Supabase project from this session (no `supabase` CLI link/token available here) —
      that application, and a human SQL review, still need to happen before the appraisal
      tables exist for real use.

## Phase 2: HR admin slice
- [x] Task 4 — `cycleSchema.ts`, `useAppraisalCycles.ts`, `AppraisalCycles.tsx`, routes + sidebar nav
- [x] Task 5 — `AppraisalCycleDetail.tsx` draft view + Launch; Dashboard `handleCta` → `/appraisals`
- [ ] Checkpoint B — admin vertical slice demo (blocked on migrations being applied)

## Phase 3: Manager slice
- [x] Task 6 — `goalSchema.ts`, `useGoals.ts`, `MyGoals.tsx` + extra-reviewer picker
- [x] Task 7 — `assessmentSchema.ts`, `useAssessments.ts`, `MyAssessments.tsx` (RPC submit)
- [ ] Checkpoint C — manager slice review; DB scores match TS preview (blocked on migrations being applied)

## Phase 4: Employee, reviewer, close-out
- [x] Task 8 — `MyReview.tsx` + acknowledge
- [x] Task 9 — extra reviewer commenting mode (built into `ParticipantAssessmentCard` reviewer mode + `MyAssessments` reviewer lane)
- [x] Task 10 — cycle progress + Complete cycle (built into `AppraisalCycleDetail`'s `ProgressPanel`)
- [ ] Checkpoint D — full lifecycle smoke test; adversarial "never do" walk (blocked on migrations being applied)

## Verification done this session
- `npm test` — 30/30 passing (scoring, cycle window/ordering, acknowledge gating, goal schema)
- `npx tsc -p tsconfig.app.json --noEmit` — clean
- `npm run lint` — no new errors (pre-existing errors in `supabase/functions/mcp/index.ts` and
  `tailwind.config.ts` are unrelated to this change)
- `npm run build` — succeeds
- Playwright smoke test against the dev server: `/login` renders correctly with no console
  errors; `/appraisals`, `/appraisals/goals`, `/appraisals/assessments`, `/appraisals/my-review`,
  and `/dashboard` all redirect cleanly to `/login` when unauthenticated (`ProtectedRoute`
  working, no JS crashes)

## Follow-up for the user
1. Apply `supabase/migrations/20260705120000_appraisal_cycles_schema.sql` and
   `20260705121000_appraisal_policies_rpc.sql` via Lovable Cloud.
2. Re-run the Checkpoint B/C/D smoke tests against real data (create a cycle, launch it,
   set goals, submit interim/final, acknowledge, complete).
3. SPEC.md was approved in the originating local session but is not in this repo clone —
   if it gets pushed, reconcile it against `tasks/plan.md`'s embedded "Spec summary" section.
