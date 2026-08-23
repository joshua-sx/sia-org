# Onboarding: one centered step layout

Make all onboarding steps look like the four reference screens: centered eyebrow, "Step X of 4", segmented bars, big headline, one subhead, a single content card, an inline readiness line, one full-width primary button, a reassurance caption, then a divider with a low-key "Back" link. Container keeps the current page width (max-w-5xl) and stays fully responsive.

## What changes on screen

Every step (Structure, People, Cycle, Review & launch) is rebuilt on one shared frame:

```text
            ORGANIZATION            <- eyebrow in the step accent color
              Step 1 of 4
           ▬▬  ──  ──  ──           <- segmented bars (done = green, current = accent)

        Build your organization     <- single H1, Space Grotesk
   Create the structure your people and reviews will use.

   ┌──────────────── card ────────────────┐
   │  content for this step               │
   └──────────────────────────────────────┘

        ✓ 2 divisions and 2 departments ready
   [        Continue to people           ]   <- full width of the card
        You can update your structure later.
   ─────────────────────────────────────────
   ← Back
```

- Left-aligned page headers on the Structure and People steps become centered.
- The sticky bottom bar is replaced by the in-flow Continue button plus the Back link; the top progress strip is replaced by the centered bars (only one progress indicator remains).
- Readiness text moves out of the footer and sits directly above the button as a check line.
- Continue labels become explicit: "Continue to people", "Continue to cycle", "Review setup", "Launch review cycle".
- Mobile: card goes full width, headline scales down, button stays full width, Back stays below the divider.

## Step 4 — Review and launch

Adds a real final step at `/dashboard` (setup mode) showing Organization / People / Cycle summary rows with green checks and Edit links, the shield note about invitations, a confirm checkbox, "Launch review cycle" primary, and "Save as draft" secondary. Launching routes into the existing cycle launch action; Save as draft calls the existing finish-setup path.

## Technical notes

- New `OnboardingStepFrame.tsx` (centered container, eyebrow, step counter, bars, title, subhead, card slot, readiness line, primary CTA, caption, divider + Back). It reads `useOnboarding` for step index/labels and `useOnboardingContext` readiness, so no new state model.
- `OnboardingPipeline` `variant="bars"` is reused as-is for the segmented indicator.
- Retire `OnboardingStepHeader` usage plus the sticky `OnboardingFooter`/`OnboardingNavFooter` and `OnboardingStrip` render during onboarding; `AppLayout` keeps rendering them only when no step frame is active (removed from the onboarding path).
- `OrgStructure.tsx`, `OrgEmployees.tsx`, and the cycle step page get wrapped in the frame; their existing cards/tables/modals stay unchanged.
- Cycle step surfaces the existing `CycleFormModal` fields inline in the card (name, period, frequency, review stages + weights, acknowledgement deadline) using the same schema and validation — no new backend work.
- Copy strings for headline/subhead/CTA/caption move into `src/content/onboardingCopy.ts`.
- No database or RLS changes.
