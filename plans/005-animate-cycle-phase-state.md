# 005 — Animate appraisal phase state changes

- **Status**: DONE
- **Commit**: a0f5071
- **Severity**: LOW
- **Category**: State indication
- **Estimated scope**: 1 source file and tests if needed, about 25 lines

## Problem

Cycle phase marker content switches instantly between upcoming, current, and complete states.

```tsx
// src/components/dashboard/OperationalBriefing.tsx:221 — current
{phase.state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
```

## Target

Keep the timeline and marker container static. Wrap only the inner glyph in `AnimatePresence initial={false} mode="wait"`. Key by `phase.state`. Enter from `opacity: 0`, `transform: scale(0.95)` over 180ms using `[0.23, 1, 0.32, 1]`; exit over 100ms. Reduced motion uses `transform: none` and keeps opacity.

## Repo conventions to follow

- Use `usePrefersReducedMotion`.
- Use full transform strings.
- Preserve the marker's `aria-hidden="true"`; the existing screen-reader status text remains authoritative.

## Steps

1. Import `AnimatePresence`, `motion`, and the reduced-motion hook.
2. Add the reduced-motion preference inside `OperationalBriefing`.
3. Replace only the marker glyph conditional with an `AnimatePresence` wrapper and keyed `motion.span`.
4. Preserve the existing Check/dot visuals inside that wrapper.

## Boundaries

- Do not animate the timeline, phase labels, dates, or operational data rows.
- Do not change cycle-state calculations or accessibility text.
- Do not add dependencies.

## Verification

- **Mechanical**: `npm run lint`, `npm test`, `npm run build`.
- **Feel check**: force a mounted phase state change. Only the glyph should bridge the change; timeline geometry must remain still. Reduced motion should fade only.
- **Done when**: the state cue is legible without introducing motion on initial page load.
