# 003 — Animate notification badge state

- **Status**: DONE
- **Commit**: a0f5071
- **Severity**: LOW
- **Category**: State indication
- **Estimated scope**: 1 source file, about 20 lines

## Problem

The unread badge appears and disappears instantly.

```tsx
// src/components/NotificationBell.tsx:42 — current
{unreadCount > 0 && (
  <span className="absolute -right-0.5 -top-0.5 ...">
```

## Target

Wrap only the badge in `AnimatePresence initial={false}`. Enter from `opacity: 0`, `transform: scale(0.95)` over 160ms with `[0.23, 1, 0.32, 1]`. Exit to the same visual state over 100ms. Reduced motion uses `transform: none` and keeps the opacity transition. Keep a stable key so count changes do not replay the entrance.

## Repo conventions to follow

- Use `usePrefersReducedMotion`.
- Match the easing used in `src/components/employees/EmployeeFormModal.tsx:166`.
- Use a full transform string rather than Framer Motion `scale` shorthand.

## Steps

1. Import `AnimatePresence`, `motion`, and `usePrefersReducedMotion`.
2. Wrap the conditional badge only.
3. Replace its outer `span` with `motion.span` keyed as `"unread-badge"`.
4. Apply the exact 160ms enter and 100ms exit transitions.

## Boundaries

- Do not animate the bell, popover, notification list, or count changes.
- Do not modify notification behavior.
- Do not add dependencies.

## Verification

- **Mechanical**: `npm run lint`, `npm test`, `npm run build`.
- **Feel check**: change unread count from zero to nonzero and back. The badge should feel attached to the bell and must not re-enter when only the number changes. Reduced motion should fade only.
- **Done when**: only zero/nonzero badge presence animates.
