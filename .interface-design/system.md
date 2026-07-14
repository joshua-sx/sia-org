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
- `--accent-red     4 81% 56%` — Structure (org hierarchy step)
- `--accent-yellow 45 97% 51%` — People / skipped + attention (paired with a
  darkened text hue `hsl(45,55%,32%)` for legibility on tints)
- `--accent-green 137 55% 43%` — Launch / done + success states

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

Recorded values worth remembering (not one-offs or prop variations).

- **Page header** (`PageHeader`, top-level product pages — Dashboard, Structure,
  Employees, Appraisals, ...) — bold `28px/-0.5px` Space Grotesk title,
  `--ink-muted` subtitle below, optional actions right-aligned on the same row.
  No eyebrow label, icon, or colored accent above the title — that vocabulary is
  reserved for `OnboardingStepHeader` during setup, where the accent is a
  wayfinding signal for "which step am I in." Once setup is complete, pages
  stand on their own and don't need step-coding.
- **Setup CTA card** (dashboard hero focal element) — `rounded-2xl` ·
  `border border-[hsl(var(--accent-blue)/0.18)]` · `ring-1
  ring-[hsl(var(--accent-blue)/0.05)]` · `p-6 md:p-8` · elevation
  `shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-18px_rgba(0,0,0,0.16)]`.
  Title 20px/600, body max 46ch, primary button h-12 px-7 15px/500. It is the
  ONLY elevated surface on the view; everything else is flat.
- **Setup pipeline** (signature) — horizontal `<ol>` of 40px round nodes joined by
  2px connectors, driven by `useOnboarding().steps`. Node states: done = green
  tint + check; current = own accent tint + `0 0 0 2px accent/0.35` ring + step
  icon; upcoming = hairline border + `--ink-subtle` icon. Connector = green/0.5
  when the preceding step is done, else hairline. Labels 11px/500, current in
  foreground else subtle.
- **Onboarding strip** (persistent top bar on step pages, hidden on setup dashboard) —
  `OnboardingPipeline` size `sm` in a hairline-bordered raised surface; tabular-nums
  `completedCount/totalSteps` on the right. Replaces the older segment-bar progress UI.
- **Aside card** (flat supporting context) — `rounded-xl border
  border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5`, no shadow.
- **Checklist row** — 14px label; actionable rows `font-medium` foreground, done
  rows `--ink-muted` (no strikethrough — the green check carries "done"). Header
  count is a green pill (`accent-green/0.12` bg, 11px/500, tabular-nums).
- **Skipped-yellow text** — always `hsl(45,55%,32%)` on `accent-yellow/0.14`
  (strip pill, dashboard resume button). One value, used everywhere.
- **StepSuccess** — 64px green-tint check circle; eyebrow 11px uppercase
  tracking-0.14em; title 26px/600 Space Grotesk tracking-0.4px. Entrance motion
  drops movement under `prefers-reduced-motion`, keeps opacity fade.

## Checks before showing (skill discipline)

Squint (hierarchy readable, nothing harsh) · Swap (would a default typeface/layout
feel different?) · Signature (point to 5 SIA-specific elements) · Token (do the CSS
vars belong to this product's world?).
