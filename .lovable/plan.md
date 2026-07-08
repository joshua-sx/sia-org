
## Goal

Only **Structure** is required during setup. **People** and **Launch (cycle)** can be skipped, and the user lands on the real dashboard as soon as Structure is done. Features that genuinely need employees or a cycle stay visible but are gated with a clear "you need to finish X first" affordance.

## Changes

### 1. Redefine "setup complete" — `src/hooks/useOnboarding.ts`
- `setupComplete = structureDone` (was: all three done).
- Keep `structure_complete`, `people_complete`, `cycle_complete` flags as-is on the org record so the checklist still reflects progress.
- Add derived flags used elsewhere: `peopleReady = peopleDone`, `cycleReady = cycleDone`.
- `isOnboarding` becomes "structure not yet done" — the onboarding strip/footer disappear once Structure is complete. People/Launch move into the dashboard checklist as optional follow-ups.

### 2. Block skipping Structure — `src/components/onboarding/OnboardingFooter.tsx`
- Hide the "Skip this step" popover when `activeStep === "structure"`.
- Update Structure's readiness hint copy to make it clear it's required ("Structure is required before you can use the app.").

### 3. Dashboard: show real dashboard after Structure — `src/pages/Dashboard.tsx`
- Because `setupComplete` now flips true after Structure, the existing `if (!setupComplete) return <LaunchOnboardingView />` check naturally routes users to the normal dashboard.
- Add a compact "Next up" section under the setup checklist that surfaces the remaining optional steps (People, Launch) with inline "Do it now" / "Skip for now" actions — same `markComplete` / `markSkipped` hooks, no new backend.

### 4. Gate dependent features in-app

- **`src/pages/AppraisalCycles.tsx`** — HR "New cycle" button:
  - Read `useEmployees()` count.
  - If no employees: render the button `disabled` and wrap with a shadcn `Tooltip` explaining "Add employees before creating a cycle" plus a link to `/org/employees`.
- **`src/components/appraisals/CycleFormModal.tsx`** — safety net: on submit, if no employees exist, toast an error and short-circuit.
- **`src/pages/OrgEmployees.tsx`** — add a subtle "Optional — you can skip and come back" line under the header when `people_complete` is false and Structure is done.
- **Sidebar / navigation** — no items removed. Employees and Appraisals remain reachable so the user can complete them at their own pace.

### 5. Landing after Structure — `src/pages/OrgStructure.tsx`
- On Structure completion, navigate to `/dashboard` (currently goes to `/org/employees`). This matches the new "People is optional" behavior.

## Out of scope

- No database migration. All flags already exist.
- No changes to RLS, roles, cycle-launch RPCs, or scoring.
- No copy changes on the marketing/landing pages.

## Technical notes

- `useOnboarding`'s consumer surface (`steps`, `markComplete`, `markSkipped`, `isOnboarding`, `setupComplete`) stays the same; only the derivation of `setupComplete`/`isOnboarding` changes.
- Onboarding strip auto-hides via existing `if (!isOnboarding) return null` once Structure is done — no edits needed there.
- Gating is presentation-only (disabled buttons + tooltips + guard toast); backend guards already prevent invalid submissions.
