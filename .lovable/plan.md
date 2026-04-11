

# Update Landing Page — Implementation Plan

## Overview
Replace the minimal landing page with a full marketing page featuring multiple sections (Hero, Problem, Solution, Who It's For, How It Works, Trust, Pricing, Final CTA, Footer), smooth scroll animations, a responsive navbar with mobile menu and features dropdown, a dashboard mockup, and a back-to-top button.

## Changes

### 1. Install framer-motion
The provided design relies heavily on `framer-motion` for scroll-linked parallax, fade-up animations, staggered reveals, and `AnimatePresence` for the mobile menu. This dependency must be added.

### 2. Rewrite `src/pages/Index.tsx`
Full replacement with the new landing page component. Key sections:
- **Navbar** — Sticky header with logo, desktop nav links (Features dropdown, Who It's For, How It Works, Pricing), Sign In / Get Started buttons, hamburger mobile menu
- **Hero** — Dot-grid background, parallax text, badge link, serif headline, subheadline, CTA button linking to `/signup`, dashboard mockup component
- **Problem** — Three numbered pain points
- **Solution** — Three feature cards with icons (Target, ClipboardCheck, BarChart3)
- **Who It's For** — Four industry cards (Government, Aviation, Healthcare, Education)
- **How It Works** — Four numbered steps with connecting lines
- **Trust/Credibility** — Stats (100+, 3×, 0) and bullet points
- **Pricing** — Single plan card with feature checklist and CTA
- **Final CTA** — Dark background call-to-action
- **Footer** — Three-column links (Product, Company, Legal), brand, copyright

All internal links (Sign In → `/login`, Get Started → `/signup`) use React Router `Link`. Section navigation uses smooth scroll to anchors.

### 3. Preserve route protection
The `PublicRoute` wrapper in `App.tsx` already redirects authenticated users to `/dashboard`. No changes needed to routing.

## Technical Notes
- The user's code snippet has incomplete JSX (missing return statements, broken tags from copy-paste). I will reconstruct the full working component faithfully from the data structures and intent provided.
- All section IDs (`#solution`, `#who`, `#how`, `#pricing`) will be set for smooth-scroll navigation.
- The dashboard mockup is a static visual component — no real data.
- ScrollProgressBar renders a fixed progress indicator at the top of the page.
- BackToTop button appears after 600px scroll.

## Files

| Action | File |
|--------|------|
| Install | `framer-motion` package |
| Rewrite | `src/pages/Index.tsx` — full landing page |

