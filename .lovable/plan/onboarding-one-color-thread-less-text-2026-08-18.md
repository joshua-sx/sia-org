# Onboarding: one color thread, less text

Make the SIA four-color system (blue → red → purple → green) the visual spine of setup, and strip the copy back to what the user actually needs at each moment.

## The color system

Each stage owns exactly one color, matching the sidebar:

| Stage | Screen | Color |
| --- | --- | --- |
| 1 | Dashboard (start / review) | Blue |
| 2 | Org Structure | Red |
| 3 | Employees | Purple |
| 4 | Appraisals | Green |

Progress indicator rules (replaces today's green/green/purple/green):
- Current step: filled in that step's own color.
- Completed steps: filled in their own color at reduced weight, so the bar builds a blue → red → purple → green ribbon as you advance.
- Upcoming steps: grey (hairline).
- Skipped steps: grey with a thinner fill, no purple special-case.

No more "green = done" override. Done-ness is communicated by position and the checkmark on the review screen, not by recoloring the step.

## Flow shape

Four stages, not "three steps plus a review screen bolted onto the dashboard":
1. Dashboard — where setup starts and where you land back for the final review and launch. Blue.
2. Org Structure — red.
3. Employees — purple.
4. Appraisals — green, ending in "Review setup", which returns to the Dashboard review card.

The Dashboard review card keeps its own blue identity as stage 1's second visit, and the progress bar shows all four segments filled.

## Copy cleanup

Removed:
- "Invitations are only sent after you review and confirm launch." from the Dashboard setup screen. This reassurance belongs on the Employees step (where the user first worries about emailing people) and on the final launch confirmation — nowhere else.
- "Next: Resolve participants and managers, then launch." and the divider above it. The button already says what happens next.
- The duplicated shield note that appears both in the Dashboard hero and the review card. One instance, on the review card only.

Tightened, per step:
- One eyebrow (stage name, in the stage color), one "Step X of 4", one H1, one subhead of at most a single sentence.
- Subheads rewritten in plain language, no internal vocabulary ("resolve participants", "readiness", "cycle acknowledgement window").
- Status line becomes a short factual state ("2 units ready", "1 person needs a manager") instead of an instruction plus a state.
- Captions ("You can update your structure later.") kept only where a user might hesitate — structure and the final launch — and dropped elsewhere.
- Buttons: "Continue", "Continue", "Review setup", "Finish setup". No restating the destination twice on the same screen.

## Hierarchy and spacing

- Consistent vertical rhythm across all four screens: eyebrow → step counter → progress bar → H1 → subhead → card → status line → primary button → optional caption → divider → Back.
- Same H1 size, same max content width, same gap scale on every step, so nothing shifts as you move through.
- Progress bar segments get the same width and a 200 ms color transition.
- Headings use balanced wrapping, body text uses pretty wrapping, step counters use tabular numerals so the counter doesn't jitter.
- Primary button gets a 0.96 press scale with a transform-only transition; status icons cross-fade rather than swap.
- Back link and any inline link get a minimum 40×40 hit area.

## Technical notes

- `FLOW_STEPS` in `src/components/onboarding/OnboardingStepFrame.tsx` is reordered to dashboard/structure/people/cycle with accents blue/red/purple/green, and the segment color logic is rewritten to the rules above.
- `OnboardingPipeline` (`variant="bars"`) is aligned to the same color rules so the two indicators can't disagree; the green-done and purple-skipped special cases are removed.
- `SetupDashboard.tsx`: drop the shield line and the "Next:" hint block from the pre-review view; keep "Continue" and "Review completed setup".
- Copy edits live in `src/content/onboardingCopy.ts` plus the inline `title`/`subtitle`/`statusLabel`/`caption` props in `OrgStructure.tsx`, `OrgEmployees.tsx`, and `AppraisalCycles.tsx`.
- No changes to onboarding state logic in `useOnboarding.ts` beyond what the reordered step list requires; completion rules stay as they are.
