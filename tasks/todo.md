# Interface Design Overhaul — Todo

See `tasks/plan.md` and the source plan for full context and acceptance criteria.

## Phase 0
- [x] Task 0 — `tasks/plan.md` + `tasks/todo.md`

## Phase 1: Foundation & documentation (`feat/interface-design-phase-1-foundation`)
- [x] Task 1 — `.interface-design/system.md`; reconcile `DESIGN.md` / `tokens.md`
- [x] Checkpoint A — docs reviewed/approved before component work

## Phase 2: Dashboard hero (`feat/interface-design-phase-2-dashboard-hero`)
- [x] Task 2 — single focal point in `LaunchOnboardingView`
- [x] Task 3 — signature stage-pipeline element
- [x] Checkpoint B — lint/test/build green; visual review; approval

## Phase 3: Dashboard checklist (`feat/interface-design-phase-3-dashboard-checklist`)
- [x] Task 4 — type-scale/weight hierarchy pass
- [x] Checkpoint C — lint/build green; state walkthrough; approval

## Phase 4: Onboarding nav chrome (`feat/interface-design-phase-4-onboarding-nav`)
- [ ] Task 5 — `OnboardingStrip` alignment (commit `8078b76` landed this, but the
      later unrelated consolidation commit `d916215` ("Consolidate onboarding to
      one progress indicator...") replaced the whole pill mechanism with
      `OnboardingPipeline`; the current file shows no trace of this task's specific
      change)
- [ ] Task 6 — `OnboardingFooter` polish (commit `17d1879` landed this, but the
      divider/skip-hierarchy change was superseded by `d916215` and then removed
      entirely by `8de5ffc` ("Fix onboarding UX audit findings..."), which moved
      skip out to `OnboardingSkipControl` — `OnboardingFooter.tsx` no longer
      contains a divider or skip control at all)
- [ ] Checkpoint D — lint/build green; full onboarding-flow walkthrough; approval
      (no phase-4 branch/PR ever existed, and both underlying tasks were later
      superseded — see notes above)

## Phase 5: Final polish & verification (`feat/interface-design-phase-5-polish-verify`)
- [x] Task 7 — `StepSuccess` polish + reduced-motion check
- [x] Task 8 — cross-screen verification; finalize `.interface-design/system.md`
- [x] Checkpoint E (final) — lint/test/build green; screenshots; sign-off
