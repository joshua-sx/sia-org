# Onboarding progress: only the current step is colored

Right now completed steps stay tinted in their own brand color (45% opacity), so the bar can read green/purple/green and no longer signals "you are here". The rule you want is simpler.

## The rule

- The step you are on shows its sidebar brand color at full strength:
  - Dashboard / Account: blue
  - Org Structure: red
  - People: purple
  - Appraisals / Launch: green
- Every other step (done, skipped, or upcoming) is grey.

So on Dashboard: blue, grey, grey, grey. On Org Structure: grey, red, grey, grey. And so on — one colored marker at a time, moving left to right.

## Where it changes

- `stepSegmentColor` in `OnboardingStepFrame.tsx`: return the accent color only for `current`; return the grey hairline token for `done`, `skipped`, and `upcoming`. This fixes both the segmented bars in the step frame and the `bars` variant of the pipeline in one place.
- `OnboardingPipeline.tsx` (nodes variant): apply the same rule to the icon circles and connector lines — current node keeps its accent fill and ring; done/skipped/upcoming nodes use the neutral outline style, connectors stay grey.

## Kept as is

- Done steps still show the check icon and skipped steps the minus icon, so progress is still readable — just in grey rather than color.
- Labels, sizing, spacing, click-through links, and transitions stay unchanged.
