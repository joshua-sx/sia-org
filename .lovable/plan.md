## Coherent onboarding flow

Right now onboarding lives as a passive strip above three unrelated pages. There's no per-step frame telling the user where they are, no explicit "Complete step" action, and the only global action ("Skip setup") is a small link in the top-right that skips everything. The fix is to introduce a shared onboarding shell that wraps every setup page so the user always sees: which step, why it matters, what "done" means, and what the primary/secondary/skip actions do.

### 1. Redesign the top strip → progress header

Rework `OnboardingStrip.tsx`:
- Left: step counter "Step 2 of 4 · People" (bold current step name).
- Center: 4 pill segments (Account / Structure / People / Launch), each colored by state — done (green fill + check), current (accent fill + label), upcoming (hairline outline), skipped (muted with dash). Clickable when done/skipped/current.
- Right: **remove** the "Skip setup →" link entirely. Skipping is now a per-step action inside the footer bar (see §3), never a bulk global escape.
- Under the segments, a single-line contextual sentence: "Add at least one employee to complete this step. You can add more later." Text comes from a `stepCopy` map keyed by `OnboardingStepKey`.

### 2. Standardize page titles

Each onboarding page shows the same title structure so context is unmistakable:
- Eyebrow: `STEP 2 · PEOPLE` (accent-colored, matches the segment color).
- H1: the page's own title ("Employees", "Organization structure", "First appraisal cycle").
- Subtitle: one sentence explaining the outcome ("These are the people who'll take part in appraisal cycles.").

Applied consistently on `OrgStructure.tsx`, `OrgEmployees.tsx`, and the future cycle page. Existing per-page toolbars (Import CSV / Add employee etc.) stay where they are.

### 3. New shared `OnboardingFooter` (sticky action bar)

A sticky bar at the bottom of every onboarding page, rendered by a new component `src/components/onboarding/OnboardingFooter.tsx`. It reads the current step from `useOnboarding` and shows:

```text
┌───────────────────────────────────────────────────────────────────┐
│  ← Back to Structure         [ Skip this step ]  [ Complete step → ] │
└───────────────────────────────────────────────────────────────────┘
```

- **Back**: goes to the previous step's `href` if it exists, otherwise hidden.
- **Skip this step** (ghost, muted): opens a small confirm popover ("You can come back to this later — it won't block cycles you've already set up.") then calls `markSkipped(currentStep)` and navigates to the next step.
- **Complete step** (primary): enabled only when the step's completion condition is met (see §4). On click: calls `markComplete(currentStep)` → toast "People step complete" → navigate to the next incomplete step, or to `/dashboard` if this was the last one.
- Left of the actions: a small readiness hint. If not ready: "Add at least 1 employee to continue." If ready: "1 employee added · ready to continue." Uses `tabular-nums`.

### 4. Explicit per-step readiness

Extend `useOnboarding.ts` with a `readiness` object computed from live data (pass counts in from each page via a new `useStepReadiness(key, { count })` helper, or read from existing hooks — simpler: each page calls a new `setStepReady(key, boolean, hint)` on a lightweight context). Concretely:

- `structure`: ready when `unitTypes.length > 0 && units.length > 0`.
- `people`: ready when `employees.length >= 1`.
- `cycle`: ready when at least one cycle draft exists (placeholder for now — always false until that page exists).

The footer's "Complete step" button reads readiness from context. This removes the current auto-mark-on-first-employee behavior in `OrgEmployees.tsx` — completion becomes an explicit user action so the user always knows *they* finished the step.

### 5. Kill the auto-advance + banner ambiguity

Remove `showJustAddedBanner` from `OrgEmployees.tsx` and the auto `markComplete("people")` effect. The new footer replaces both: after the first employee is added, the readiness hint flips to "1 employee added · ready to continue" and the primary button lights up. The user chooses when to move on, so "am I still on People?" stops being a question.

### 6. Completion → dashboard handoff

When the last step is completed, navigate to `/dashboard` and show a one-time success toast "Setup complete — welcome to SIA." The onboarding strip and footer stop rendering because `isOnboarding` flips to false (already handled by `useOnboarding`).

### Files touched

- `src/components/onboarding/OnboardingStrip.tsx` — redesign (segments + contextual sentence, remove global skip).
- `src/components/onboarding/OnboardingFooter.tsx` — new sticky footer component.
- `src/components/onboarding/OnboardingContext.tsx` — new tiny React context so pages can register readiness for the footer to read.
- `src/hooks/useOnboarding.ts` — add `nextStep`, `previousStep`, and readiness plumbing; keep DB shape untouched.
- `src/pages/OrgEmployees.tsx` — adopt standard title block, mount `OnboardingFooter`, remove auto-complete effect and the "just added" banner, register readiness.
- `src/pages/OrgStructure.tsx` — adopt standard title block, mount `OnboardingFooter`, register readiness.
- `src/components/AppLayout.tsx` — wrap onboarding pages in `OnboardingProvider` so the footer/strip share state.

### Out of scope

- No DB schema changes (the existing `*_complete` / `*_skipped` columns are enough).
- No changes to the setup wizard on the structure page — only the wrapper chrome around it.
- No new cycle page yet — the footer just shows the placeholder readiness for that step when we get there.
- No visual redesign of individual tables/forms — this is chrome only.
