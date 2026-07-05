## Redesign the onboarding Dashboard page

Today `/dashboard` shows a generic "Welcome back" header, a progress bar, a checklist card, and a small "Appraisal cycle" tile. During onboarding — especially at the final step, when Structure and People are already done — this reads as an admin dashboard, not a "you're almost there" moment. The uploaded reference shows exactly what it should feel like instead: a single, confident hero that names the last remaining step, a clear primary CTA, a right-hand "what you'll configure" outline, a workspace summary with live counts, and a small "setup completed" recap at the bottom.

This plan restructures `src/pages/Dashboard.tsx` into that layout while onboarding is active. When onboarding is complete, the page keeps its existing dashboard behavior (out of scope for visual overhaul here).

### 1. Split the page into two states

Inside `Dashboard.tsx`, branch on `setupComplete` from `useOnboarding()`:

- `setupComplete === false` → render the new **Launch onboarding view** (below).
- `setupComplete === true` → keep the current layout as-is (post-onboarding home).

The new view only renders inside `AppLayout`, so it inherits the existing `OnboardingStrip` header and `OnboardingFooter` — no changes needed there.

### 2. New Launch onboarding view layout

A two-column layout on `md+`, single column on mobile. Max width `max-w-6xl`, generous vertical padding.

```text
┌─────────────────────────────────────────────┬───────────────────────┐
│ Setup                                       │ What you'll configure │
│                                             │ 1  Review type ...    │
│ You're one step away                        │ 2  Participants ...   │
│ from launching reviews                      │ 3  Rating scale ...   │
│                                             │ 4  Review settings    │
│ Your organization profile, structure, and   │ 5  Final confirmation │
│ employee data are ready. Create your first  ├───────────────────────┤
│ appraisal cycle to define how reviews run.  │ Workspace summary     │
│                                             │  N     N     N        │
│ ┌───────────────────────────────────────┐   │ Employees Depts Mgrs  │
│ │  [icon]  Create your first cycle      │   ├───────────────────────┤
│ │          Choose timeline, participants│   │ Organization          │
│ │          ...                          │   │ {org.name}            │
│ │                                       │   │ Industry · Region     │
│ │          [ Create First Cycle ]       │   │ [ Edit details ]      │
│ │  🛡  No invitations will be sent...   │   └───────────────────────┘
│ └───────────────────────────────────────┘   │
│                                             │
│ Setup completed                             │
│ ✓ Account   ✓ Structure   ✓ People          │
└─────────────────────────────────────────────┴───────────────────────┘
```

#### Left column (main)

- **Eyebrow**: small `Setup` label in accent blue (matches the existing "Overview" chip style).
- **H1**: dynamic — pulled from a small map keyed off the next incomplete step. For the common "only cycle left" case: `You're one step away from launching reviews`. If earlier steps remain (e.g. user opened Dashboard mid-flow), swap to a headline for that step, e.g. `Add your team to keep things moving` for `people`, `Shape your organization` for `structure`. All use `text-balance`, Space Grotesk, tight tracking `-1px` at large size.
- **Subhead**: 1–2 sentences of contextual copy from the same map, muted color.
- **Primary CTA card**: rounded-xl border card with:
  - Left circular icon in accent-blue-tint (`CalendarClock` for cycle, `Users` for people, `Building2` for structure — reuse existing lucide icons already imported by `useOnboarding`).
  - Right side: bold title + one-line description + a full-width primary Button. Label = `Create First Appraisal Cycle` (for cycle step) / `Add employees` / `Set up structure`. On click, navigates to that step's `href` (or a placeholder toast for `cycle` since the cycle page doesn't exist yet — reuses the existing "coming soon" pattern).
  - Below the button, a subtle reassurance row with a `ShieldCheck` icon: `No employee invitations will be sent until you confirm launch.`
- **"Setup completed" recap**: below the CTA card, small heading + a horizontal row of chip-pills for each step whose `done === true`, each showing a green check + label. This gives the "look how far you've come" reinforcement from the reference.

#### Right column (aside, `md:w-[320px]`)

Three stacked cards, matching the existing card token (`rounded-xl border bg-surface-raised shadow-[...]`):

1. **What you'll configure** — only shown when the next step is `cycle`. Numbered list of the 5 cycle sub-steps: `Review type and timeline`, `Participants and managers`, `Rating scale and forms`, `Review settings`, `Final launch confirmation`. Numbers are outlined circles in accent blue, labels in foreground. Purely informational preview of what the cycle wizard will ask.
2. **Workspace summary** — three-column mini-stats card with live counts. Each stat has an icon (`Users`, `Building2`, `UserCog`) above a `text-2xl font-semibold tabular-nums` number and a small label underneath (`Employees imported`, `Departments created`, `Managers assigned`). Counts come from:
   - Employees: `useEmployees()` length.
   - Departments/Units: `useOrgUnits()` length (label matches whichever unit-type name is most common, but keep "Departments" as a safe default label to match the reference — a future refinement can pluralize dynamically).
   - Managers: number of employees whose `id` appears as `manager_id` on any other employee (computed client-side from the same employees list).
3. **Organization** — restructured version of the existing org card: `Organization` eyebrow, org name as heading, an inline row with `Industry: X` and `Region: Y` icons + values, and an `Edit details` ghost button (links to `/settings` if it exists, otherwise disabled with a tooltip — check the router to confirm; if no route, hide the button rather than 404).

### 3. Copy map for the "one step away" state

New local const inside `Dashboard.tsx`:

```ts
const LAUNCH_COPY: Record<OnboardingStepKey, {
  headline: string;
  subhead: string;
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
}> = {
  structure: { ... "Shape your organization" ... },
  people:    { ... "Add your team" ... },
  cycle:     {
    headline: "You're one step away from launching reviews",
    subhead:  "Your organization profile, structure, and employee data are ready. Create your first appraisal cycle to define how reviews will run.",
    ctaTitle: "Create your first appraisal cycle",
    ctaBody:  "Choose the review timeline, participants, managers, rating scale, forms, and launch settings. You'll review everything before invitations are sent.",
    ctaLabel: "Create First Appraisal Cycle",
  },
  account:   { ... falls through — should not normally hit this state ... },
};
```

Selection: use `steps.find(s => s.status === "current")` (from `useOnboarding`) as the driver.

### 4. Reuse existing tokens — no new colors

All colors are existing CSS vars: `--accent-blue`, `--accent-green`, `--hairline`, `--ink-*`, `--surface-raised`. Concentric radius rules from the interfaces skill: outer card `rounded-2xl`, inner icon `rounded-xl`, buttons `rounded-md`. Tabular-nums on every number. `text-wrap: balance` on the H1. Scale-on-press (`active:scale-[0.96]`) on the primary CTA.

### Files touched

- `src/pages/Dashboard.tsx` — full refactor of the onboarding branch; keep the post-onboarding branch unchanged.

### Out of scope

- No changes to `OnboardingStrip`, `OnboardingFooter`, `AppLayout`, `useOnboarding`, or any hook.
- No new cycle wizard page — CTA still routes to the existing placeholder behavior.
- No DB, RLS, or schema changes.
- No global settings/edit-org page changes; `Edit details` links to whatever exists today or hides if none.
