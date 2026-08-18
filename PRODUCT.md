# SIA — Product brief

**This file is the source of truth** for what SIA is, who it is for, what shipped,
and how to talk about it. If another file disagrees with this one, this one wins
until this file is updated.

| Audience | Read this |
|----------|-----------|
| Newcomer | All of it |
| Salesperson | Purpose, audience, roles, cycle, **Shipped vs not**, **How to talk about it** |
| Agent / engineer | All of it, then `SPEC.md` for cycle mechanics and `supabase/migrations/` for schema |

## One sentence

SIA is a **multi-tenant performance-appraisal product** for organizations with a
formal hierarchy. HR runs a dated review cycle; managers set weighted goals and
rate their reports; employees acknowledge the final score.

It is **not** a full HRIS (payroll, recruiting, time-off) and **not** a generic
OKR or 360 suite.

## Name

- **SIA** is the product. Tagline in the repo: **Smart Performance Management**.
- The letters are **not** documented as an acronym beyond that tagline. Do not
  invent an expansion.
- **Sia AI** (“Ask Sia”) is a **coming-soon** assistant on the marketing site.
  It is not part of the signed-in product.

## Who it is for

Structured orgs where reviews have windows, roles, and an audit trail — the
marketing site names government, aviation, healthcare, and education. The
software itself is industry-agnostic: custom org-unit types, employees, managers,
and cycles.

## Roles

**Profile roles** (`profiles.role` — one per signed-in user):

| Role | Job in SIA |
|------|------------|
| **HR Admin** | Owns the tenant: hierarchy, employee records, cycle dates and scoring weights, launch/complete, org-wide progress. The first signup user is an HR admin. |
| **Manager** | Sets goals and submits interim/final assessments for **direct reports**. |
| **Employee** | Sees own goals; after the final assessment is submitted, sees score and comments and **acknowledges**. Does not rate themselves. |

**Not a profile role:**

| Role | Job in SIA |
|------|------------|
| **Extra reviewer** | Optional person a manager assigns on a participant. **Comments only** — no ratings. Any employee in the org can be picked. |

**Manager is also a reporting line.** `employees.manager_id` is copied onto the
cycle at launch. Someone can have `role = employee` and still be another person’s
manager in the org chart.

## What the product does (shipped)

1. **Workspace** — one organization per tenant; isolation is enforced in Postgres
   (RLS / helpers), not only in the UI.
2. **Onboarding** — Account → Structure → People → Cycle.
3. **Org structure** — custom levels (e.g. ministry / division / unit) and units.
4. **People** — employee records, CSV import, manager assignment.
5. **Appraisal cycle** — HR creates a draft with four windows (goal setting,
   interim, final, acknowledgement), launches it (snapshots participants +
   managers), managers work the windows, HR completes the cycle.
6. **Goals** — manager-owned, weighted; weights must sum to 100% before a stage
   can be scored.
7. **Assessments** — per-goal 1–5 ratings + comments; extra-reviewer comments;
   scores stored at stage submit (interim, then overall at final).
8. **Employee acknowledgement** — after final submit.
9. **Progress / reports** — cycle progress in-app; PDF/export for records.

Primary app routes: `/dashboard`, `/org/structure`, `/org/employees`,
`/appraisals` (plus goals, assessments, my-review).

## Cycle in one picture

```
HR drafts cycle + windows
        ↓ Launch (every participant has a manager, or is excluded)
Managers set weighted goals          [goal window]
Managers (+ extra reviewer comments) [interim window] → interim score
Managers (+ extra reviewer comments) [final window]   → overall score
Employee acknowledges                [acknowledgement window]
        ↓ HR completes cycle
```

Scoring: weighted average of goal ratings per stage; overall =
`interim × org interim % + final × org final %` (defaults 30 / 70).

## Shipped vs not

Use this table in demos and copy. **Do not sell the right column as live.**

| Topic | Shipped | Not shipped / do not claim |
|-------|---------|----------------------------|
| Reviews | Manager ratings + optional extra-reviewer **comments** | Full **360°** (self + peer + manager as raters). Employees do **not** self-review. |
| Goals | Manager sets goals per report for the cycle | Org-wide **OKR cascade** (company → team → person) as a first-class feature |
| Analytics | Cycle progress, scores, reports/PDF | Trend dashboards across years/departments as a product surface |
| AI | Landing preview only | In-app “Ask Sia” |
| Auth / enterprise | Email signup, OAuth consent stub, role checks | SSO, custom integrations (listed on Business pricing — not built) |
| Notifications | None | Email/in-app nudges for overdue reviews |

The public landing page, pricing cards, and some blog copy still describe the
**not shipped** column (especially 360°, cascading goals, analytics, SSO). Treat
those as **aspirational marketing**. Correct them in copy before a sales push;
do not “fix” them by changing product behavior to match the ads.

## How to talk about it

**Do say**

- Performance appraisals for hierarchical orgs.
- HR runs one dated cycle; managers rate reports; employees sign off.
- Extra reviewer for a second written perspective, not a second score.
- Custom org tree, not a fixed “company / department / team” template.

**Don’t say**

- “360 reviews” unless you immediately qualify: manager rates; one optional
  commenter; no self, no peer ratings.
- “OKRs / cascading goals” as if the app enforces a cascade.
- “Sia AI is available.”
- An invented meaning for the letters S-I-A.

## Open product decisions

These are unresolved on purpose. Do not implement a side without updating this
file:

- Per-cycle override of org interim/final weights vs org-wide only.
- Whether employees may acknowledge after `acknowledgement_due`.
- Whether HR may edit windows after launch.
- Whether `interim_score` is hidden from employees until final submit (SPEC)
  or only hidden in the UI.

See `tasks/architecture-plan.md` for the engineering defaults if nobody answers.

## Where other docs sit

| File | Trust it for |
|------|----------------|
| `PRODUCT.md` (this file) | What / who / roles / shipped vs not |
| `SPEC.md` | Cycle feature design. **Stale in places** (it still reads as if launch were a toast; SQL sketches use names like `cycle_participant_id` / `weight_pct`). Prefer migrations for columns. |
| `DESIGN.md` + `.interface-design/system.md` | Visual system. Marketing site ≠ signed-in app (two palettes on purpose). |
| `README.md` | How to run the app |
| `tasks/architecture-plan.md` | RLS / launch integrity work — not product positioning |
| `supabase/migrations/` | Actual schema and policies |
