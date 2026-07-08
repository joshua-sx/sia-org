---
name: SIA Design Tokens
description: SIA product-app palette and tokens (source of truth = src/index.css)
type: design
---
# Product app (behind auth) — source of truth: src/index.css

Canvas/background: hsl(30 20% 98%) warm off-white; surface-raised #fff; sidebar hsl(30 20% 97%)
Text: hsl(0 0% 6%) primary, --ink-muted hsl(28 6% 37%), --ink-subtle hsl(30 6% 60%)
Border/hairline: hsl(0 0% 0% / 0.08) everywhere — whisper borders only

Multi-accent role-coding system (INTENTIONAL — wayfinding, not decoration):
- --accent-blue  217 89% 61%  → Account / Dashboard / primary
- --accent-green 137 55% 43%  → Structure / done + success
- --accent-red     4 81% 56%  → People / destructive
- --accent-yellow 45 97% 51%  → Launch / skipped + attention (text hue hsl(45,55%,32%) on tints)
Within a view lead with ONE hue; tints at 0.1–0.14 alpha for backgrounds.

Card shadow: 0_1px_2px_rgba(0,0,0,0.03–0.04); hero CTA may add 0_8px_24px_-12px_rgba(0,0,0,0.08)
Radius: --radius 0.625rem (10px); rounded-lg inputs/buttons, rounded-xl cards, rounded-2xl hero, rounded-full badges
Typography: Space Grotesk headings (tight tracking -0.5 to -1.5px on large), DM Sans body. tabular-nums on live numbers.

# Marketing / landing surface

Uses the Notion-inspired single-accent language in DESIGN.md (§1 onward). Kept separate on purpose.
