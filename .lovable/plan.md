
# Sia Landing Refinement — Manus-inspired

## What I'm changing
1. **Typography** — Add an editorial serif display font (Instrument Serif) for emotional headlines (hero, AI section headline, footer tagline). Keep Space Grotesk for product/UI headings and DM Sans for body. Use serif sparingly — never for feature/step titles or nav.
2. **Buttons** — Unify to soft pill style (`rounded-full`, compact padding `px-5 py-2.5`, subtle shadow on primary, hairline border on secondary). Apply to nav CTA, hero CTAs, pricing CTA, final CTA, and new AI section pills.
3. **New AI section** — Insert between "How It Works" and "Positioning". Editorial serif headline "Ask Sia what's happening in your cycle.", subtext, a large rounded input-style card (non-functional, visual only) with placeholder + submit affordance, and 4 quick-action pills.
4. **New dark footer** — Replace the thin white footer with a large dark section:
   - Editorial serif tagline: "Structured reviews. Smarter organizations."
   - 4 link columns: Product, Solutions, Resources, Company (links are `#` anchors — no new routes)
   - Bottom row: Sia brand mark + short description, copyright, small legal links, socials
5. **Spacing** — Bump section padding from `py-20 md:py-28` to `py-24 md:py-32` on major sections; widen max-width slightly where cramped; more generous margins around hero.

## What I'm preserving
- Overall page structure and order (hero → features → industries → how it works → **AI (new)** → positioning → pricing → CTA → footer)
- White/black base, 4-color Sia dot accent system, bento hero, feature/industry/step cards, pricing card, animated final CTA
- All copy in existing sections
- Existing color tokens and route structure
- All framer-motion reveal patterns

## Where Manus inspiration applies
- **Footer**: dark bg, editorial tagline, multi-column nav, brand row at bottom
- **Typography**: serif for emotional beats, sans for UI — same contrast Manus uses
- **Buttons**: pill radius, compact refined padding
- **AI section**: large input card + quick-action pills below
- **Spacing**: more breathing room between sections

Manus references only inform *feel*. No Manus copy, layout structure beyond the general footer pattern, or branding is used.

## Technical details
- Add Instrument Serif via Google Fonts in `src/index.css` `@import`
- Single-file change: `src/pages/Index.tsx`
  - Add serif utility class helper (inline style) or Tailwind arbitrary
  - Add `AI_QUICK_ACTIONS` and `FOOTER_COLUMNS` data constants
  - New `AISection` component
  - Rewrite `<footer>` with dark bg (`bg-black text-white`)
  - Update button classes to `rounded-full` across CTAs
  - Bump section padding constants
- No backend, routing, or business logic changes
- No new dependencies

## Verification
- Visual check: hero headline reads editorial; buttons are pill-shaped and consistent; AI section renders with input card + 4 pills; footer is dark with 4 columns and tagline; spacing feels roomier
- Mobile: footer columns stack, AI input card stays readable, buttons don't overflow
- No console errors; existing sections untouched functionally
