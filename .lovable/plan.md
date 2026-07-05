When the user selects **Custom**, hide the preset grid and swap it for a focused, larger custom-hierarchy builder. When they haven't selected Custom (or nothing yet), the grid behaves as it does today. Also polish the level rows and add-input so they feel guided, not settings-y.

## Changes

### 1. `src/components/org/SetupWizard.tsx` — step 1 layout
- When `selectedTemplate === "custom"`: don't render `<TemplateSelector />`. Instead render a compact **"Custom hierarchy" header row** with a subtle "← Choose a template instead" text button that clears the selection and brings the grid back. Below it, render `<CustomLevelBuilder />` at full width with more breathing room (`space-y-5`).
- When `selectedTemplate !== "custom"`: keep the grid as-is (existing behavior, unchanged).
- Update the page title/subtitle for step 1 when Custom is active: title stays "Choose your hierarchy template", subtitle becomes "Define the levels for your organization. Drag to reorder, up to 5 levels."
- Use `AnimatePresence` (framer-motion already in project) with `initial={false}` to cross-fade between the grid view and the custom builder view — subtle 200ms fade + tiny `translateY(4px)` on exit only (per exit-subtle rule).

### 2. `src/components/org/CustomLevelBuilder.tsx` — cleaner, larger, guided
- Level rows: bigger (`h-12`, `rounded-lg`, `px-3`), concentric radius (row `rounded-lg` inside card `rounded-xl`). Add a colored dot per level using the same accent palette (`--accent-blue`, `--accent-green`, `--accent-yellow`, `--accent-red`, plus violet) matching preset previews, then the level name in `text-[15px] font-medium`, then `Level N` chip on the right in `text-[11px] tabular-nums text-muted-foreground`, then the X remove button. Grip icon on the left, cursor-grab.
- Empty state (no levels yet): show a soft dashed placeholder row that says "Add your first level below" so the section isn't blank.
- Add-input area: taller input (`h-11`, `text-[15px]`, hairline border, focus ring in `--accent-blue`), placeholder "Add a level (e.g. Region, Team, Squad)". Add button is primary blue with `active:scale-[0.96] transition-transform`, `+ Add`, disabled state clear.
- Show a small helper line under the input: "{levels.length}/5 levels" using `tabular-nums`; hide when at max and show "Maximum 5 levels reached" instead.
- Remove the low-signal "Preview: A → B → C" text — the footer of step 1 already shows the levels chain, and the level rows themselves are the preview.
- Remove drag between rows only when 1 level exists (visual clarity — grip still present, just no-op).
- Add `active:scale-[0.96] transition-transform` to the remove X button, hit area at least 32×32 via wrapping button padding.

### 3. Small polish (feel-better principles applied)
- Concentric radius: outer card `rounded-xl` (12px) with `p-4`; inner level rows `rounded-lg` (8px). Add-input and add button match at `rounded-lg`.
- Tabular numbers on the "Level N" chip and the "N/5" counter.
- Scale on press (0.96) on Add and remove X.
- Cross-fade between grid ⇄ builder uses `cubic-bezier(0.2, 0, 0, 1)`, no `transition: all` — only `opacity` and `transform`.
- `initial={false}` on the AnimatePresence so it doesn't animate on first mount of step 1.

## Non-goals
- No changes to step 2/3/4, no data model changes, no new dependencies (framer-motion already installed).
- Preset templates are unchanged.
