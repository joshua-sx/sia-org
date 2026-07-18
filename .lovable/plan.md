## Three shared demo accounts — one per role

Ship **one demo account per role** in the same pre-seeded demo org so you can jump between perspectives and see every page as HR, as a manager, and as an individual contributor.

All three land in the same `Acme Corp (Demo)` organization, so switching accounts changes only the vantage point (which employees, cycles, goals, and reviews you're allowed to see through RLS), not the underlying data.

### Credentials (post-run)

```text
Email                 Password         Role       Sees
hr@sia.demo           DemoHR2026!      hr_admin   Everyone · every cycle · every goal
manager@sia.demo      DemoMgr2026!     manager    Own row + direct reports' goals/reviews
employee@sia.demo     DemoEmp2026!     employee   Only own goals, assessments, review
```

Emails use `@sia.demo` (a reserved TLD safe from real inboxes) and land on `/dashboard` after login — no email confirmation, no onboarding.

### Where each account renders meaningfully

| Route | hr@ | manager@ | employee@ |
| --- | --- | --- | --- |
| `/dashboard` | Full KPIs, pending actions, active-cycle table | Personal appraisal card + team quick view | Personal appraisal card only |
| `/org/structure` | Full tree, editable | Read-only tree | Read-only tree |
| `/org/employees` | Full list, add/edit/import | Full list (read) | Full list (read) |
| `/appraisals` | All cycles, launch/complete | Cycles they participate in / manage | Cycles they participate in |
| `/appraisals/:id` | Full participants panel | Their direct reports' rows | Own row |
| `/appraisals/goals` | Own (linked to an employee too) | Own goals for own participant | Own goals |
| `/appraisals/assessments` | List of assessments they own | 3 direct reports, mixed stages | Own only |
| `/appraisals/assessments/:id` | Any | Own reports | Own |
| `/appraisals/my-review` | Own (their employee row is a participant) | Own review, final submitted, ready to acknowledge | Own review, awaiting manager |

### Demo org content (shared by all three)

- `Acme Corp (Demo)` organization.
- 3 unit types (Division · Department · Team), 3-level hierarchy across Engineering / Product / People / Finance.
- **15 employees** with realistic names, titles, emails, unit assignments, and manager links. Three of them are wired to the three demo profiles:
  - `hr@sia.demo` → **Alex HR** (People · Talent), role `hr_admin`.
  - `manager@sia.demo` → **Morgan Lee** (Engineering › Platform), role `manager`, has **3 direct reports** so `/appraisals/assessments` is populated.
  - `employee@sia.demo` → **Sam Rivera** (Engineering › Platform › API Team), role `employee`, reports to Morgan.
- **Active cycle `H1 2026 Review`** with date windows around today (goal window closed, interim window open, final window a few weeks out).
- **15 cycle participants** with managers wired to the above chain.
- **3 goals per participant** (weights 40/30/30 = 100) so the submit RPC accepts them.
- **Mixed assessment states** so every UI state has data:
  - 5 participants: interim submitted (scored).
  - 3 participants: final submitted (overall score computed).
  - 1 participant (`manager@sia.demo`'s own row): final submitted, **acknowledgement pending** — so `/appraisals/my-review` for the manager account shows the "Acknowledge" state.
  - 1 participant: fully acknowledged.
  - `employee@sia.demo`'s row: interim in progress, goals set — so employee-side "My Goals" and "My Review" both render.

### How it works

New edge function **`supabase/functions/seed-demo-account/index.ts`** (deployed with `verify_jwt=false`, guarded by a `SEED_TOKEN` header):

1. Uses `SUPABASE_SERVICE_ROLE_KEY` to `auth.admin.createUser` (or fetch) each of the three demo emails with `email_confirm: true`.
2. Idempotent: on run it deletes any prior `Acme Corp (Demo)` org first (cascade wipes its employees / cycles / goals / participants), then rebuilds fresh. Auth users are reused so passwords remain stable.
3. Creates org → unit types → units → employees → profiles (linking each of the three auth users to their employee row via `profile_id` and setting `role` correctly).
4. Creates the active cycle and enrolls all 15 participants with correct managers.
5. Inserts 3 goals per participant and calls the existing **`submit_assessment_stage`** RPC for the interim/final submissions so scores, timestamps, and triggers stay consistent with production logic.
6. Acknowledges the one designated participant via service-role update.
7. Accepts `?reset=1` to force a full re-seed anytime.
8. Onboarding is auto-bypassed for all three accounts because `useOnboarding` gates on `structureDone` (units exist).

No client code, no UI changes, no schema changes.

### Secrets

- `SEED_TOKEN` — generated via `generate_secret` (32 chars), guards the function so nobody can trigger a public reset.
- Existing `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are reused.

### Files touched

- `supabase/functions/seed-demo-account/index.ts` — new. All seeding logic.

### After implementation

I invoke the function once and paste the three sign-in blocks back into chat. Whenever the cycle dates drift out of window (weeks later), tell me and I'll re-invoke it to refresh — no manual DB work on your side.
