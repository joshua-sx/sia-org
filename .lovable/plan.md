
# Employee record & entry-flow redesign

## The core insight

The org structure is **user-defined and hierarchical** (ltree of `org_units` typed by `org_unit_types` with custom levels — could be Division → Department → Team, or Region → Store, etc.).

So we should **not** hardcode `division` and `department` columns on the employee. Instead:

- Store **one** `org_unit_id` per employee → the deepest unit they belong to.
- **Derive** every ancestor (Division, Department, Team, …) from the ltree `path`.
- Show and filter by any level automatically, no matter how the org named its levels.

This is what the user is really asking for: the record must reflect the hierarchy they built — but the hierarchy is dynamic, so the field can't be.

## Employee fields — final list

### Required (core identity)
- First name
- Last name
- Work email (unique per org)
- Assigned unit (leaf of org tree — auto-derives all ancestor levels)

### Recommended (shown by default, optional)
- Employee ID
- Job title
- Manager (searchable picker of existing employees)
- Employment type — Full-time / Part-time / Contractor / Intern
- Status — Active / On leave / Terminated
- Phone

### Removed from setup flow
- Start date, End date, Location, Notes → move to a later "Employment details" edit view. Not part of onboarding.

### Derived / display-only (not inputs)
- Division, Department, Team, … → computed from the assigned unit's ancestry and rendered as a breadcrumb on the record.

## UX pattern for manual entry

Replace the current right-side drawer. It's cramped for a record this important and hides the org context.

**Use a centered modal with two clear modes**, chosen from the empty-state / "+ Add employee" button:

1. **Quick add** (default) — single compact modal, one screen:
   - Row 1: First name · Last name
   - Row 2: Work email · Employee ID
   - Row 3: Job title · Employment type
   - Row 4: **Assign to unit** — cascading picker (see below) · Manager
   - Row 5: Status · Phone
   - Footer: "Save" · "Save and add another" (keeps modal open, clears form, focuses first name)

2. **Bulk import** — existing CSV flow, unchanged in scope, but template columns match the new field list (no start/end date, no location, no division/department columns — one `unit_path` column instead, e.g. `Engineering / Platform / Infra`).

Why modal, not drawer or full page:
- Modal keeps the employee list visible behind it → users see their progress build up.
- Two-column form fits comfortably at ~640px; not cramped like the drawer.
- "Save and add another" makes manual entry of 5–20 people feel fast and rhythmic (the real manual-entry use case).
- A full page would be overkill for ~10 fields and would break the "list + add" mental model.

## The unit picker (the important new component)

A single cascading select that adapts to whatever levels the org defined.

```text
Assign to unit *
┌──────────────────────────────────────────────┐
│ Division ▾    Department ▾    Team ▾         │
│ Engineering   Platform        Infra          │
└──────────────────────────────────────────────┘
Selected: Engineering / Platform / Infra
```

- One dropdown per level in the org's `org_unit_types`, left → right by level.
- Selecting a parent filters the next level's options.
- Selection is valid when the deepest level is chosen (or when a mid-level unit has no children).
- The label under the picker shows the derived breadcrumb — this is what "Division + Department" the user was asking for.

Same picker is reused in the table's column filter and in the manager picker's scoping.

## Table changes

- Add dynamic columns for each org level (Division, Department, Team, …) derived from the unit path — replaces the single "Department" column.
- Columns are collapsible; on narrow viewports collapse into a single "Unit" breadcrumb cell.
- Filter chips per level at the top.

## Data model

**No schema change to `employees` needed** — `org_unit_id` already stores the leaf. We just stop asking for division/department as separate inputs and start deriving ancestors in the client via the existing `org_units` tree + `org_unit_types.level`.

Fields we'll stop writing from the form (kept nullable in DB, hidden in UI for now): `start_date`, `end_date`, `location`, `notes`.

CSV template updated: drop `start_date`, `location`; add single `unit_path` column parsed by splitting on `/` and matching names level-by-level.

## Files to change

- `src/lib/employeeSchema.ts` — trim required set, drop start/end/location/notes from form schema; `toDbPayload` writes nulls for those.
- `src/lib/employeeCsv.ts` — new template columns, `unit_path` resolver against the org tree.
- `src/components/employees/EmployeeFormDrawer.tsx` → **replace with** `EmployeeFormModal.tsx` (Dialog, two-column, "Save and add another").
- `src/components/employees/UnitPicker.tsx` — **new** cascading picker driven by `org_units` + `org_unit_types`.
- `src/components/employees/EmployeeTable.tsx` — dynamic per-level columns derived from unit ancestry; responsive collapse.
- `src/components/employees/EmployeeEmptyState.tsx` — copy tweaks to match new field set.
- `src/pages/OrgEmployees.tsx` — swap drawer for modal, wire "add another".

## Micro-interactions (per selected skills)

- Modal: `transform-origin: center`, scale from `0.95` + opacity, `ease-out` cubic-bezier, ~180ms.
- "Save and add another": on save, form fields clear with a 120ms staggered fade, first-name auto-focus, subtle green check pulse next to the counter ("3 people added").
- Buttons: `active:scale-[0.96]`, `transition: transform 160ms ease-out`.
- Numbers in the header count-up ("3 people in your organization") use `tabular-nums`.
- Unit picker dropdown chevron rotates 180° with `transition: transform 160ms ease-out`.

## Out of scope for this pass

- Start/end dates, location, notes (deferred to a later "Employment details" screen).
- Invite emails.
- Manager permission scopes.
- Editing the org tree from inside the employee modal (link out instead).
