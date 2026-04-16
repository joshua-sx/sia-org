

# Apply Notion Design System (DESIGN.md) Across All Pages

## Overview
The `DESIGN.md` file from `getdesign` has been installed with Notion's full design system specification. Now apply these tokens consistently across the dashboard, sidebar, layout, and landing page.

## Key Design Tokens from DESIGN.md

- **Text**: `rgba(0,0,0,0.95)` (not `#2c2c2b`)
- **Secondary text**: `#615d59` (not `#7d7a75`)
- **Muted text**: `#a39e98` (not `#c4c1bc`)
- **Backgrounds**: `#ffffff` (page), `#f6f5f4` (alt sections/sidebar)
- **Border**: `1px solid rgba(0,0,0,0.1)` (not `rgba(0,0,0,0.06)` or `0.08`)
- **Accent blue**: `#0075de`
- **Shadows**: Multi-layer card shadow stack (max 0.04 opacity)
- **Radius**: 4px buttons, 12px cards, 9999px badges
- **Typography**: DM Sans/Inter as NotionInter substitute, tight letter-spacing at large sizes

## Changes

### 1. `src/components/AppSidebar.tsx`
- Update color tokens: `#7d7a75` → `#615d59`, `#8e8b86` → `#a39e98`, `#2c2c2b` → `rgba(0,0,0,0.95)`
- Active state: `bg-[rgba(0,0,0,0.04)]` stays (matches Notion's tertiary bg)
- Avatar fallback bg: `rgba(0,0,0,0.06)` → `rgba(0,0,0,0.05)`

### 2. `src/components/AppLayout.tsx`
- Header border: `rgba(0,0,0,0.06)` → `rgba(0,0,0,0.1)`
- Trigger icon color: align to `#a39e98`

### 3. `src/pages/Dashboard.tsx`
- Text colors: align to DESIGN.md tokens (`rgba(0,0,0,0.95)`, `#615d59`)
- Card border: `rgba(0,0,0,0.08)` → `rgba(0,0,0,0.1)`
- Card dividers: `rgba(0,0,0,0.06)` → `rgba(0,0,0,0.1)`
- Add multi-layer card shadow from DESIGN.md
- Checklist check icon: keep emerald-500 (maps to Notion teal semantic)
- Unchecked icon: `#c4c1bc` → `#a39e98`
- Heading: increase tracking tightness per DESIGN.md scale

### 4. `src/pages/Index.tsx`
- Update all hardcoded colors to match DESIGN.md tokens
- Ensure border, shadow, and radius values align with the spec
- Link blue: any blue accent → `#0075de`

### 5. `src/pages/OrgEmployees.tsx` & `src/pages/OrgStructure.tsx`
- Update text color tokens to match

### 6. `src/index.css`
- Update CSS custom properties to align with Notion palette where applicable (primary blue → `#0075de`, border → `rgba(0,0,0,0.1)`, muted-foreground → `#615d59`)

## Files

| Action | File |
|--------|------|
| Modify | `src/index.css` — update CSS vars to Notion tokens |
| Modify | `src/components/AppSidebar.tsx` — align colors |
| Modify | `src/components/AppLayout.tsx` — align border/icon colors |
| Modify | `src/pages/Dashboard.tsx` — align colors, add card shadows |
| Modify | `src/pages/Index.tsx` — align to DESIGN.md tokens |
| Modify | `src/pages/OrgStructure.tsx` — align text colors |
| Modify | `src/pages/OrgEmployees.tsx` — align text colors |

