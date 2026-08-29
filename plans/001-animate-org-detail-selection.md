# 001 — Animate organization detail selection

- **Status**: DONE
- **Commit**: a0f5071
- **Severity**: MEDIUM
- **Category**: Missed opportunity / state indication
- **Estimated scope**: 1 source file, about 30 lines

## Problem

Selecting an organization unit replaces the adjacent detail content instantly. The relationship between the tree selection and detail panel is therefore less legible than it should be.

```tsx
// src/pages/OrgStructure.tsx:238 — current
<aside className="self-start rounded-2xl bg-surface-raised p-6 shadow-[var(--shadow-border)] min-[1180px]:sticky min-[1180px]:top-20">
  {selectedNode ? (
    <UnitDetailPanel node={selectedNode} onAddChild={handleAddChild} />
  ) : (
    <div className="py-8 text-center">...</div>
  )}
</aside>
```

## Target

Wrap the keyed detail state in `AnimatePresence initial={false} mode="wait"`. Enter with `opacity: 0` and `transform: translateY(4px)` to settled over 160ms using `[0.2, 0, 0, 1]`; exit with `opacity: 0` and `transform: translateY(2px)` over 100ms. Under reduced motion, both transforms are `none` and the opacity transition remains.

## Repo conventions to follow

- Use `framer-motion`, already installed.
- Use `usePrefersReducedMotion` from `src/hooks/useReducedMotion.ts`.
- Match the existing `[0.2, 0, 0, 1]` curve in `src/components/org/SetupWizard.tsx:192`.
- Use full `transform` strings, not Framer Motion `y` shorthand.

## Steps

1. In `src/pages/OrgStructure.tsx`, import `AnimatePresence`, `motion`, and `usePrefersReducedMotion`.
2. Read the reduced-motion preference inside `OrgStructure`.
3. Inside the existing `aside`, wrap both selected and empty states in `AnimatePresence initial={false} mode="wait"`.
4. Render a keyed `motion.div`: `selectedNode.id` for details and `"empty-selection"` for the empty state.
5. Apply the exact enter/exit transforms, durations, and curve above.

## Boundaries

- Do not animate the tree, route navigation, or panel container.
- Do not change organization behavior or data fetching.
- Do not add dependencies.

## Verification

- **Mechanical**: `npm run lint`, `npm test`, `npm run build`.
- **Feel check**: switch quickly between several tree nodes; content should bridge the change without delaying selection. At 10% playback the outgoing state must finish before the incoming state appears. With reduced motion, movement disappears but the short fade remains.
- **Done when**: selection remains immediate and the detail content transition never exceeds 160ms.
