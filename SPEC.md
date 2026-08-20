# Spec: Performance Appraisal Cycles

> Product positioning, roles, and shipped-vs-not: **[`PRODUCT.md`](PRODUCT.md)** (source of truth).
> This file is the cycle **feature** spec. Schema sketches below have drifted — live columns live in `supabase/migrations/` (e.g. `goals.participant_id`, `goals.weight`, not `cycle_participant_id` / `weight_pct`).

## Objective

HR admins configure and run a multi-stage performance appraisal cycle; managers set goals and submit assessments; employees acknowledge their final results. The onboarding “Launch” step should land on real cycle creation, not a placeholder.

**Users:**
- **HR Admin** — configures cycle windows and org-wide scoring weights, launches the cycle, sees org-wide progress.
- **Manager** — sets goals for their direct reports, submits interim and final assessments, optionally assigns an extra reviewer per employee.
- **Extra reviewer** (any employee, assigned by a manager) — leaves comments on an assessment, no rating authority.
- **Employee** — views their goals and, at the end of the cycle, acknowledges their final score and comments. No self-review, no rating input.

**Success looks like:** an HR admin can launch a cycle end-to-end — goal-setting window opens, managers set weighted goals for their reports, an interim assessment window opens and closes with ratings submitted, a final assessment window does the same, SIA computes each employee's weighted overall score, and the employee acknowledges it — all without leaving the app, and without engineering support.

## Tech Stack

- React 18 + TypeScript, Vite, `react-router-dom`
- Tailwind CSS + shadcn/ui (Radix primitives) — reuse existing tokens per `DESIGN.md`, no new colors
- `@tanstack/react-query` for server state, `react-hook-form` + `zod` for forms
- Supabase (Lovable Cloud) — Postgres + RLS, multi-tenant via `organization_id` JWT claim
- Vitest + Testing Library for tests

No new dependencies. No new backend (stay on Supabase/Postgres).

## Commands

```
Dev:    npm run dev
Build:  npm run build
Lint:   npm run lint
Test:   npm test              # vitest run
Watch:  npm run test:watch
```

## Project Structure

```
src/pages/
  AppraisalCycles.tsx        → HR admin: list/create cycles
  AppraisalCycleDetail.tsx   → HR admin: single cycle config + org-wide progress
  MyGoals.tsx                → Manager: set/edit goals for direct reports
  MyAssessments.tsx          → Manager: submit interim/final assessments
  MyReview.tsx               → Employee: view goals, view + acknowledge final result
src/hooks/
  useAppraisalCycles.ts      → CRUD for cycles, mirrors useEmployees.ts shape
  useGoals.ts                → CRUD for goals within a cycle
  useAssessments.ts          → submit/read interim + final assessments
  useOrgScoringSettings.ts   → read/update org-wide interim/final weight split
src/lib/
  goalSchema.ts              → zod schema + weight-sums-to-100 validation
  assessmentSchema.ts        → zod schema for per-goal ratings + comments
  scoring.ts                 → pure functions: per-stage score, overall score
supabase/migrations/
  <timestamp>_appraisal_cycles.sql   → cycles, goals, assessments, acknowledgements tables + RLS
src/test/
  scoring.test.ts            → unit tests for weighted-score math (pure, no DB)
```

## Data Model (Supabase / Postgres)

All new tables follow the existing tenant-isolation pattern seen in `org_units`/`org_unit_types`: RESTRICTIVE `tenant_isolation_*` policy on `organization_id`, PERMISSIVE `hr_admin_full_access_*` policy, and narrower PERMISSIVE read/write policies for managers/employees on their own rows.

```sql
-- org-wide scoring weights (columns on organizations, added via migration)
ALTER TABLE organizations
  ADD COLUMN interim_weight_pct SMALLINT NOT NULL DEFAULT 30
    CHECK (interim_weight_pct BETWEEN 0 AND 100),
  ADD COLUMN final_weight_pct SMALLINT NOT NULL DEFAULT 70
    CHECK (final_weight_pct BETWEEN 0 AND 100),
  ADD CONSTRAINT weights_sum_100 CHECK (interim_weight_pct + final_weight_pct = 100);

CREATE TABLE appraisal_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- e.g. "2026 Annual Review"
  goal_setting_start DATE NOT NULL,
  goal_setting_due DATE NOT NULL,
  interim_start DATE NOT NULL,
  interim_due DATE NOT NULL,
  final_start DATE NOT NULL,
  final_due DATE NOT NULL,
  acknowledgement_due DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cycle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES employees(id), -- snapshot at launch time
  extra_reviewer_id UUID REFERENCES employees(id),   -- optional, manager-assigned
  interim_submitted_at TIMESTAMPTZ,                  -- set by atomic stage submit
  final_submitted_at TIMESTAMPTZ,
  interim_score NUMERIC(4,2),                        -- computed at interim submit
  final_score NUMERIC(4,2),                          -- computed at final submit
  overall_score NUMERIC(4,2),                        -- computed at final submit
  acknowledged_at TIMESTAMPTZ,
  UNIQUE(cycle_id, employee_id)
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_participant_id UUID NOT NULL REFERENCES cycle_participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weight_pct SMALLINT NOT NULL CHECK (weight_pct BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT now()
  -- app-layer + trigger enforce: SUM(weight_pct) per cycle_participant_id = 100
  -- before goal-setting window closes
);

CREATE TABLE goal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('interim', 'final')),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  manager_comment TEXT,
  reviewer_comment TEXT,       -- from extra_reviewer, nullable
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(goal_id, stage)       -- rows are drafts, upserted until stage submit
);
```

**RLS sketch for manager writes** (the security-critical policy; extra-reviewer and employee-read policies follow the same join shape):

```sql
-- The caller's employee row, resolved via profile link
-- (SELECT id FROM employees WHERE profile_id = auth.uid())

CREATE POLICY manager_writes_ratings ON goal_ratings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    goal_id IN (
      SELECT g.id FROM goals g
      JOIN cycle_participants cp ON cp.id = g.cycle_participant_id
      WHERE cp.manager_id = (SELECT id FROM employees WHERE profile_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (same subquery);
```

The extra reviewer gets an UPDATE-only policy scoped to `reviewer_comment` (enforced via a `BEFORE UPDATE` trigger that rejects changes to `rating`/`manager_comment` when the caller is the reviewer, since Postgres RLS is row-level, not column-level). Employees get SELECT-only on their own `cycle_participant` subtree, and only after `final_submitted_at` is set for assessment data.

## Lifecycle & Window Enforcement

**Status transitions (all explicit HR-admin actions, no cron):**
- `draft → active`: HR admin clicks **Launch**. Launch snapshots all active employees into `cycle_participants` with their current `manager_id`. The launch preview lists employees **without a manager**; the admin must assign them a manager or explicitly exclude them before launch proceeds — a cycle never launches with unmanaged participants.
- `active → completed`: HR admin clicks **Complete cycle**, enabled once `acknowledgement_due` has passed or every participant has acknowledged, whichever comes first.
- Dates and settings are freely editable while `draft`. Once `active`, date edits are HR-admin-only and land in the "Ask first" boundary (they shift live windows).

**Window enforcement (defense in depth, not UI-only):**
- UI disables out-of-window actions with an explanatory tooltip.
- A `BEFORE INSERT OR UPDATE` trigger on `goals` and `goal_ratings` rejects writes outside the corresponding window (`goal_setting_start..goal_setting_due` for goals; `interim_start..interim_due` / `final_start..final_due` for ratings by stage) and rejects any write when the cycle is not `active`. RLS handles *who*, triggers handle *when*.

**Atomic stage submission:**
- Managers save `goal_ratings` rows incrementally as drafts (upsert on `UNIQUE(goal_id, stage)`), editable until submission.
- A per-stage **Submit** action requires every goal to have a rating, then sets `interim_submitted_at`/`final_submitted_at` on `cycle_participants` and computes+stores the stage score (and `overall_score` at final submit). After submission the stage's ratings are read-only (enforced by the same trigger checking the submission timestamp).
- Employees see no ratings, comments, or scores until `final_submitted_at` is set.

**Mid-cycle termination:** if a participant's employee record becomes `terminated`, their `cycle_participants` row is frozen as-is — no further writes required or allowed, they're excluded from progress counts for unsubmitted stages, and no acknowledgement is expected.

**Scoring (pure functions in `src/lib/scoring.ts`, unit-tested):**
- `stageScore(goalRatings, goalWeights)` → `Σ(rating_i * weight_i / 100)`, one call for interim, one for final.
- `overallScore(interimScore, finalScore, interimWeightPct, finalWeightPct)` → `interimScore * interimWeightPct/100 + finalScore * finalWeightPct/100`.
- Both stored denormalized on `cycle_participants` (`interim_score`, `final_score`, `overall_score`) at the moment of atomic stage submission (see Lifecycle below), so reads never recompute.

## Code Style

Mirror existing hook/schema conventions exactly. Example (`useGoals.ts`, same shape as `useEmployees.ts`):

```ts
export function useGoals(cycleParticipantId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", cycleParticipantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("cycle_participant_id", cycleParticipantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    enabled: !!cycleParticipantId,
  });

  const createGoal = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...values, cycle_participant_id: cycleParticipantId })
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", cycleParticipantId] }),
  });

  return { ...query, createGoal };
}
```

Zod schemas follow `employeeSchema.ts`: trimmed strings, explicit `.max()` bounds, a `FormValues` type export, an `empty*Form()` factory, and a `toDbPayload()` mapper. Goal weight validation (`sum === 100`) is a form-level `.superRefine()` across the goal list, not a per-field rule.

## Testing Strategy

- **Unit** (Vitest, `src/test/`): pure scoring math in `scoring.ts` — weighted averages, edge cases (0 goals, uneven weights, missing ratings).
- **Component** (Vitest + Testing Library): goal weight validation UI (blocks submit until weights sum to 100), assessment form (rating required per goal before submit), acknowledgement button (disabled until `final_score` is present).
- **RLS**: manual/SQL checks mirroring the existing `org_units` policies — a manager cannot rate another manager's report; an employee cannot see another employee's assessment; only the assigned `extra_reviewer_id` can write `reviewer_comment`.
- No e2e framework exists in this repo today; not adding one for this feature. Manual smoke test through `/run` before shipping.
- Run `npm test` and `npm run lint` before every commit touching this feature.

## Boundaries

**Always do:**
- Follow the existing tenant-isolation RLS pattern (RESTRICTIVE org policy + PERMISSIVE role policies) for every new table.
- Reuse existing design tokens (`--accent-*`, `--surface-raised`, `--hairline`) and shadcn components — no new colors or one-off components per `DESIGN.md`.
- Keep scoring math in pure, unit-tested functions separate from Supabase calls.
- Update `organizations.cycle_complete = true` when an HR admin completes their first cycle's launch, so `useOnboarding` reflects reality.

**Ask first:**
- Any change to the `organizations`, `employees`, `profiles`, or `org_units` tables (existing schema) beyond the additive columns listed above.
- Adding a notifications/email system (out of scope for v1 — flagged as a likely fast-follow, not silently added).
- Changing the onboarding flow/steps in `useOnboarding.ts` beyond wiring the real `cycle` destination.

**Never do:**
- Let a manager or extra reviewer set another employee's `overall_score` directly — it is always derived from `goal_ratings` via the pure scoring functions, never hand-edited.
- Allow acknowledgement before `final_score` is computed.
- Expose one employee's assessment/goals/ratings to another employee (including peers) — only the employee themself, their manager, their extra reviewer, and HR admins may read a given `cycle_participant` row.

## Success Criteria

- HR admin can create a cycle with all four date windows and move it `draft → active → completed` via explicit Launch / Complete actions; launch blocks until every participant has a manager or is explicitly excluded.
- Writes outside a stage's window (or against a non-`active` cycle) are rejected at the database level, not just hidden in the UI.
- A manager can save ratings incrementally as drafts, but a stage only counts (and scores) once they Submit with every goal rated; ratings lock after submission.
- A manager can set goals for each direct report that must sum to 100% weight before the goal-setting window closes.
- A manager can submit an interim assessment (per-goal 1–5 ratings + comments) during the interim window; `interim_score` is computed and stored automatically.
- The same happens for the final assessment; `overall_score` is computed automatically from org-wide weights once `final_score` exists.
- An optional extra reviewer, if assigned, can add comments to interim/final assessments but cannot set ratings.
- An employee can view their goals throughout, and after the final assessment can view their overall score + all comments and acknowledge with one click; `acknowledged_at` is recorded.
- Completing the first cycle sets `organizations.cycle_complete = true`, and the "coming soon" placeholder in the onboarding Dashboard is replaced with a real link into cycle creation.
- `npm run lint`, `npm test`, and `npm run build` all pass.

## Open Questions

- Should HR admins have a per-cycle override of the org-wide interim/final weight split, or is the org-wide default (chosen above) truly fixed for all cycles?
