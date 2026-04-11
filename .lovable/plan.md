

# Redesign Landing Page — Notion-Inspired Style

## Overview
Rewrite `src/pages/Index.tsx` to adopt Notion's design language: warm neutral backgrounds (`#f6f5f4`), clean white cards with subtle borders and 12px rounded corners, large bold headings with tight tracking, minimal color palette (near-black text, blue accent links), generous white space, and direct/confident copywriting.

## Design Direction (from Notion screenshots)

- **Background**: Warm off-white `#f6f5f4` for sections, pure white for cards
- **Typography**: Large bold headings (54px desktop, tight tracking like `-1.875px`), system sans-serif stack. Keep Space Grotesk for headings but make them bolder/larger
- **Cards**: White background, `border border-[rgba(0,0,0,0.1)]`, `rounded-xl` (12px), no heavy shadows
- **Links**: Blue `#0075de` with arrow `→` suffix
- **Layout**: Bento-style grids for feature sections, full-width cards spanning columns
- **Copy style**: Short, declarative, confident. "One system. Zero paperwork." not "We help you manage..."
- **Footer**: Clean multi-column with category headings, minimal

## Key Changes

### Visual Overhaul
- Replace dot-grid hero with clean warm background
- Make hero headline significantly larger (48-56px mobile, 64-72px desktop) with tighter line-height
- Replace dark Problem section with warm `#f6f5f4` background section
- Turn Solution cards into Notion-style bento grid: one large card spanning full width + two smaller cards below
- Each feature card gets a colored accent area (like Notion's yellow/red/blue card headers)
- Who It's For becomes a 2x3 or 3x2 card grid with org logos/icons
- How It Works keeps stepper but cleaner, more spacious
- Pricing card gets cleaner border treatment
- Footer matches Notion's 4-column layout with category headers

### Copywriting Refresh (Notion-style)
- Hero: "Run appraisals that actually work." (shorter, punchier)
- Problem: "Still using spreadsheets?" (conversational)
- Solution: "One system for every phase." with sub-cards using action-oriented labels
- Trust: Use a testimonial-style quote block like Notion's OpenAI quote
- Final CTA: "Your next cycle starts here."

### Component Structure
Same file (`src/pages/Index.tsx`), full rewrite. Same data arrays mostly preserved but with copy tweaks. Same framer-motion animations but lighter/subtler.

### What stays the same
- All nav links and routing (`/login`, `/signup`)
- framer-motion dependency and animation approach
- ScrollProgressBar, BackToTop, Navbar structure
- Dashboard mockup concept (restyled to match)
- Mobile responsiveness

## Files

| Action | File |
|--------|------|
| Rewrite | `src/pages/Index.tsx` |

