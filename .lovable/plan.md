## Problem

On `/appraisals/:id`, the "Assign manager…" dropdown appears as a thin empty sliver. It looks like a z-index/clipping issue but the popover is actually rendering correctly through Radix's portal — it just has **no items inside it**.

In `src/components/appraisals/DraftLaunchPanel.tsx` the option list is:

```tsx
candidates.filter((m) => m.id !== e.id).map(...)
```

With only one active employee in the org (Ada Lovelace), that filter yields zero items, so the `SelectContent` renders as an empty rounded rectangle just under the trigger. Nothing is behind anything — there's simply nothing to show, and Radix has no built-in empty state.

## Fix

Render a non-selectable empty message inside `SelectContent` when the filtered list is empty, so the dropdown communicates *why* it's empty instead of looking broken.

1. In `src/components/appraisals/DraftLaunchPanel.tsx`, compute `const managerOptions = candidates.filter((m) => m.id !== e.id);` once per row.
2. If `managerOptions.length === 0`, render a small muted message inside `SelectContent` (e.g. a `div` with `px-2 py-1.5 text-xs text-muted-foreground` reading "No other employees available — add another employee to assign a manager.").
3. Otherwise map `managerOptions` to `SelectItem`s as today.

No other files need to change. This is a presentation-only fix; data flow, RLS, and launch logic are untouched.
