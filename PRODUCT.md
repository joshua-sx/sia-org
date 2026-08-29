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

Sia is an **organizational intelligence platform** that structures people, roles,
goals, and performance so tools like ChatGPT can securely understand and interact
with your company.

**Customer line:** Your organization, AI-ready. Connect Sia to ChatGPT and ask
your organization anything.

The signed-in app is **Layer 1 — system of record**: a multi-tenant performance-
appraisal workflow for organizations with a formal hierarchy. HR runs a dated
review cycle; managers set weighted goals and rate their reports; employees
acknowledge the final score.

It is **not** a full HRIS (payroll, recruiting, time-off), **not** a generic
OKR or 360 suite, and **not** an in-app AI chatbot.

## Name

- **Sia** (also **SIA** in code and URLs) is the product.
- Repo tagline evolving to: **Your organization, AI-ready** (legacy copy may still
  say “Smart Performance Management” in places until updated).
- The letters are **not** documented as an acronym. Do not invent an expansion.
- **Ask Sia** is the read-only intelligence layer exposed via **MCP + OAuth** to
  external AI clients (e.g. ChatGPT). Sia does not rebuild ChatGPT inside the app.
  Do not claim ChatGPT integration is live until Phase 1 MCP tools pass acceptance.

## Product layers

1. **System of record** — org structure, people, reporting lines, appraisal cycles,
   goals, assessments, performance history (what the signed-in app builds today).
2. **Intelligence layer** — read-only MCP tools that expose structured org data
   with **permission-aware** answers (RLS + role checks). ChatGPT asks; Sia decides
   what can be answered.
3. **AI interface** — ChatGPT, Claude, or another MCP-compatible client. Sia is
   not the conversation UI.

## AI-ready by design

When adding data to Sia, model **relationships**, not flat strings:

- Employee → belongs to org unit (department/team)
- Employee → reports to employee (manager)
- Employee → holds job title (Phase 2: role entity + responsibilities)
- Goal → assigned to participant (employee in a cycle)
- Appraisal → evaluates employee; completed by manager

If AI cannot traverse the relationship, the data is not ready for the intelligence
layer.

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
| AI / Ask Sia | MCP Phase 1 read tools + OAuth; org, people, goals, appraisals, pending reviews | Phase 2 analytics; Phase 3 write actions; in-app chatbot |
| Auth / enterprise | Email signup, OAuth consent for MCP clients, role checks | SSO, custom integrations (listed on Business pricing — not built) |
| Notifications | None | Email/in-app nudges for overdue reviews |

Landing, pricing, and blog copy were trued up to the **Shipped** column on
29 Aug 2026 (SSO on the Business plan is explicitly labeled coming soon). Note
the pricing section component exists but is not currently rendered on the
landing page; publishing pricing is an open go-to-market call. If new
marketing copy drifts back toward the right column, correct the copy; do not
“fix” it by changing product behavior to match the ads.

## How to talk about it

**Do say**

- Your organization, AI-ready — structure people, roles, goals, and performance;
  connect to ChatGPT; ask your organization anything.
- Organizational intelligence layer: permission-aware context for external AI.
- Performance appraisals for hierarchical orgs (Layer 1 / first domain).
- HR runs one dated cycle; managers rate reports; employees sign off.
- Extra reviewer for a second written perspective, not a second score.
- Custom org tree, not a fixed “company / department / team” template.
- ChatGPT asks; Sia decides what the authenticated user may see.

**Don’t say**

- “Sia is an AI chatbot” or “Ask Sia inside the app.”
- “ChatGPT integration is live” until Phase 1 MCP tools are shipped and tested.
- “360 reviews” unless you immediately qualify: manager rates; one optional
  commenter; no self, no peer ratings.
- “OKRs / cascading goals” as if the app enforces a cascade.
- An invented meaning for the letters S-I-A.

## MCP permission model (Phase 1)

Authorization is **per authenticated user**, not per AI client. RLS on Postgres
is the primary control; MCP tools use the user’s OAuth bearer token.

| Request | Employee | Manager | HR Admin |
|---------|----------|---------|----------|
| My appraisal / goals | Yes | Yes | Yes |
| Direct reports | — | Yes | Yes |
| Another team’s appraisals | No | No | Yes |
| Org-wide pending / overdue | No | Own team | Yes |
| All employee directory rows | Yes* | Yes* | Yes |

\*Today all org members can read all `employees` rows (RLS). Tightening manager-
scoped employee reads is tracked for Phase 1.5 before broad enterprise ChatGPT
rollout. Appraisal/participant/goal data already respects cycle RLS.

## Open product decisions

None right now. New decisions land in **Locked product decisions** below;
do not implement a side of a disputed behavior without updating this file.

## Locked product decisions

- Cycle windows are frozen after launch. HR may edit dates while a cycle is a
  draft, but an active or completed cycle keeps its original timeline.
- **Acknowledgement closes at `acknowledgement_due`** (locked 29 Aug 2026).
  Employees may acknowledge only while the cycle is `active` and on or before
  the due date. Auditability beats convenience; reopening a window would be a
  separate future feature, not a loophole.
- **`interim_score` is hidden from employees until final submit** (locked
  29 Aug 2026). Enforced at the database, not only in the UI: employees read
  via a masked view until `final_submitted_at`; managers and HR see full
  scores on the base table.
- **Goal weights may sum ≠ 100 during the goal window** (locked 29 Aug 2026).
  Managers can save work-in-progress goal sets; submit still requires exactly
  100%. This keeps the current behavior.
- **Scoring weights are org-wide, snapshotted at launch** (locked 29 Aug 2026).
  No per-cycle override of the interim/final split. The org's weights are
  copied onto the cycle at launch so changing org settings mid-cycle never
  changes an in-flight cycle's math.
- **Terminated participants are frozen** (locked 29 Aug 2026). Goal, rating,
  and assessment-submit writes are rejected when the participant's employee
  record is `terminated`. `on_leave` is treated like `active`.

See `tasks/architecture-plan.md` for engineering detail.

## Where other docs sit

| File | Trust it for |
|------|----------------|
| `PRODUCT.md` (this file) | What / who / roles / shipped vs not |
| `SPEC.md` | Cycle feature design. **Stale in places** (it still reads as if launch were a toast; SQL sketches use names like `cycle_participant_id` / `weight_pct`). Prefer migrations for columns. |
| `DESIGN.md` + `.interface-design/system.md` | Visual system. Marketing site ≠ signed-in app (two palettes on purpose). |
| `README.md` | How to run the app |
| `tasks/architecture-plan.md` | RLS / launch integrity work — not product positioning |
| `supabase/migrations/` | Actual schema and policies |
