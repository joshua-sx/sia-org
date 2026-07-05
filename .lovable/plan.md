## Employee table restructure

Rework the columns in `src/components/employees/EmployeeTable.tsx` so each piece of employee data has its own column, and the org hierarchy is expressed by its real level names rather than a single "Unit" column.

### New column order
1. First name
2. Last name
3. Email
4. Job title
5. One column per org unit level (dynamic — e.g. Division, Department, Team) using the label from `useOrgUnitTypes` / `orderedLevels`
6. Manager
7. Status
8. Row actions (⋯)

### Behavior
- Header labels for the hierarchy columns come from the tenant's configured level names (Division/Department/Team, or whatever custom labels they defined). Order follows `orderedLevels(types)`.
- Each hierarchy cell shows only that level's unit name for the employee (via `unitsByLevel(...)[levelIndex]`), or `—` when the employee has no unit at that level. No more breadcrumb chain inside one cell.
- First name, Last name, and Email are three separate `<td>`s. Email is no longer stacked under the name.
- Search still matches across first name, last name, email, and job title.
- Empty-state `colSpan` updates to match the new dynamic column count (`5 + levels.length + 1` for actions).
- Status pill, manager cell, and row actions stay as-is.

### Files touched
- `src/components/employees/EmployeeTable.tsx` — only file changed. No schema, hook, or CSV changes.

### Out of scope
- No DB migration, no changes to `useEmployees`, `employeeSchema`, `UnitPicker`, or the form/CSV modals.
- No changes to how org units are stored (still a single leaf `org_unit_id` per employee; ancestor levels are derived).
