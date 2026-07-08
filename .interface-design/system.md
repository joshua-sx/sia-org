# SIA Interface Design System

Living record of the interface-design decisions for SIA (performance appraisal
platform for structured orgs — government, aviation, healthcare, education).
Read this before touching UI; hold to its values so work compounds.

## Direction & feel

Competent, procedural, slightly institutional — a well-run HR office, not a
startup dashboard. The product literally builds an organization's review
apparatus (structure -> people -> cycle), so setup should feel like arming a
process, not filling a form. Warm off-white canvas keeps it human; a restrained,
role-coded accent system keeps it legible under real bureaucratic density.

## Domain anchors

- Concepts: appraisal cycle, goal weight, rating scale, review window,
  acknowledgement, org chart, cascading hierarchy, sign-off, compliance record.
- The primary human: an HR admin mid-setup, likely interrupted, who needs to see
  exactly where they left off and what is still blocking launch.
- Signature: the setup flow as a visible pipeline (Structure -> People -> Launch),
  because that is literally what the user is assembling.

## Palette (multi-accent — intentional, not drift)

The four accents are a deliberate step/category-coding system, not decoration.
Each onboarding step and its matching sidebar destination own one hue, so a color
is a wayfinding signal (which part of setup am I in?), never a gradient flourish.
This is the documented exception to the usual "one accent" rule.

- `--accent-blue  217 89% 61%` — Account / Dashboard / primary actions
- `--accent-green 137 55% 43%` — Structure / done + success states
- `--accent-red     4 81% 56%` — People / destructive
- `--accent-yellow 45 97% 51%` — Launch / skipped + attention (paired with a
  darkened text hue `hsl(45,55%,32%)` for legibility on tints)

Rule: within a single view, still lead with ONE hue (the view's owner). Use tints
at ~0.1-0.14 alpha for backgrounds; reserve the solid hue for the single element
that must lead. Never mix multiple solid accents competing at equal weight in one
zone.

## Surfaces & depth

- Canvas `--surface / --background` `30 20% 98%` (warm off-white).
- Raised `--surface-raised` `#fff` for cards; sidebar shares the near-canvas tone
  (`--sidebar-background 30 20% 97%`) — not a different color-world.
- Hairline borders only: `--hairline 0 0% 0% / 0.08`. Borders are whispers.
- Depth strategy: **borders + whisper shadows** (subtle-shadow family), committed.
  Cards use `shadow-[0_1px_2px_rgba(0,0,0,0.03-0.04)]`; the hero CTA may add one
  soft depth layer (`0_8px_24px_-12px_rgba(0,0,0,0.08)`). Do not mix in heavy
  drop shadows.

## Text hierarchy (four levels)

- Primary: `text-foreground` (`0 0% 6%`)
- Secondary/muted: `--ink-muted 28 6% 37%`
- Metadata/subtle: `--ink-subtle 30 6% 60%`
- Strong (for opacity math): `--ink-strong 0 0% 6%`

Build hierarchy from three levers together — size + weight + color/opacity —
never size alone.

## Typography

- Headings: Space Grotesk (`font-[Space_Grotesk]`), tight tracking on large sizes
  (-0.5px at 28px, up to -1.5px at 40-52px).
- Body/UI: DM Sans.
- Type scale in use (approx 1.25 ratio): 11 caption / 14 body / 16 h4 /
  18 h3 / 22-28 h2 / 40-52 hero. Numbers that update get `tabular-nums`.

## Spacing & radius

- Base unit: 4px; use multiples. Card padding 20-28px; section gaps 24-40px.
- Radius scale: `--radius 0.625rem` (10px). `rounded-lg` inputs/buttons,
  `rounded-xl` cards, `rounded-2xl` hero/featured, `rounded-full` badges/pills.
- Concentric radius when nesting: outer = inner + padding.

## Motion

- framer-motion for celebratory moments (`StepSuccess`); short transforms
  (`active:scale-[0.96-0.98]`) for press feedback elsewhere.
- Durations 150-500ms; only animate transform/opacity. Respect
  `prefers-reduced-motion` (the confetti keyframes already opt out in `index.css`).

## Component patterns

_(Filled in as phases land — record values worth remembering, not one-offs.)_

- Aside card — `rounded-xl border border-[hsl(var(--hairline))]
  bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]`.
- (Phase 2) Setup CTA card — TBD.
- (Phase 2) Pipeline indicator — TBD.
- (Phase 4) Onboarding step pill — TBD.

## Checks before showing (skill discipline)

Squint (hierarchy readable, nothing harsh) · Swap (would a default typeface/layout
feel different?) · Signature (point to 5 SIA-specific elements) · Token (do the CSS
vars belong to this product's world?).
