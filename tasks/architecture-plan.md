# Implementation Plan: SIA Architecture Remediation

## Overview

Close the gaps found in the 18 Aug 2026 architecture audit: intra-tenant
privilege holes, unguarded cycle writes, launch RPC integrity, and docs/types
drift. Work is repo-first with a live Lovable Cloud check before any migration
that assumes current production policy state.

Source: [architecture audit canvas](../../.cursor/projects/Users-joshuabowers-Code-sia-org/canvases/sia-architecture-audit.canvas.tsx)
is outside this repo. In-chat audit dated 18 Aug 2026.

This plan does **not** replace `tasks/plan.md` (interface-design overhaul).

## Architecture decisions

- **RLS boundary is `current_user_org_id()`, not the JWT claim.** Keep JWT
  claims as a convenience / fail-closed overlay after the Auth hook is proven
  live. Drop JWT-OR-helper unions on org-unit restrictive policies.
- **Frontend filters are not a security control.** Every write rule that
  matters must live in RLS, triggers, or RPCs.
- **Drop `tenant_isolation_*_via_profile` FOR ALL.** Keep org-wide SELECT via
  `read_org_structure_*`. Writes stay on `hr_admin_full_access_*` with an org
  WITH CHECK.
- **Launch integrity is in the RPC plus a same-org trigger.** Do not rely on
  DraftLaunchPanel.
- **One active cycle per org is a unique partial index**, not a racy COUNT.
- **Cycle status transitions get a trigger.** Inserts default to `draft`;
  `active` only via `launch_appraisal_cycle`; `completed` only from `active`.
- **Do not treat scoring.ts as the source of truth.** `submit_assessment_stage`
  remains authoritative. Keep the TS mirror and add a SQL fixture test later
  if we add a DB test harness.

## Product decisions to lock before Phase 3–4

These change trigger behavior. Default is the safer DB-enforced option if you
do not answer:

1. **Ack after `acknowledgement_due`:** block (default) vs allow while cycle is
   active.
2. **HR editing windows on an `active` cycle:** **freeze after launch**
   (approved 29 Aug 2026).
3. **Goal weights during the goal window:** allow sum ≠ 100 until submit
   (current, keep) vs reject when the window closes.
4. **Employee API visibility of `interim_score`:** hide until
   `final_submitted_at` (default, matches SPEC) vs keep row-level SELECT and
   hide only in UI.

## Git workflow

- One branch per phase from `main`: `fix/arch-phase-N-<slug>`.
- One commit per task.
- No push/PR unless asked. Stop at every checkpoint for approval.
- Do not apply migrations to production until Phase 0 live checks pass.

## Task list

### Phase 0: Live verification — no code

**Description:** Confirm what Lovable Cloud actually enforces. Several High
findings change if policies were dropped out of band or the JWT hook is on.

**Acceptance criteria:**
- [ ] Written answers for every item in `tasks/architecture-todo.md` Phase 0
- [ ] Decision: which appraisal migration pair is live
- [ ] Decision: whether `custom_jwt_claims` is the Auth hook

**Verification:**
- [ ] Manual: Dashboard → Auth hooks, `pg_policies`, `pg_proc`, grants
- [ ] Do not treat `npm test` as evidence

**Dependencies:** None

**Files likely touched:** none (notes only, e.g. this plan)

**Estimated scope:** XS (investigation)

---

### Phase 1: Org-structure privilege holes

Branch: `fix/arch-phase-1-org-rls`

#### Task 1: Drop via_profile FOR ALL on units/types

**Description:** Remove the permissive FOR ALL policies that let any org
member mutate `org_unit_types` and `org_units`. Keep restrictive tenant
isolation and HR write policies.

**Acceptance criteria:**
- [ ] `tenant_isolation_types_via_profile` and
      `tenant_isolation_units_via_profile` are dropped
- [ ] `read_org_structure_*` still allows SELECT for all org members
- [ ] `hr_admin_full_access_*` WITH CHECK includes
      `organization_id = current_user_org_id()`

**Verification:**
- [ ] SQL review of the new migration
- [ ] Manual (staging): employee INSERT into `org_units` fails; HR insert
      succeeds; employee SELECT still works
- [ ] `npm test` still green (no schema tests exist today)

**Dependencies:** Phase 0 (confirm policies still exist live)

**Files likely touched:**
- `supabase/migrations/<ts>_drop_via_profile_forall.sql`

**Estimated scope:** S

#### Task 2: Pin `profiles_update` WITH CHECK

**Description:** RLS must refuse `organization_id` / `role` / `id` changes
even if the privilege-escalation trigger is missing.

**Acceptance criteria:**
- [ ] WITH CHECK requires `id = auth.uid()` and unchanged `organization_id`
      and `role`
- [ ] Trigger `prevent_profile_privilege_escalation` remains as defense in
      depth

**Verification:**
- [ ] Manual: `update profiles set role = 'hr_admin'` as employee fails
- [ ] Manual: `update profiles set organization_id = '<other>'` fails

**Dependencies:** Task 1 (same phase, can be same or next commit)

**Files likely touched:**
- `supabase/migrations/<ts>_profiles_update_with_check.sql`

**Estimated scope:** S

#### Task 3: Restrictive org-unit isolation uses helper only

**Description:** Rewrite `tenant_isolation_types` / `tenant_isolation_units`
RESTRICTIVE predicates to `organization_id = current_user_org_id()` only.
Drop JWT OR.

**Acceptance criteria:**
- [ ] Restrictive USING/WITH CHECK have no `auth.jwt()->>'organization_id'`
- [ ] Missing JWT claim still allows own-org access via the helper
- [ ] JWT/profile mismatch cannot union two orgs

**Verification:**
- [ ] SQL review
- [ ] Manual if a mismatched-claim session can be produced after Phase 0

**Dependencies:** Task 1

**Files likely touched:**
- `supabase/migrations/<ts>_restrictive_units_helper_only.sql`

**Estimated scope:** S

### Checkpoint A — after Phase 1
- [ ] Employee cannot mutate org structure
- [ ] HR still can
- [ ] Human approval before Phase 2

---

### Phase 2: Launch and participant integrity

Branch: `fix/arch-phase-2-launch-integrity`

#### Task 4: Same-org and active-employee checks in `launch_appraisal_cycle`

**Description:** Before insert, require each `employee_id` and `manager_id` to
exist in `employees` with `organization_id = v_org`, `employment_status =
'active'`, and `employee_id <> manager_id`.

**Acceptance criteria:**
- [ ] Foreign-org UUID raises a named `SIA_*` exception
- [ ] Terminated / missing manager rows raise
- [ ] Happy path launch still snapshots participants and sets `active`

**Verification:**
- [ ] Manual RPC calls on staging with a foreign UUID and a terminated employee
- [ ] UI launch of a valid draft still works
- [ ] `npx supabase gen types` later in Task 16 — not this task

**Dependencies:** Checkpoint A

**Files likely touched:**
- `supabase/migrations/<ts>_launch_cycle_org_checks.sql`
- `src/hooks/useAppraisalCycles.ts` (only if error mapping needs new codes)

**Estimated scope:** M

#### Task 5: Unique partial index for one active cycle

**Description:** Replace the racy COUNT with
`UNIQUE (organization_id) WHERE status = 'active'`. Keep the RPC check as a
friendly error.

**Acceptance criteria:**
- [ ] Index exists
- [ ] Two concurrent launches cannot produce two active cycles
- [ ] Completing a cycle frees the slot

**Verification:**
- [ ] Manual: complete then launch another cycle
- [ ] Optional: two parallel RPCs — second fails

**Dependencies:** Task 4 (same phase OK)

**Files likely touched:**
- `supabase/migrations/<ts>_one_active_cycle_index.sql`

**Estimated scope:** S

#### Task 6: Same-org trigger on `cycle_participants`

**Description:** BEFORE INSERT/UPDATE: employee, manager, and extra_reviewer
(if set) must share the cycle’s organization. Complements the RPC for direct
PostgREST inserts.

**Acceptance criteria:**
- [ ] Cross-org `employee_id` rejected even without the RPC
- [ ] Extra reviewer same-org
- [ ] Launch RPC still succeeds for valid rows

**Verification:**
- [ ] Manual HR insert via Data API with a foreign employee UUID fails

**Dependencies:** Task 4

**Files likely touched:**
- `supabase/migrations/<ts>_guard_participant_org.sql`

**Estimated scope:** S

### Checkpoint B — after Phase 2
- [ ] Cannot attach another org’s employee to a cycle
- [ ] Cannot have two active cycles
- [ ] Human approval

---

### Phase 3: Cycle write guards

Branch: `fix/arch-phase-3-cycle-guards`

#### Task 7: `guard_cycle_writes` trigger

**Description:** Enforce status machine: INSERT status must be `draft` (or
omitted). `draft → active` only when `sia.launch_override` is set by
`launch_appraisal_cycle`. `active → completed` allowed for HR. No
`completed → active`. Window edits: follow the locked product decision
(default freeze after launch).

**Acceptance criteria:**
- [ ] PostgREST INSERT with `status: 'active'` fails
- [ ] Launch RPC still activates
- [ ] UI Complete still works
- [ ] Delete of `active` cycles: either blocked or explicit HR-only with
      CASCADE understood

**Verification:**
- [ ] Manual Data API attempts listed above
- [ ] UI: create, launch, complete still work
- [ ] `npm test`

**Dependencies:** Checkpoint B; product decision on window edits

**Files likely touched:**
- `supabase/migrations/<ts>_guard_cycle_writes.sql`
- `src/hooks/useAppraisalCycles.ts` (error mapping)
- `src/components/appraisals/CycleFormModal.tsx` if freeze changes UI

**Estimated scope:** M

### Checkpoint C — after Phase 3
- [ ] Cannot skip launch by inserting `active`
- [ ] Human approval

---

### Phase 4: Appraisal workflow contracts

Branch: `fix/arch-phase-4-appraisal-contracts`

#### Task 8: Freeze terminated participants in guards/RPC

**Description:** `guard_goal_writes`, `guard_rating_writes`,
`guard_participant_writes`, and `submit_assessment_stage` reject writes when
the participant’s employee is `terminated` (and decide `on_leave` — default
treat like active unless product says otherwise).

**Acceptance criteria:**
- [ ] Manager cannot save ratings for a terminated report
- [ ] Submit RPC raises a named error
- [ ] Launch still excludes terminated (now in RPC too, Task 4)

**Verification:**
- [ ] Manual: terminate an employee mid-window; rating upsert fails
- [ ] UI tracker still excludes them from denominators

**Dependencies:** Checkpoint C

**Files likely touched:**
- `supabase/migrations/<ts>_freeze_terminated_participants.sql`
- `src/lib/siaErrors.ts` if new codes

**Estimated scope:** M

#### Task 9: Lock ratings during submit

**Description:** In `submit_assessment_stage`, `SELECT … FOR UPDATE` the
relevant `goal_ratings` rows (or `LOCK TABLE` in row share mode on those
ids) before the completeness check and score read.

**Acceptance criteria:**
- [ ] Concurrent rating UPDATE waits or fails until submit finishes
- [ ] Stored score matches locked rows

**Verification:**
- [ ] Staging concurrent session test, or documented SQL proof

**Dependencies:** Task 8 (same phase OK)

**Files likely touched:**
- `supabase/migrations/<ts>_submit_lock_ratings.sql`

**Estimated scope:** S

#### Task 10: Employee score visibility + ack window

**Description:** Implement the locked product decisions: hide
`interim_score` until final submit (column-level or a view used by RLS), and
enforce `acknowledgement_due` on ack if blocking was chosen.

**Acceptance criteria:**
- [ ] Employee `SELECT` on `cycle_participants` does not reveal interim
      score before `final_submitted_at` (if hide was chosen)
- [ ] Ack after due date matches the locked decision
- [ ] MyReview UI still works

**Verification:**
- [ ] Manual as employee role via Data API
- [ ] `npm test` for MyReview tests

**Dependencies:** Product decisions 1 and 4

**Files likely touched:**
- `supabase/migrations/<ts>_participant_select_and_ack.sql`
- `src/pages/MyReview.tsx` / `src/lib/cycleSchema.ts` if UI must match

**Estimated scope:** M

#### Task 11: Snapshot org scoring weights onto the cycle at launch

**Description:** Add `interim_weight_pct` / `final_weight_pct` columns on
`appraisal_cycles`, copy from `organizations` in `launch_appraisal_cycle`,
and read those in `submit_assessment_stage` for overall score.

**Acceptance criteria:**
- [ ] Changing org weights mid-cycle does not change already-launched
      cycles’ later final submits
- [ ] New drafts still pick up current org defaults at launch
- [ ] OrgScoringSettingsCard copy updated if it claims live weights apply
      to in-flight cycles

**Verification:**
- [ ] Manual: launch, change org weights, submit final — uses snapshot
- [ ] `npm test`

**Dependencies:** Task 4’s launch function body (compose with or after)

**Files likely touched:**
- `supabase/migrations/<ts>_cycle_scoring_snapshot.sql`
- `src/hooks/useAppraisalCycles.ts`
- `src/integrations/supabase/types.ts` (or regen in Task 16)
- `src/components/appraisals/OrgScoringSettingsCard.tsx`

**Estimated scope:** M

### Checkpoint D — after Phase 4
- [ ] Terminated freeze works
- [ ] Submit is not racing unlocked ratings
- [ ] Weight snapshot behaves as specified
- [ ] Human approval

---

### Phase 5: Schema hygiene

Branch: `fix/arch-phase-5-schema-hygiene`

#### Task 12: Employee hierarchy CHECKs

**Description:** `CHECK (manager_id IS NULL OR manager_id <> id)`. Unique
partial index on `employees.profile_id WHERE profile_id IS NOT NULL`.

**Acceptance criteria:**
- [ ] Self-manager rejected at DB
- [ ] Two employees cannot share a profile
- [ ] Existing bad rows documented or cleaned in the migration

**Verification:**
- [ ] Migration fails loudly if dirty data exists (pre-check query)
- [ ] Employee form still saves

**Dependencies:** Checkpoint D; live query for `manager_id = id`

**Files likely touched:**
- `supabase/migrations/<ts>_employee_hierarchy_constraints.sql`
- `src/hooks/useEmployees.ts` (surface errors from bulk manager link)

**Estimated scope:** S

#### Task 13: FORCE RLS + definer `search_path`

**Description:** `FORCE ROW LEVEL SECURITY` on `employees`,
`appraisal_cycles`, `cycle_participants`, `goals`, `goal_ratings`. Set
`search_path = pg_catalog, public` on SECURITY DEFINER helpers that currently
use `public` only.

**Acceptance criteria:**
- [ ] FORCE on those tables
- [ ] Helper functions have safe search_path
- [ ] RPCs still callable as authenticated

**Verification:**
- [ ] Staging smoke: list employees, launch, submit still work
- [ ] Confirm EXECUTE grants after 20260708072456 (Phase 0 item)

**Dependencies:** Phase 0 grant findings; Checkpoint D

**Files likely touched:**
- `supabase/migrations/<ts>_force_rls_and_search_path.sql`

**Estimated scope:** S

#### Task 14: Duplicate appraisal migration cleanup

**Description:** If live DB applied only one pair, add a no-op or delete the
unapplied duplicate files from the repo **only after** confirming
`supabase_migrations.schema_migrations`. Never drop a hash that production
already recorded.

**Acceptance criteria:**
- [ ] `supabase db reset` (local) applies cleanly
- [ ] Production migration history unchanged unless a new forward migration
      is required

**Verification:**
- [ ] Local reset
- [ ] Compare remote `schema_migrations` to files

**Dependencies:** Phase 0 replica answer

**Files likely touched:**
- `supabase/migrations/20260705231329_*.sql` and/or `20260705231437_*.sql`
  (only if unused)

**Estimated scope:** S

### Checkpoint E — after Phase 5
- [ ] Local reset green
- [ ] Human approval

---

### Phase 6: Frontend, types, documentation

Branch: `fix/arch-phase-6-frontend-docs`

#### Task 15: Regenerate Supabase types

**Description:** Regenerated `types.ts` must include `launch_appraisal_cycle`.
Remove `as never` in `useAppraisalCycles.ts`.

**Acceptance criteria:**
- [ ] Function present in `Database["public"]["Functions"]`
- [ ] No `as never` on that RPC
- [ ] `npm run build` passes

**Dependencies:** Phases 2–5 migrations applied locally

**Files likely touched:**
- `src/integrations/supabase/types.ts`
- `src/hooks/useAppraisalCycles.ts`

**Estimated scope:** S

#### Task 16: AuthContext and bulk-employee error handling

**Description:** Surface profile/org fetch errors instead of treating them as
missing profile. Check `{ error }` on bulk manager updates.

**Acceptance criteria:**
- [ ] Failed profile fetch does not send the user to `/complete-signup`
      without an error state
- [ ] CSV import reports manager-link failures
- [ ] Existing tests updated

**Verification:**
- [ ] `npm test`
- [ ] Manual: break RLS briefly in staging or mock — user sees an error

**Dependencies:** None relative to SQL phases (can start after Checkpoint A)

**Files likely touched:**
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useEmployees.ts`

**Estimated scope:** M

#### Task 17: Move `appraisalRecord` reads onto a hook

**Description:** PDF export should go through a React Query-backed fetcher
(or accept cached goals/ratings from the caller) so lib stays I/O-free.

**Acceptance criteria:**
- [ ] `src/lib/appraisalRecord.ts` has no `supabase.from`
- [ ] CycleReportsPanel still exports PDFs
- [ ] Invalidation follows `["goals"]` / `["goal_ratings"]` keys

**Verification:**
- [ ] `npm test`
- [ ] Manual PDF export on a cycle with ratings

**Dependencies:** None (frontend-only)

**Files likely touched:**
- `src/lib/appraisalRecord.ts`
- `src/hooks/useAppraisalRecord.ts` (new)
- `src/components/appraisals/CycleReportsPanel.tsx`

**Estimated scope:** S

#### Task 18: Query keys, QueryState, SPEC, architecture canvas

**Description:** Include `goalIds` in `goal_ratings` query key; stop
`useOnboarding` from invalidating the entire cache; align SPEC.md column
names with migrations; update the architecture canvas with audit
corrections.

**Acceptance criteria:**
- [ ] SPEC uses `goal_window_*`, `participant_id`, `weight`
- [ ] Canvas no longer claims uniform FORCE RLS, `weight_pct` sum
      constraint, or “pages never query Postgres” without the exceptions
- [ ] Nested appraisal cards surface `isError`

**Verification:**
- [ ] `npm test` / `npm run lint` / `npm run build`
- [ ] Canvas review beside chat

**Dependencies:** Task 15 for RPC naming on the canvas

**Files likely touched:**
- `src/hooks/useAssessments.ts`
- `src/hooks/useOnboarding.ts`
- `SPEC.md`
- architecture canvas (outside repo)
- appraisal card components

**Estimated scope:** M

### Checkpoint F — after Phase 6
- [ ] lint, test, build green
- [ ] SPEC and canvas match the DB
- [ ] Human approval

---

### Phase 7: Signup hardening (optional / ask before building)

Branch: `fix/arch-phase-7-signup` — only if product wants it. SPEC listed
notifications as ask-first; signup is a public service-role factory.

#### Task 19: Tighten signup Edge Function

**Description:** Generic errors (no Auth message leak), explicit
`verify_jwt` in `config.toml`, longer password floor if product agrees,
rate-limit strategy documented.

**Acceptance criteria:**
- [ ] Client does not receive raw Auth error strings
- [ ] Function JWT policy is explicit in config
- [ ] Signup still creates org + hr_admin

**Verification:**
- [ ] Manual signup happy path
- [ ] Manual duplicate-email does not enumerate beyond a generic message
      (product call)

**Dependencies:** Product approval

**Files likely touched:**
- `supabase/functions/signup/index.ts`
- `supabase/config.toml`
- `src/pages/Signup.tsx`

**Estimated scope:** M

## Risks and mitigations

- **Live DB differs from git:** Phase 0 is mandatory. Do not DROP policies
  that are already gone.
- **Dirty employee data blocks CHECKs:** preflight queries; data-fix commit
  before the constraint.
- **FORCE RLS breaks table-owner jobs:** smoke RPCs and MCP after Task 13.
- **Helper EXECUTE grants:** if authenticated cannot execute
  `current_user_org_id`, RLS is already fail-closed or fail-open via extra
  grants. Fix grants in the same migration as FORCE.
- **Duplicate migrations:** deleting a file that production recorded will
  brick future deploys.

## Open questions

- Phase 0 live answers (JWT hook, grants, which appraisal pair).
- The four product decisions listed above.
- Whether Phase 7 signup hardening is in scope this round.
- Whether to add a SQL test harness (pgTAP / supabase test) — not in this
  plan unless requested.
