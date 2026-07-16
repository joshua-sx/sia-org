
# Onboarding per-step accent theming

Match every primary CTA / accent on each onboarding page to the color of that step in the sidebar checklist. This applies **only while `isOnboarding` is true** — the post-setup pages keep today's default blue primary and shared styling.

Colors already exist as tokens:
- Structure → `--accent-red`
- People (Employees) → `--accent-yellow` (now vibrant purple)
- Launch (Appraisals) → `--accent-green`

## Changes

### `src/pages/AppraisalCycles.tsx` (Launch = green, onboarding only)
- When `showOnboardingChrome` is true, render the `New cycle` button with a green primary style (background `--accent-green`, white text) instead of the default blue.
- Same treatment for the "Create first cycle" button in the empty state (only when onboarding).

### `src/pages/OrgEmployees.tsx` (People = purple, onboarding only)
- When `isOnboarding`, restyle the `Add manually` outline button from `--accent-blue` to `--accent-yellow` (purple) so it matches the step accent.
- Same for the "Add another employee" button inside the attention panel.
- Leave the amber-tinted attention banner alone (its border/bg already use `--accent-yellow`, which is now purple, so it already reads correctly).

### `src/pages/OrgStructure.tsx` (Structure = red, onboarding only)
- When `isOnboarding`, restyle the `Add unit` primary button to use `--accent-red` background / white text instead of the default blue.
- Same for the empty-state "Add {topLevelType}" button.

## Not in scope

- No changes to non-onboarding views (the tabs bar, post-setup Cycles list, etc.). User explicitly said "This is only for onboarding".
- No changes to sidebar, dashboard checklist, or shared components — they already use the correct per-step accent.
- No token changes in `index.css` / `tailwind.config.ts`.

## Technical notes

Buttons currently use shadcn's default `Button` (blue primary). To recolor per-page without touching the global variant, add inline `className` overrides on those specific buttons, e.g.:

```tsx
className="bg-[hsl(var(--accent-green))] text-white hover:bg-[hsl(var(--accent-green)/0.9)]"
```

Gate each override behind the page's existing onboarding boolean (`showOnboardingChrome` / `isOnboarding`) so the default styling returns once setup completes.
