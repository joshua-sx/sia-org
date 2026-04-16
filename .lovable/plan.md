

# Redesign Template Selector Step

## Overview
Restyle the template selection cards and Step 1 layout to match the reference design: each card shows icon + name + description + mini hierarchy tree preview, with a checkmark badge on selection, and a footer bar showing the selected levels path plus navigation buttons.

## Changes

### 1. Rewrite `src/components/org/TemplateSelector.tsx`
- Add `desc` field to each template in `TEMPLATES` array (e.g., "Public sector hierarchy", "Standard business structure")
- Redesign card layout: taller cards (~155px min-height) with:
  - **Top-right checkmark** circle when selected
  - **Icon + Name** row at top (icon in a rounded container)
  - **Description** line below in muted text
  - **Mini hierarchy tree** at bottom: indented levels with colored dots and `└` connectors (like the reference). For "Custom", show a pencil icon + "Define your own levels"
- Selected state: primary ghost background, primary border, ring shadow
- Hover state: elevated shadow, border darkens
- Keep the 2-col / 3-col grid layout
- Level colors array: blue, green, violet, amber (matching existing `LEVEL_DOT_COLORS`)

### 2. Update Step 1 in `src/components/org/SetupWizard.tsx`
- Replace the current Step 1 footer with a split footer:
  - **Left**: Back button (disabled on step 1)
  - **Right**: Selected template's level path as inline badges (e.g., `Division → Department → Team`) + "Confirm & Continue" button
- Replace the breadcrumb pills with a numbered step indicator matching the reference: circles with step numbers connected by dashed lines, with labels underneath
- Update Step 1 card header text to "Choose your hierarchy template" with subtitle "This determines the organizational levels available during setup. You can adjust later in settings."

## Files

| Action | File |
|--------|------|
| Rewrite | `src/components/org/TemplateSelector.tsx` — new card design with mini tree, descriptions, checkmark |
| Modify | `src/components/org/SetupWizard.tsx` — updated step 1 footer with level path, improved step indicator |

