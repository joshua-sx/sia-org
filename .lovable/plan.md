
## Goal

Build the Employees section as the foundation of the app, and turn the current disconnected setup pages into a single guided onboarding journey where the user always knows what's done, what's next, and what's skipped.

---

## Part 1 — Employees data model

New `employees` table (records only, no auth linkage yet). This is a first-class domain entity, separate from `profiles` (which is only for signed-in users).

**Fields**
- `id` uuid pk
- `organization_id` uuid → organizations
- `employee_code` text — org's internal ID (e.g. E-0421). Unique per org, optional.
- `first_name` text (required)
- `last_name` text (required)
- `email` citext (required, unique per org)
- `job_title` text
- `org_unit_id` uuid → org_units (department / team)
- `manager_id` uuid → employees (self-ref, nullable)
- `employment_type` enum: `full_time | part_time | contractor | intern`
- `employment_status` enum: `active | on_leave | terminated` (default `active`)
- `start_date` date
- `end_date` date (nullable, for terminated/contract end)
- `location` text (city / office)
- `phone` text (nullable)
- `notes` text (nullable)
- `profile_id` uuid → profiles (nullable — set later when they sign up)
- `created_at`, `updated_at`

**RLS**: same tenant-isolation pattern as `org_units` (via `current_user_org_id()`), plus `hr_admin_full_access`. GRANTs to `authenticated` and `service_role`. Managers get read on their reports later; out of scope for v1.

**Indexes**: `(organization_id)`, `(organization_id, org_unit_id)`, `(organization_id, manager_id)`, unique `(organization_id, lower(email))`, unique `(organization_id, employee_code) where employee_code is not null`.

---

## Part 2 — Employees UI (`/org/employees`)

Replaces the current "coming soon" placeholder.

**Empty state** (no employees yet)
- Header eyebrow "People" switches from yellow to **red** (`--accent-red`).
- Big focused card with three options presented as equal peers:
  1. **Upload CSV** — recommended path
  2. **Add manually** — opens the form
  3. **Skip for now** — returns to dashboard, leaves step incomplete

**Populated state**
- Toolbar: search, filter by department / status, `+ Add employee`, `Import CSV`, `Download template`.
- Table columns: Name, Email, Job title, Department, Manager, Status, Start date, actions (edit / archive).
- Row click → side panel with full detail + edit.
- Bulk select for status changes / delete.

**Add / Edit form** (drawer, one field per row, grouped)
- *Identity*: first name, last name, email, employee code
- *Role*: job title, department (org_unit picker with tree), manager (searchable employee picker), employment type
- *Employment*: status, start date, end date, location
- *Extras*: phone, notes
- Zod validation; email uniqueness checked on submit.

**CSV import** (`EmployeeCsvImportModal`, mirrors existing `CsvImportModal` pattern)
- Step 1: download template button generates `employees-template.csv` with all columns + one example row + inline column notes.
- Step 2: drop / choose file.
- Step 3: mapping preview — auto-map by header, user can remap.
- Step 4: validation table — green = ready, amber = warning (unknown department → will be blank), red = blocked (missing name/email, duplicate email). Row-level fix inline.
- Step 5: import summary — X created, Y skipped. Managers resolved by email in a second pass so order doesn't matter.

---

## Part 3 — Guided onboarding flow

Answer the UX questions directly:

### 3.1 Onboarding shell
New `OnboardingLayout` wrapping the multi-page journey. Persistent top strip visible on `/org/structure` and `/org/employees` while `organization.setup_complete === false`:

```text
 ●━━━━━━━━━●━━━━━━━━━○━━━━━━━━━○
 Account   Structure  People    Launch
 done      in progress next     locked
                                        [Skip setup →]
```

- Steps render as pill nodes with icon + label + status dot (done / current / next / skipped / locked).
- Current step pulses softly; done steps are filled green; skipped steps show a small amber "—" glyph; locked steps are muted.
- Clicking any done/skipped step navigates back to it (back is always allowed).
- "Skip setup" in the corner drops the user on the dashboard with the checklist showing what remains.

### 3.2 Step completion signals
- **Structure**: after the wizard writes types + units, show a full-page "Structure ready" success card (checkmark tick animation, count of units created), with primary CTA **"Next: add your people →"** and secondary **"Refine structure"**. This replaces today's ambiguous "wizardDone" jump.
- **People**: after first employee (or first successful CSV batch) show a compact success toast + inline banner at the top of the employees page: "3 people added. Next up: create your first appraisal cycle." Primary CTA links forward.
- Every step writes a boolean flag on `organizations` (`structure_complete`, `people_complete`, `cycle_complete`). `setup_complete` becomes true when all three are done.

### 3.3 Back / edit
- Step strip nodes are links for any step already visited.
- Each step page has a subtle "← Previous: Structure" link at the bottom.
- Wizard sub-steps (inside Structure) keep their existing back button; unchanged.

### 3.4 Skip semantics
- Skipping a step sets `<step>_skipped = true` (but not `_complete`).
- Skipped steps appear on the dashboard checklist with an amber dot and "Resume" affordance (not the green tick).
- Onboarding strip shows the skipped step with an amber dash instead of a checkmark, so the user always sees what they bypassed.

### 3.5 Dashboard checklist upgrades
- Uses the same status vocabulary as the strip (done / in progress / next / skipped / locked).
- "In progress" and "skipped" rows get a persistent **Resume** button.
- Progress percentage displayed with `tabular-nums` and a thin progress bar under the header.
- When everything is complete, the checklist collapses into a small "Setup complete ✓" chip and the "Cycle" tile expands to fill the space.

### 3.6 Micro-interactions (from make-interfaces-feel-better)
- Step strip: `motion` fill animation (100ms stagger) on load; springs with `bounce: 0`.
- Checkmark tick: SVG stroke draw on completion, once.
- Skip buttons: `active:scale-[0.96]`.
- Success banners: enter with 4px `translateY`, exit softer.
- Numbers everywhere (`3 of 4`, employee counts) use `tabular-nums`.
- No `transition: all`; specify properties.

---

## Part 4 — Color tweak

The People / Employees accent moves from `--accent-yellow` to `--accent-red` everywhere it's referenced:
- Sidebar People item icon tint
- Dashboard checklist "Add employees" row accent
- `/org/employees` eyebrow, empty-state icon tile, and header pill

`--accent-yellow` remains for the Appraisal cycle tile and any "warning / skipped" states.

---

## Technical section

**New files**
- `supabase/migrations/<ts>_employees.sql` — table, enums, indexes, RLS, GRANTs.
- `supabase/migrations/<ts>_onboarding_flags.sql` — add `structure_complete`, `people_complete`, `cycle_complete`, `structure_skipped`, `people_skipped`, `cycle_skipped` booleans on `organizations`; backfill `structure_complete` from existing `setup_complete`.
- `src/hooks/useEmployees.ts` — list, create, update, archive, bulk import (react-query).
- `src/lib/employeeSchema.ts` — Zod schemas for form + CSV row.
- `src/lib/employeeCsv.ts` — template generator, parser, validator, manager-email resolver.
- `src/components/employees/EmployeeTable.tsx`
- `src/components/employees/EmployeeFormDrawer.tsx`
- `src/components/employees/EmployeeCsvImportModal.tsx`
- `src/components/employees/EmployeeEmptyState.tsx`
- `src/components/onboarding/OnboardingStrip.tsx` — the persistent step strip.
- `src/components/onboarding/StepSuccess.tsx` — reusable success card.
- `src/contexts/OnboardingContext.tsx` — derives step statuses from `organization.*_complete/_skipped`, exposes `markComplete(step)`, `markSkipped(step)`, `resume(step)`.

**Edited files**
- `src/pages/OrgEmployees.tsx` — full rewrite around the new components.
- `src/pages/OrgStructure.tsx` — mount `OnboardingStrip` while onboarding, add "Structure ready" success step after wizard.
- `src/pages/Dashboard.tsx` — checklist upgrades, red accent for People, skipped/resume states.
- `src/components/AppSidebar.tsx` — People item icon color to `--accent-red`.
- `src/App.tsx` — wrap protected routes in `OnboardingProvider`.
- `src/contexts/AuthContext.tsx` — expose the new onboarding flags from `organization`.

**Out of scope for this pass**
- Sending invite emails / linking employees to auth accounts (called out explicitly by the user).
- Manager permission scopes on `employees` (records-only for now).
- Appraisal cycle creation flow (next milestone).

---

## Flow diagram

```text
Sign up ──▶ Structure wizard ──▶ [Structure ready ✓] ──▶ Employees ──▶ [People added ✓] ──▶ Cycle
   │             │                       │                   │                                 │
   ▼             ▼                       ▼                   ▼                                 ▼
Dashboard (checklist mirrors every step; skipped items show amber dot + Resume; back always allowed)
```
