# Fix Select dropdown showing only a sliver

`src/components/ui/select.tsx` line 82 applies `h-[var(--radix-select-trigger-height)]` to the `SelectPrimitive.Viewport`. That pins the scrollable viewport to the trigger's height (~32–40px), so opening any Select renders a thin strip instead of the full list — the "Assign manager…" dropdown on the participant row is only the most visible instance. This is a bug vs. the stock shadcn Select (which uses only width, not height).

## Change

**`src/components/ui/select.tsx`** — drop the `h-[var(--radix-select-trigger-height)]` class from the Viewport, keeping the width match:

```tsx
<SelectPrimitive.Viewport
  className={cn(
    "p-1",
    position === "popper" &&
      "w-full min-w-[var(--radix-select-trigger-width)]",
  )}
>
```

The outer `SelectContent` already caps overflow with `max-h-96`, so long lists still scroll — they just get real vertical space now.

## Verification
- Open the "Assign manager…" dropdown on `/appraisals/:id`: full list of employees shows and scrolls.
- Spot-check other Selects in the app (org unit picker, employee form) still render normally.
