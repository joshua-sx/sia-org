
# Landing Page Redesign — Attio × Google

Rebuild `src/pages/Index.tsx` so it reads like Attio (clean, minimal, product-forward, mostly neutral) with subtle Google-style splashes of blue / red / yellow / green used sparingly on icons, tags, and small shapes.

## Design commitments

- **Palette (locked)**
  - Neutrals: `#ffffff` background, `#fafafa` alt band, `#0a0a0a` text, `#6b7280` muted, `rgba(0,0,0,0.08)` hairline borders
  - Accent set (used sparingly, one per element — never gradients):
    - Google Blue `#4285F4`
    - Google Red `#EA4335`
    - Google Yellow `#FBBC05`
    - Google Green `#34A853`
  - Primary CTA stays black (`#0a0a0a`), Attio-style. Colors live on icon tiles, dot markers, tag pills, small shapes.
- **Type:** Space Grotesk (headings, tight `-0.02em` tracking) + DM Sans (body). Kept from current.
- **Spacing/radius:** Attio-like — 12px card radius, generous whitespace, hairline `1px rgba(0,0,0,0.08)` borders instead of shadows.
- **Motion:** Keep existing framer-motion fade-up + scroll reveal. No new heavy animation.

## Page structure (top → bottom)

```text
1. Navbar         — unchanged (already Attio-like)
2. Hero (BENTO)   — new: centered eyebrow + headline + CTAs, then a bento grid of 5 tiles
3. Logo strip     — small greyscale "trusted by" row (Government / Aviation / Healthcare / Education wordmarks as text)
4. Feature bento  — 2×2 mixed-size grid, one accent color per tile (blue/red/yellow/green)
5. How it works   — 4 numbered steps, each with its own accent color dot
6. Who it's for   — 4 industry cards, colored icon tiles
7. Trust stats + testimonial — centered, minimal
8. Pricing        — single centered card, black CTA
9. Final CTA      — full-width dark band, one accent underline
10. Footer        — unchanged structure, tightened
```

### 2. Hero — bento

- Centered eyebrow ("Performance management for structured orgs"), headline "Run appraisals that actually work.", subhead, two CTAs (black "Get started free" + text "See how it works →"). Max width ~820px, centered — consistent with current alignment preference.
- Below the copy, a **bento grid** (`grid-cols-6 grid-rows-2` on md+, stacked on mobile) with 5 tiles totaling one hero visual composition:
  - **Tile A (col-span-4 row-span-2)** — mini dashboard mock (reuse current DashboardMockup content: 3 metrics with progress bars, blue accent bar)
  - **Tile B (col-span-2)** — colored icon tile: blue circle w/ Target icon, label "Goals cascaded"
  - **Tile C (col-span-1)** — yellow dot + "12 cycles active" pill
  - **Tile D (col-span-1)** — green check + "Review submitted" tag
  - **Tile E (col-span-2)** — red bar chart mini "Completion 87%"
- All tiles white cards, hairline border, 12px radius, no drop shadow — Attio hallmark.

### 4. Feature bento (Solution section)

- 2×2 grid, mixed spans:
  - Big tile (col-span-2, blue accent) — "Goal Setting"
  - Small tile (red accent) — "360° Reviews"
  - Small tile (yellow accent) — "Analytics"
  - Small tile (green accent) — "Org Structure" (new tile; balances the grid)
- Each tile: small colored icon square (28×28, 6px radius, tinted bg `${color}/10`, icon in solid color), title, one-line description. No colored top-bar strip (replace current `bg-amber-300` bar with the icon tile approach — cleaner, more Attio).

### 5. How it works

- 4 steps in a horizontal row (stacks on mobile). Each step: colored numbered dot (blue → red → yellow → green in order), title, description. Centered text under the dot.

### 6. Who it's for

- Same 4 industries. Each card: colored icon tile (blue/red/yellow/green rotating), industry name, one-line desc. White card, hairline border.

### 8. Pricing

- Keep single centered card. Add 4 tiny colored dots next to the "Enterprise" eyebrow as a decorative Google touch. Feature checkmarks in green `#34A853`.

### 9. Final CTA

- Black background, centered headline with the word "cycle" underlined in Google Blue (subtle SVG underline stroke). Single white CTA button.

## Consistency cleanups

- Remove all remaining tailwind color classes like `bg-amber-300`, `bg-rose-400`, `bg-sky-400`, `border-l-4 border-foreground` — replace with the locked 4-color accent system.
- Replace testimonial's heavy left border with a centered pull-quote (already partly done).
- Standardize every section header block to the same centered `max-w-[640px]` pattern (already applied — audit and fix any drift).
- Standardize card style: `bg-white border border-black/[0.08] rounded-xl` — no shadows in the light sections.
- Ensure card icon tiles all share the same size / radius / tint recipe.

## Files

| Action | File |
|--------|------|
| Modify | `src/pages/Index.tsx` — rewrite hero to bento, restructure feature grid, apply 4-color accent system across all sections, unify card styling |

No other files touched. No new dependencies (framer-motion + lucide already installed). Fonts unchanged.
