# Apply appraisal migrations

The two SQL files already exist under `supabase/migrations/` but have never been executed against the Lovable Cloud database, so `appraisal_cycles`, `cycle_participants`, `goals`, `goal_ratings`, the `submit_assessment_stage` RPC and the window/lock triggers don't exist yet — every `/appraisals` route errors on first query.

## Steps

1. **Submit `20260705120000_appraisal_cycles_schema.sql`** via the migration tool for approval. Creates:
   - `interim_weight_pct` / `final_weight_pct` columns on `organizations` (30/70 default, CHECK sum=100)
   - Tables `appraisal_cycles`, `cycle_participants`, `goals`, `goal_ratings` with constraints, indexes, GRANTs, RLS enabled
   - Helper functions `current_user_role`, `current_user_employee_id`, `cycle_org`, `participant_org`, `goal_participant`
   - hr_admin manage policies + RESTRICTIVE tenant-isolation policies on all four tables
   - `updated_at` triggers

2. **Wait for approval + execution**, then submit `20260705121000_appraisal_policies_rpc.sql`. Adds:
   - Manager / employee / extra-reviewer role policies
   - `BEFORE INSERT/UPDATE` window + lock + column-guard triggers on `goals`, `goal_ratings`, `cycle_participants` (raise `SIA_WINDOW_CLOSED`, `SIA_STAGE_LOCKED`, `SIA_COLUMN_FORBIDDEN`)
   - `submit_assessment_stage(p_participant_id uuid, p_stage text)` SECURITY DEFINER RPC (weight-sum check, all-goals-rated check, stage/overall score, atomic timestamp stamp)

3. **Address any linter warnings** the tool surfaces after each run (fix ones caused by these migrations; report the rest).

4. **Verify** by loading `/appraisals` as the hr_admin — the list page should render without a Postgres "relation does not exist" error, and the hand-extended `types.ts` entries already line up with the deployed schema.

## Notes

- Two separate calls (per the tool's "no parallel" rule and the natural dependency: policies/triggers/RPC reference the tables from migration 1).
- No code changes needed — `useAppraisalCycles`, `useGoals`, `useAssessments`, `useCycleParticipants` and the pages are already written against these tables.
- No data seeding; hr_admin creates the first cycle from `/appraisals` after migrations land.
