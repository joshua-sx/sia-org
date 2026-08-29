# 002 — Animate People attention resolution

- **Status**: DONE
- **Commit**: a0f5071
- **Severity**: MEDIUM
- **Category**: Missed opportunity / preventing a jarring change
- **Estimated scope**: 1 source file, about 25 lines

## Problem

The People attention panel mounts and unmounts instantly when manager readiness changes.

```tsx
// src/pages/OrgEmployees.tsx:150 — current
{showAttention && (
  <div className="mt-8 rounded-xl border border-accent-purple/[0.35] bg-accent-purple/[0.08] p-4">
```

## Target

Use `AnimatePresence initial={false}` and a keyed `motion.div`. Enter from `opacity: 0`, `transform: translateY(4px)` over 180ms with `[0.23, 1, 0.32, 1]`. Exit to `opacity: 0`, `transform: translateY(2px)` over 140ms with the same curve. Reduced motion keeps opacity and uses `transform: none`.

## Repo conventions to follow

- Use `usePrefersReducedMotion` from `src/hooks/useReducedMotion.ts`.
- Match the existing `[0.23, 1, 0.32, 1]` curve in `src/components/employees/EmployeeFormModal.tsx:166`.
- Use full transform strings.

## Steps

1. Import `AnimatePresence`, `motion`, and the reduced-motion hook in `src/pages/OrgEmployees.tsx`.
2. Wrap the existing conditional attention panel with `AnimatePresence initial={false}`.
3. Change only the outer attention `div` to `motion.div`, preserving all classes and content.
4. Add the exact asymmetric enter/exit transitions above.

## Boundaries

- Do not animate the employee table, search filtering, or page header.
- Do not change readiness logic or copy.
- Do not add dependencies.

## Verification

- **Mechanical**: `npm run lint`, `npm test`, `npm run build`.
- **Feel check**: resolve the last manager warning; the panel should leave more quickly than it entered, without moving the table during the transition. Reduced motion must retain only the fade.
- **Done when**: the conditional panel has a clear but restrained 180ms/140ms lifecycle.
