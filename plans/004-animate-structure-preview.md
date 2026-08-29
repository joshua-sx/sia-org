# 004 — Animate the onboarding structure preview

- **Status**: DONE
- **Commit**: a0f5071
- **Severity**: LOW
- **Category**: Spatial consistency
- **Estimated scope**: 1 source file, about 25 lines

## Problem

The structure preview appears and disappears instantly beneath the Preview button.

```tsx
// src/components/org/SetupWizard.tsx:282 — current
{showPreview && (
  <TreePreview ... />
)}
```

## Target

Use `AnimatePresence initial={false}` around a keyed wrapper. Enter with `opacity: 0`, `transform: scale(0.97)`, and `transformOrigin: top right` over 200ms using `[0.2, 0, 0, 1]`. Exit to the same visual state over 150ms. Reduced motion uses `transform: none` and keeps a 120ms opacity transition.

## Repo conventions to follow

- `AnimatePresence` and `motion` are already imported in this file.
- Add and use `usePrefersReducedMotion`.
- Match `[0.2, 0, 0, 1]` already used in this file.
- Use a full transform string.

## Steps

1. Import and call `usePrefersReducedMotion` in `SetupWizard`.
2. Wrap the preview conditional in `AnimatePresence initial={false}`.
3. Place `TreePreview` inside `motion.div key="structure-preview"`.
4. Apply the exact enter/exit values and `transformOrigin: "top right"`.

## Boundaries

- Do not animate wizard step navigation, hierarchy rows, or the Preview button.
- Do not alter preview functionality.
- Do not add dependencies.

## Verification

- **Mechanical**: `npm run lint`, `npm test`, `npm run build`.
- **Feel check**: repeatedly show/hide the preview. It should appear connected to the trigger, exit faster than it enters, and remain interruptible. Reduced motion should fade only.
- **Done when**: preview motion remains at or below 200ms with correct origin.
