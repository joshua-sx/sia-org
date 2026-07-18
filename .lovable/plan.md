## Redesign the post-setup Dashboard (`/dashboard`) to match the reference layout

Reference: uploaded Taskplus dashboard — greeting header with meta + actions, 4 KPI stat cards with deltas, two-column "today's list + performance chart" band, and a projects table with progress bars and owner avatars.

Scope: only the post-setup `Dashboard` (`src/pages/Dashboard.tsx`). The onboarding `SetupDashboard` and shared chrome (sidebar, header, footer) stay untouched. Colors and type come from the existing SIA tokens — no new palette.

### Layout (top to bottom)

```text
┌────────────────────────────────────────────────────────────────┐
│ Welcome, {first}  👋              Last updated · {date}        │
│ {org.name} · {role}               [Export]  [+ New cycle]      │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ Active      │ Employees   │ Assessments │ Completed reviews    │
│ cycles  2   │        24   │ in progress │              48      │
│ +1 vs last  │  +3 vs last │      12     │  +15 vs last cycle   │
├──────────────────────────────────┬─────────────────────────────┤
│ Your pending actions      Filter │ Completion       (weekly ▾) │
│ ─────────────────────────────── │  ▂ ▄ ▅ ▃ ▆ ▇   86%          │
│ · Review Ada's Q2 goals   Due..  │  Mon Tue Wed…   +15% wk     │
│ · Approve 3 self-reviews  Due..  │                             │
│ · Sign off cycle "H1 2026" Due.. │                             │
├────────────────────────────────────────────────────────────────┤
│ Active cycles                                        Filter    │
│ Name          Status      Progress   Participants  Due    Owner│
│ H1 2026       In progress ▓▓▓▓░ 70%  14/20        12 Mar  MM   │
│ Leadership    Draft       ░░░░░  0%   0/7         20 Mar  SK   │
│ …                                                              │
└────────────────────────────────────────────────────────────────┘
```

### Section-by-section

1. **Header band** — keeps `PageHeader` title `Welcome, {first} 👋`. Subtitle becomes `{org.name} · {role label}`. Right side: small "Last updated · {date}" meta line above two pill buttons — `Export` (ghost, `Download` icon) and `+ New cycle` (primary blue, links to `/appraisals`). If no cycle exists yet, the primary is `+ Create cycle`.

2. **KPI row (4 cards)** — grid `grid-cols-2 lg:grid-cols-4 gap-3`. Each card: `rounded-xl border-hairline bg-surface-raised p-4`, label in `text-[11px] uppercase tracking-wider ink-subtle`, large `text-3xl font-semibold tabular-nums font-[Space_Grotesk]`, and a delta chip (`+N vs last cycle`) using accent-green for positive / accent-red for negative. Metrics, computed from existing hooks:
   - **Active cycles** — count of `appraisal_cycles` with status `active` (via `useAppraisalCycles`).
   - **Employees** — `useEmployees().length`.
   - **Assessments in progress** — `useCycleParticipants(activeCycle.id)` where stage ∈ {`self_assessment`,`manager_assessment`,`calibration`}.
   - **Completed reviews** — participants with stage `acknowledged` in the active cycle.
   Deltas are best-effort; when no prior data exists show a subtle "—" instead of fabricating numbers.

3. **Two-column band** (`grid lg:grid-cols-[1fr_360px] gap-4`):
   - **Left — "Your pending actions"** card. Reuses `DashboardAppraisalCard` data plus HR-side actions when `role === 'hr_admin'`: goals awaiting approval, assessments due today, cycles ready to sign off. Each row: small colored icon dot (blue for review, green for approve, red for sign-off), title, secondary "Due · {date}", chevron. Empty state: "You're all caught up." with a green check.
   - **Right — "Cycle completion"** card. Simple 7-bar SVG showing % of assessments submitted per weekday over the last week (derived from `cycle_participants.updated_at`, no new query wiring needed — bucket client-side). Big number top-right: overall active-cycle completion %. Subtle "+N% vs last week" delta. Bars use `--accent-blue` at 0.9 with 0.35 for the past days. Reduced-motion aware.

4. **Active cycles table** — card with header "Active cycles" + a right-side "View all" link to `/appraisals`. Columns: Name, Status (existing `CycleStatusBadge`), Progress (thin bar `bg-hairline` fill `accent-blue`), Participants (`14/20` tabular-nums), Due date, Owner (avatar initials chip). Rows link to `/appraisals/:id`. Uses existing `ui/table`. Limit to 5 rows; if none, empty state with `+ Create your first cycle`.

5. **Setup checklist** — removed from the default view now that setup is complete. Keeps living inside `SetupDashboard` for the onboarding flow.

### Design system

- All colors via tokens: `--accent-blue` (primary + progress + chart), `--accent-green` (positive delta, done), `--accent-red` (negative delta, sign-off), `--accent-purple` (secondary accents like the pending-actions icon for goal approvals). No hardcoded hex.
- Radius: cards `rounded-xl`, chips `rounded-full`, buttons `rounded-lg`.
- Shadows: `shadow-[0_1px_2px_rgba(0,0,0,0.03)]` per token guidance.
- Type: Space Grotesk for KPI numbers and headings, DM Sans for body, `tabular-nums` on all counts, dates, percentages.
- Container widens from `max-w-5xl` to `max-w-6xl` to fit the 4-up KPI grid comfortably.
- Fully responsive: KPI cards collapse 4→2→1, two-column band stacks on `<lg`, table gains horizontal scroll on `<md`.

### Files touched

- `src/pages/Dashboard.tsx` — rewrite the post-setup branch.
- `src/components/dashboard/StatCard.tsx` — new (KPI card primitive).
- `src/components/dashboard/PendingActionsCard.tsx` — new (extracted from the current `DashboardAppraisalCard` + HR actions).
- `src/components/dashboard/CompletionChart.tsx` — new (7-bar SVG + headline %).
- `src/components/dashboard/ActiveCyclesTable.tsx` — new.

No hook, schema, RLS, or route changes. No new dependencies.
