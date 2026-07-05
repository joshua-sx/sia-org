
# Credibility Fixes — Pre-launch cleanup

Three targeted fixes, in the order requested. No new features, no design overhaul.

## 1. Remove fake trust signals — `src/pages/Index.tsx`

The "Trust" section currently invents stats and quotes a fictional HR Director. Replace it with honest pre-launch positioning that keeps the section's visual weight.

- Delete the three fake stats (`100+`, `3×`, `0`) and the fabricated testimonial block.
- In their place, keep the same centered card layout but swap in a **positioning statement**:
  - Small eyebrow: "Built for the Caribbean"
  - Headline: "Built for the way Caribbean government orgs actually run appraisals."
  - Sub: One honest sentence about the design intent — e.g. "Designed around the real hierarchies, cycles, and review formats used across ministries, health authorities, and statutory bodies — not adapted from generic HR software."
  - Four small colored dots (blue/red/yellow/green) as the visual anchor instead of the invented `TrendingUp` icons.
- No numbers, no quotes, no invented customer names.

## 2. Prune the footer — `src/pages/Index.tsx`

Every link in `FOOTER_COLS` (About, Blog, Careers, Privacy, Terms, Security) is `href: "#"`. Since none of those pages exist and this project isn't the place to build a full marketing site right now, **drop the three link columns entirely**.

- Remove `FOOTER_COLS` and its `.map()` in the footer.
- Keep the brand mark + tagline on the left and the copyright/tagline row at the bottom.
- Restructure the footer to a simple two-row layout: brand + short description on top, `© 2026 SIA · Built in the Caribbean 🌴` on the bottom. No dead links.

If the user later wants Privacy / Terms pages, we build them as real routes; we don't stub them.

## 3. Real meta tags — `index.html`

Replace the template scaffolding with real SIA metadata. Concretely:

- `<title>`: `SIA — Performance appraisals for structured orgs`
- Remove the `<!-- TODO -->` comments and the stray blank meta lines.
- `<meta name="author">`: `SIA`
- `<meta name="description">` (keep sitewide, tighten): `Goal-setting, 360° reviews, and performance analytics for government, aviation, healthcare, and education.`
- `og:title` / `twitter:title`: `SIA — Performance appraisals for structured orgs`
- `og:description` / `twitter:description`: same as `description`.
- `og:url` + `<link rel="canonical">`: `https://sia-org.lovable.app/`
- `og:type`: `website` (keep)
- Remove `<meta name="twitter:site" content="@Lovable" />` — no real handle to point at yet. (Better to omit than to lie.)
- **No `og:image`** — the project doesn't have a real preview image and Lovable's hosting will inject one at serve time. Placeholder previews are worse than none.

Result: browser tab, link previews, and SEO description all say what the product actually is, with no lingering "Lovable App" strings.

## Files

| Action | File |
|--------|------|
| Modify | `src/pages/Index.tsx` — replace trust section content; drop footer link columns and `FOOTER_COLS` constant |
| Modify | `index.html` — real title, description, author, og:*, twitter:*, canonical; remove `@Lovable` handle and TODO comments |

No new dependencies. No route or backend changes.
