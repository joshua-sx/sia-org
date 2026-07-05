Tighten the collapsed sidebar so everything is centered, swap the blue selected/hover tint for a neutral gray so it doesn't clash with the multi-colored icons, and center the footer avatar when collapsed.

## Changes (all in `src/components/AppSidebar.tsx`)

### 1. Header (`S` wordmark + brand)
- When collapsed: center the `S` in the rail (`flex justify-center`, remove left padding) so it sits directly above the icons instead of drifting left.
- When expanded: keep current `BrandMark` + org name.

### 2. Nav items — neutral hover/active
- Replace blue-tinted hover (`hover:bg-[hsl(var(--accent-blue)/0.06)]`) with neutral gray (`hover:bg-[hsl(var(--ink-strong)/0.04)]` or `bg-muted/60`).
- Replace blue-tinted active state (`!bg-[hsl(var(--accent-blue)/0.08)]` + blue left bar) with neutral gray fill (`!bg-[hsl(var(--ink-strong)/0.06)]`) and a neutral (ink-subtle) left edge bar — icon keeps its own accent color so the selected item still reads clearly.
- When collapsed: center the icon inside the button (`justify-center`, remove `gap-3`/`px-3` in favor of `p-2`) so the icon is visually centered in the rail rather than left-aligned under a hidden label.

### 3. Footer avatar
- When collapsed: render only the avatar (with the green presence dot), centered (`justify-center`, no name, no chevron, square hit area). Currently the avatar sits left-aligned because `px-2` + flex-start leftover from the expanded layout.
- When expanded: unchanged (avatar + name + chevron).

### 4. Small polish
- Use consistent `size-8` square hit area for collapsed nav buttons and footer trigger so the rail rhythm is even top-to-bottom.

## Technical notes
- Uses existing tokens only (`--ink-strong`, `--ink-muted`, `--hairline`, accent colors stay on icons).
- No changes to routing, auth, or the sidebar API — purely presentational conditionals on the `collapsed` flag.
- No new dependencies.
