## Font simplification

Reduce the landing to two fonts everywhere:
- **Space Grotesk** — every heading (h1–h3, nav wordmark, stat numbers, pricing price, footer tagline, footer brand)
- **DM Sans** — all body copy, buttons, labels, links

Remove Instrument Serif entirely from the landing.

## Changes

**`src/pages/Index.tsx`**
- Delete the `SERIF` constant.
- Replace `style={{ fontFamily: SERIF }}` on:
  - Hero H1 (line ~406) → Space Grotesk, keep tight tracking (`tracking-tight` / `-0.5px`), drop `font-normal`, use `font-semibold`.
  - AI section headline (line ~547) → Space Grotesk.
  - Footer tagline (line ~717) → Space Grotesk.
- Leave existing Space Grotesk / DM Sans usages untouched.

**`src/index.css`**
- Remove `Instrument+Serif:ital@0;1&` from the Google Fonts `@import` URL so the font stops loading.

## Preserved
- All layout, sections, colors, dot accents, animations, pill buttons, spacing.
- Body default `DM Sans`, heading default `Space Grotesk` from global CSS.
- No routing, backend, or component logic changes.

## Verification
- Hero, AI section, and footer tagline now render in Space Grotesk (same family as feature/section headings) — no serif anywhere.
- Network tab: no request for Instrument Serif.
- Visual scan: single heading font across the page; body remains DM Sans.
