

# Improve Setup Wizard UX — Breadcrumbs, Back Navigation, and Reward Design

## Overview
Transform the setup wizard from a linear, one-way flow into a polished multi-step experience with back navigation, clickable breadcrumbs, and neuroscience-backed reward moments at completion. Apply Nielsen's heuristics: user control (back buttons), visibility of system status (progress), recognition over recall (clickable steps), and aesthetic design (Notion tokens).

## Problems Today
- Step starts at 2 (step 1 "Organization" is phantom — confusing)
- No back button on any step
- Breadcrumb steps are not clickable — no way to revisit
- Completion screen (step 4) is flat — no ceremony, no reward moment
- No animations or transitions between steps

## Changes

### 1. Fix step structure
- Remove phantom step 1 "Organization" — start wizard at step 1 with 3 total steps: **Hierarchy → First Units → Done**
- Renumber everything accordingly
- Progress bar: `(step / 3) * 100`

### 2. Clickable breadcrumb stepper
- Steps already completed are clickable — user can tap to go back
- Current step is highlighted, future steps are dimmed and non-interactive
- Clicking a past step navigates back (state is preserved)

### 3. Back button on every step
- Steps 2 and 3 get a "Back" button (left side) alongside the continue button
- Uses `ArrowLeft` icon, ghost variant

### 4. Reward design for completion (Step 3 — "Done")
Apply the Gift Framework:

**Anticipation (1.5s)**
- When entering the final step, show a brief "Setting things up..." message with a pulsing animation before revealing the success state

**Reveal (with ceremony)**
- Animated checkmark that scales in (Framer Motion `motion.div` with `scale` + `opacity`)
- Hierarchy levels appear one by one with staggered fade-in
- Confetti-like particle burst using CSS keyframes (lightweight, no library)

**Afterglow**
- "You're all set" with warm copy: "Your organization structure is ready to go"
- Stats framing: show count of levels configured and units added
- Brief hold (buttons fade in after 1s delay) so user sits with the moment

### 5. Step transitions
- Wrap step content in simple fade-in animation (`animate-fade-in` from existing tailwind config)

### 6. Notion design alignment
- Card shadows: multi-layer stack from DESIGN.md
- Text colors: `rgba(0,0,0,0.95)` headings, `#615d59` secondary, `#a39e98` muted
- Border: `rgba(0,0,0,0.1)`
- Button radius: 4px per DESIGN.md
- Accent blue: `#0075de` for progress bar and active states

## Files

| Action | File |
|--------|------|
| Rewrite | `src/components/org/SetupWizard.tsx` — 3-step flow, back nav, clickable breadcrumbs, reward completion screen, fade transitions, Notion tokens |
| No change | `TemplateSelector.tsx`, `CustomLevelBuilder.tsx` — these are fine as-is |

