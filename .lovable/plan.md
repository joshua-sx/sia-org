

# Fix: Persist Wizard Data to Database on Completion

## Problem
The setup wizard is purely client-side — it never saves anything to the database. When you click "Get Started", it just sets a local `wizardDone` flag. The page then checks `unitTypes` from the database (which is empty), so you see the empty "Your hierarchy is configured" state.

## Solution
At the start of the reward ceremony (Step 3 / "Done"), persist the confirmed levels and units to the database before running the animation. This uses the existing `useOrgUnitTypes().createTypes` and `useOrgUnits().addUnit` mutations.

## Changes

### Modify `src/components/org/SetupWizard.tsx`
- Accept `createTypes` and `addUnit` mutations as props (from `OrgStructure.tsx`)
- In `startRewardCeremony` (when moving to the Done step), call:
  1. `createTypes` with the `confirmedLevels` array mapped to `{ name, level }` objects
  2. For each unit in the nested `units` tree, recursively call `addUnit` with the correct `unit_type_id` (from the created types) and `parent_id` (from the created parent)
- Show the anticipation animation during this async work
- If DB calls fail, show an error toast and stay on the current step

### Modify `src/pages/OrgStructure.tsx`
- Pass `createTypes` (from `useOrgUnitTypes`) and `addUnit` (from `useOrgUnits`) as props to `SetupWizard`

## Files

| Action | File |
|--------|------|
| Modify | `src/components/org/SetupWizard.tsx` — add props for mutations, persist data before reward animation |
| Modify | `src/pages/OrgStructure.tsx` — pass `createTypes` and `addUnit` to SetupWizard |

