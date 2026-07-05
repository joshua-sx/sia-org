
## Goal

Make the signed-in surface (Signup, Login, Forgot/Reset Password, Dashboard, Org Structure, Employees, AppLayout, AppSidebar) feel like a direct continuation of the landing page — same Attio-minimalist frame, same subtle Google multi-accent (blue #4285F4, red #EA4335, yellow #FBBC05, green #34A853), same Space Grotesk / DM Sans typography, same hairline cards on warm off-white.

Today the app pages already use the right fonts, but colors are hardcoded (`#615d59`, `#a39e98`, `#f6f5f4`, `rgba(0,0,0,0.95)`) and the accent system from the landing page never made it in.

## What changes

### 1. Design tokens (`src/index.css`)
- Add the landing page's 4 accents as semantic tokens: `--accent-blue`, `--accent-red`, `--accent-yellow`, `--accent-green` (+ `-tint` at 10% for icon-tile backgrounds).
- Formalize the warm neutrals used across the app so components stop hardcoding hex:
  - `--surface` (page bg, warm off-white)
  - `--surface-raised` (card bg, pure white)
  - `--hairline` (`rgba(0,0,0,0.08)` — matches landing page border)
  - `--ink`, `--ink-muted`, `--ink-subtle` (replace the three hex greys)
- Update sidebar tokens to the same warm off-white, hairline right border, subtle black-tint hover.

### 2. Onboarding pages — Signup / Login / Forgot / Reset
- Swap the plain `<Card>` shell for the same hairline-bordered, softly-shadowed panel used in landing hero tiles (`border border-black/[0.08]`, `rounded-xl`, layered shadow).
- Page background becomes the warm `--surface` (not stark white), with a faint blue→transparent radial wash behind the card to echo the landing hero.
- Wordmark "SIA" in Space Grotesk, with a small 4-dot color chip (blue/red/yellow/green) beside it so the multi-accent identity carries in immediately.
- Primary "Create account" / "Sign in" button uses the blue accent; Google button keeps its native 4-color mark (already matches).
- Form inputs: hairline border, `rounded-lg`, focus ring in blue accent.

### 3. AppLayout + AppSidebar
- Sidebar: warm off-white surface, hairline right border, active nav item gets a subtle blue-tint background + blue left-edge accent (2px), not black tint. Icons pick up the accent color for their nav item:
  - Dashboard → blue, Org Structure → green, Employees → yellow (matches landing page's per-tile color assignment).
- Header bar: hairline bottom, add breadcrumb / page title slot on the right of the sidebar trigger so pages feel framed like the landing sections.
- User menu footer: avatar keeps neutral tint; add a tiny colored status dot (green) to signal "signed in", matching landing's status pills.

### 4. Dashboard
- Reframe as a small "bento" like the landing hero:
  - Top row: welcome headline + a compact org meta chip (org name, plan/industry, country) styled like the landing's status tiles.
  - Setup checklist becomes a hairline card with each row's leading icon tile using the 10%-tint accent color (blue/red/yellow/green cycling per step), matching the icon-tile pattern on the landing feature cards.
  - Add a second small tile: "Cycle status — no active cycle" using the yellow accent as a soft badge, so the dashboard has landing-style density rather than a lone card.
- Completed steps: check icon uses `--accent-green` (not raw emerald-500); strike-through uses `--ink-subtle`.
- "Configure →" ghost buttons use blue accent on hover.

### 5. Org Structure + Employees pages
- Same page frame: `bg-surface`, max-width container, section header pattern (eyebrow label in accent color + h1 in Space Grotesk + muted subtext) mirroring landing section headers.
- Any existing cards/tables get the hairline + soft shadow treatment; empty states get an icon tile in the section's accent color (Structure = green, Employees = yellow) with a short prompt and a primary blue action button.

### 6. Cleanup
- Delete raw hex references in the touched files; everything routes through the new tokens or Tailwind semantic classes.
- Keep `--primary` = blue accent so shadcn defaults (Button, Ring, Link hover) stay on-brand automatically.

## What is NOT changing
- No new routes, no new data fetching, no schema/RLS/edge-function edits.
- No new dependencies; framer-motion (already present from the landing page) is reused for the same fade/slide-in on section reveals — no new libraries.
- Auth flow, signup edge function, and route guards are untouched.

## Files touched
- `src/index.css` — new tokens
- `src/pages/Signup.tsx`, `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`
- `src/components/AppLayout.tsx`, `src/components/AppSidebar.tsx`
- `src/pages/Dashboard.tsx`, `src/pages/OrgStructure.tsx`, `src/pages/OrgEmployees.tsx`

## Notes for a non-technical reader
The signed-in app will feel like the same product as your landing page: same warm off-white background, same thin card outlines instead of heavy borders, same four color accents (blue / red / yellow / green) used as small dots and icon tiles rather than large blocks. The dashboard becomes a light "bento" of small tiles (welcome, org info, setup checklist, cycle status) so it doesn't feel emptier than the marketing site.
