

# Fix Setup Wizard Flow — Pure Client-Side

## Problem
The setup wizard crashes with a toast error ("No organization") when clicking "Confirm & Continue" on the hierarchy step. This happens because `createTypes.mutateAsync()` and `addUnit.mutateAsync()` both check for `organization` from auth context, which is null. Every step in the wizard makes Supabase calls that fail.

## Solution
Make the entire setup wizard work with local state only — no backend calls. Store the selected hierarchy levels and first units in local component state, and just advance through the steps. The "Done" step calls `onComplete` which transitions to the org structure view.

Later, when the backend is wired up properly, these can be persisted.

## Changes

### 1. Rewrite `src/components/org/SetupWizard.tsx`
- Remove all Supabase calls (`createTypes.mutateAsync`, `addUnit.mutateAsync`, `supabase.from("organizations").update`)
- Remove `useOrgUnitTypes`, `useOrgUnits`, `useAuth` imports (not needed)
- Remove `supabase` import
- `confirmStep2`: just save levels to local state and advance to step 3
- `confirmStep3` / `skipStep3`: just advance to step 4
- Step 4 "Done": call `onComplete` to exit wizard
- No async operations, no `saving` spinner needed (instant transitions)

### 2. Update `src/pages/OrgStructure.tsx`
- The wizard `onComplete` currently just sets `wizardDone = true`, which hides the wizard and shows the main org structure view
- This flow is fine as-is — no changes needed here
- The `showWizard` condition (`!loading && !hasTypes && !wizardDone`) already works: after wizard completes, `wizardDone` is true so it shows the main view

### 3. Fix `TemplateSelector.tsx` ref warning
- The console shows "Function components cannot be given refs" for `TemplateSelector`
- Wrap with `React.forwardRef` to silence the warning

## Files

| Action | File |
|--------|------|
| Rewrite | `src/components/org/SetupWizard.tsx` — remove all backend calls, pure local state |
| Modify | `src/components/org/TemplateSelector.tsx` — add forwardRef |

