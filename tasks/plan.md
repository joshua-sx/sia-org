# Implementation Plan: Interface Design Overhaul — Dashboard & Onboarding

> Source of truth: `.cursor/plans/interface_design_dashboard_&_onboarding_df1c3592.plan.md`.
> This file mirrors it for the `/build` convention. Do not edit the source plan.

## Overview

Visual/hierarchy redesign of the Dashboard and onboarding screens per the
interface-design skill, delivered as five reviewable phases — one git branch per
phase, one commit per task, lint/test/build checkpoints — mirroring the repo's
existing `.cursor/agents/ui-audit-implementer.md` convention.

## Scope

- **Dashboard** — `src/pages/Dashboard.tsx`: post-setup checklist view (`Dashboard`)
  and pre-setup hero (`LaunchOnboardingView`).
- **Onboarding chrome** — `src/components/onboarding/OnboardingStrip.tsx`,
  `OnboardingFooter.tsx`, `StepSuccess.tsx`.

**Non-goals:** no schema/data changes, no new dependencies, no logic changes to
`useOnboarding.ts` or `OnboardingContext.tsx`, no `AppSidebar`/other-route changes
unless Phase 5 surfaces a hard inconsistency (flag first, don't silently expand).

## Locked design decisions

- **Palette:** keep the multi-accent system (`--accent-blue/red/yellow/green`) as
  intentional step/category coding — document it, don't collapse it.
- **Signature:** a stage-pipeline metaphor (Structure -> People -> Launch)
  reflecting that setup literally builds the org's review apparatus — replaces the
  generic icon-in-tinted-square CTA pattern.
- **Focal point:** the Dashboard hero's launch-readiness CTA must unambiguously win
  over the workspace-stats aside.

## Git workflow

- One branch per phase from `main` (or prior merged phase branch): `feat/interface-design-phase-N-<slug>`.
- One commit per task; messages reference phase/task.
- No push/PR unless explicitly asked. Stop after each checkpoint for human approval.

## Task list

### Phase 0: Task tracking
- Task 0 — Write `tasks/plan.md` + `tasks/todo.md` (XS).

### Phase 1: Foundation & documentation — `feat/interface-design-phase-1-foundation`
- Task 1 — Create `.interface-design/system.md`; reconcile `DESIGN.md` / `tokens.md`
  to document the multi-accent system as intentional (S; 3 files).
- Checkpoint A — docs reviewed/approved before any component work.

### Phase 2: Dashboard hero — `feat/interface-design-phase-2-dashboard-hero`
- Task 2 — Establish single focal point in `LaunchOnboardingView` (M; 1 file).
- Task 3 — Signature stage-pipeline element (M; 1 file).
- Checkpoint B — lint/test/build green; visual review desktop+mobile; approval.

### Phase 3: Dashboard checklist — `feat/interface-design-phase-3-dashboard-checklist`
- Task 4 — Type-scale/weight hierarchy pass on the completed-state checklist (S; 1 file).
- Checkpoint C — lint/build green; state walkthrough; approval.

### Phase 4: Onboarding nav chrome — `feat/interface-design-phase-4-onboarding-nav`
- Task 5 — `OnboardingStrip` alignment (S; 1 file).
- Task 6 — `OnboardingFooter` polish (S; 1 file).
- Checkpoint D — lint/build green; full onboarding-flow walkthrough; approval.

### Phase 5: Final polish & verification — `feat/interface-design-phase-5-polish-verify`
- Task 7 — `StepSuccess` polish + reduced-motion check (XS/S; 1 file).
- Task 8 — Cross-screen verification pass; finalize `.interface-design/system.md` (S).
- Checkpoint E (final) — lint/test/build green; screenshots desktop+mobile; sign-off.

## Verification

- Static: `npm run lint`, `npm run build` after every task.
- Regression: `npm test` at every checkpoint (existing suite stays green).
- Visual: manual `npm run dev` walkthrough at 1440px and 390px at every checkpoint.

## Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Onboarding state combos hard to trigger manually | Med | Test org in Supabase or local-only dev stub (never committed) |
| No automated coverage for these components | Med | Manual browser walkthrough mandatory at every checkpoint |
| Scope creep into `AppSidebar`/other routes | Low | Out of scope; flag Task 8 findings for approval before expanding |
