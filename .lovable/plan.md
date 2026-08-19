Update cycle date formatting across the app from ISO `2026-07-08` to a readable **"Jul 8 → Jul 18, 2026"** style.

## What to change

1. **Central formatting utility** — `src/lib/cycleSchema.ts`:
   - Replace `formatWindow(start, end)` with a formatter that outputs natural date ranges.
   - Handle edge cases: same month, different months, different years.
   - Add a `formatDate(iso)` helper for single-date display (e.g. acknowledgement due).

2. **Apply everywhere cycle dates are displayed**:
   - `src/components/appraisals/CycleWindowsSummary.tsx` — windows and acknowledgement due date.
   - `src/pages/AppraisalCycles.tsx` — cycle list row.
   - `src/pages/MyGoals.tsx` — goal window text.
   - Any other direct uses of `formatWindow` or `acknowledgement_due` raw rendering.

3. **Tests** — `src/test/cycleSchema.test.ts`:
   - Add coverage for the new `formatWindow` and `formatDate` helpers.
   - Keep existing schema/state tests unchanged.

## What NOT to change

- Date storage stays ISO `YYYY-MM-DD` in the database and form fields.
- `todayISO()` and `windowState()` remain unchanged; they are internal logic, not display.
- No migrations, schema, or API changes.

## Technical detail

The formatter will use `Intl.DateTimeFormat` (or `toLocaleDateString`) with `month: "short"`, `day: "numeric"`, and `year: "numeric"` as needed. Examples:
- `2026-07-08` → `Jul 8, 2026`
- `2026-07-08` → `2026-07-18` → `Jul 8 → Jul 18, 2026`
- `2026-07-30` → `2026-08-01` → `Jul 30 → Aug 1, 2026`
- `2026-12-28` → `2027-01-03` → `Dec 28, 2026 → Jan 3, 2027`
