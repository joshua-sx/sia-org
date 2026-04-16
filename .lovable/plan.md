

# Overhaul Setup Wizard — Accordion Builder + Tree Preview + Reward Ceremony

## Overview
Replace the current flat "add 5 inputs" Step 2 with a rich accordion-based nesting builder inspired by the provided reference code. After picking a template (Step 1), users build their full hierarchy with nested accordion sections, chip-style inputs, and an opt-in tree preview. Step 3 becomes a polished reward ceremony with progress-bar anticipation, sequential tree reveal, and stats afterglow.

## Architecture (4 Steps)

```text
Step 1: Pick Template     → Select hierarchy template (existing)
Step 2: Build Structure   → Accordion nesting builder (NEW)
Step 3: Preview (opt-in)  → Tree preview confirmation (NEW)  
Step 4: Done              → Reward ceremony (IMPROVED)
```

## Detailed Changes

### 1. New component: `src/components/org/AccordionBuilder.tsx`
Core nesting builder with:
- **Dynamic levels** from `confirmedLevels` (not hardcoded Division/Department/Team)
- Each level gets a semantic color (primary blue, green `#16A34A`, violet `#7C3AED`, amber `#D97706`, etc.)
- **Accordion rows**: click to expand/collapse, `▶` rotation indicator
- **Chip input**: inline `+` button, type name + Enter to add. Chips are removable with `×`
- **Stats bar** at top: count badges per level (e.g., "3 Divisions · 5 Departments · 4 Teams")
- **No unit cap** — users can add as many as needed
- Uses existing shadcn `Input`, `Button`, `Badge` components with Notion tokens

### 2. New component: `src/components/org/TreePreview.tsx`
Opt-in tree preview panel:
- Toggle button "🌳 Preview" in the stats bar
- Shows hierarchy as indented tree with `├─` / `└─` connectors
- Level dots (square/circle/diamond shapes) with semantic colors
- Closeable panel
- Empty state: "Add items below to see your org tree here"

### 3. Rewrite `src/components/org/SetupWizard.tsx`
**Step structure**: 4 steps — "Template", "Build", "Preview", "Done"

**Step 1 (Template)**: Keep existing `TemplateSelector` + `CustomLevelBuilder`. No changes.

**Step 2 (Build Structure)**: 
- Render `AccordionBuilder` with levels from Step 1
- Back button to Step 1
- "Continue" button (enabled when at least 1 top-level unit exists)
- Skip link available

**Step 3 (Preview — optional)**:
- Full tree preview of what was built
- Confirm or go back to edit
- Can also be reached via the preview toggle in Step 2

**Step 4 (Done — Reward Ceremony)**:
Improved reward sequence matching the reference:
- **Anticipation**: Animated progress bar with rotating micro-copy ("Mapping divisions...", "Linking departments...", "Connecting teams...", "Almost there...")
- **Reveal**: Checkmark pop-in animation, hierarchy path with level dots, sequential tree node reveal (staggered 150ms per node)
- **Afterglow**: Stats grid (levels, count per level with semantic colors), delayed CTA buttons ("Get Started", "Go to Dashboard")

### 4. Update `src/index.css`
- Add `@keyframes popIn`, `@keyframes fadeUp` for reward animations
- Add `animate-pop-in` and `animate-fade-up` utility classes

### 5. No changes to
- `TemplateSelector.tsx`, `CustomLevelBuilder.tsx` — reused as-is
- `OrgStructure.tsx` — wizard integration unchanged
- Existing theme/fonts (DM Sans, Space Grotesk, Notion color tokens)

## Data Shape (local state in SetupWizard)
```typescript
interface UnitNode {
  name: string;
  expanded: boolean;
  children: UnitNode[];
}
// divisions: UnitNode[] — top level
// Each child level maps to confirmedLevels[depth]
```

## Files

| Action | File |
|--------|------|
| Create | `src/components/org/AccordionBuilder.tsx` — nested accordion builder with chip inputs, stats bar |
| Create | `src/components/org/TreePreview.tsx` — opt-in tree preview with connectors |
| Rewrite | `src/components/org/SetupWizard.tsx` — 4-step flow with accordion builder + improved reward |
| Modify | `src/index.css` — add popIn/fadeUp keyframes |

