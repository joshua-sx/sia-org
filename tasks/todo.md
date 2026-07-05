# Appraisal Cycles — Todo

See `tasks/plan.md` for full context, data model, and acceptance criteria.

## Phase 0
- [x] Task 0 — `tasks/plan.md` + `tasks/todo.md`

## Phase 1: Foundation
- [ ] Task 1 — Migration: appraisal schema + baseline RLS; extend `src/integrations/supabase/types.ts`
- [ ] Task 2 — Migration: role policies, window/lock/column-guard triggers, `submit_assessment_stage` RPC; types.ts `Functions` entry
- [ ] Task 3 — `src/lib/scoring.ts` + `src/test/scoring.test.ts`
- [ ] Checkpoint A — migrations applied on Lovable Cloud; `npm test` + `npm run lint` + `npm run build` green; human SQL review

## Phase 2: HR admin slice
- [ ] Task 4 — `cycleSchema.ts`, `useAppraisalCycles.ts`, `AppraisalCycles.tsx`, routes + sidebar nav
- [ ] Task 5 — `AppraisalCycleDetail.tsx` draft view + Launch; Dashboard `handleCta` → `/appraisals`
- [ ] Checkpoint B — admin vertical slice demo

## Phase 3: Manager slice
- [ ] Task 6 — `goalSchema.ts`, `useGoals.ts`, `MyGoals.tsx` + extra-reviewer picker
- [ ] Task 7 — `assessmentSchema.ts`, `useAssessments.ts`, `MyAssessments.tsx` (RPC submit)
- [ ] Checkpoint C — manager slice review; DB scores match TS preview

## Phase 4: Employee, reviewer, close-out
- [ ] Task 8 — `MyReview.tsx` + acknowledge
- [ ] Task 9 — extra reviewer commenting mode
- [ ] Task 10 — cycle progress + Complete cycle
- [ ] Checkpoint D — full lifecycle smoke test; adversarial "never do" walk
