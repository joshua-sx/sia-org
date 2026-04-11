

# Step 2: Org Structure Setup — Implementation Plan

## Overview
Build the org hierarchy configuration system: database tables for unit types and units, a 4-step setup wizard, a persistent structure management page with tree view, CSV import, and role-based access control.

---

## 1. Database Migration

A single migration that:

- Enables the `ltree` extension
- Creates `org_unit_types` table (id, organization_id, name, level, created_at) with unique constraints on (org_id, level) and (org_id, name)
- Creates `org_units` table (id, organization_id, parent_id, unit_type_id, name, path ltree, depth generated, is_active, created_at, updated_at)
- Creates indexes: org lookup, parent lookup, GIST and BTREE on path
- Creates a trigger function `compute_org_unit_path` that rebuilds the `path` column from `parent_id` chain on INSERT/UPDATE — uses UUID with hyphens replaced by underscores as ltree labels
- Enables and forces RLS on both tables
- Creates RESTRICTIVE tenant isolation policies (using JWT `organization_id` claim) on both tables for ALL operations
- Creates PERMISSIVE policies: hr_admin full access on both tables, SELECT for all authenticated users on both tables

## 2. Frontend Components

### Setup Wizard (`src/pages/OrgStructureWizard.tsx`)
Shown when no `org_unit_types` exist for the org. 4-step flow with a progress bar:

- **Step 1** — Org confirmed (pre-checked, shows org name + country from AuthContext, read-only)
- **Step 2** — Template selection: 6 cards (Government, Corporate, Healthcare, Education, Flat, Custom). First 5 show a preview of tier names on selection. Custom shows an interactive level builder (add/reorder up to 5 levels, minimum 1)
- **Step 3** — Add first top-level units (optional, skippable). Prompt uses the org's chosen terminology (e.g. "Add your first Ministry"). Allow 1-5 entries
- **Step 4** — Summary using org terminology. Two CTAs: "Add more units" → management page, "Go to Dashboard" → /dashboard. Marks `organizations.setup_complete = true` via Supabase update

On confirming Step 2, inserts rows into `org_unit_types`. On Step 3, inserts into `org_units`.

### Structure Management Page (`src/pages/OrgStructure.tsx`)
Replaces the current placeholder. Logic:
- Fetches `org_unit_types` for the org — if none exist, renders the wizard
- If types exist, renders the management UI

**Layout:**
- **Left panel** — Collapsible tree built from `org_units` data. Each node shows name + type label from `org_unit_types`. Click to select
- **Right panel** — Selected unit detail: name, type, parent, children count. Actions: Edit name, Add child unit, Deactivate (with warning if unit has children or employees)
- **Empty state** — If types exist but no units: "Add your first [top-level type label]" with CTA

**Top toolbar:**
- "Add unit" button → modal with: name input, unit type dropdown (from `org_unit_types`), parent unit searchable dropdown (filtered by correct parent level)
- "Import via CSV" button → file upload, column mapping UI, row-level validation with inline errors
- "Edit hierarchy levels" link → modal to rename labels (not add/remove if units exist)

### Supporting Components
- `src/components/org/SetupWizard.tsx` — The 4-step wizard
- `src/components/org/TemplateSelector.tsx` — Template cards with preview
- `src/components/org/CustomLevelBuilder.tsx` — Drag-to-reorder level builder
- `src/components/org/OrgTree.tsx` — Recursive collapsible tree
- `src/components/org/UnitDetailPanel.tsx` — Right panel with unit info and actions
- `src/components/org/AddUnitModal.tsx` — Modal for adding units
- `src/components/org/CsvImportModal.tsx` — CSV upload with mapping and validation
- `src/components/org/EditLevelsModal.tsx` — Rename hierarchy labels

### Dashboard Checklist Update (`src/pages/Dashboard.tsx`)
- "Hierarchy configured" checks `organization.setup_complete` — shows checkmark when true
- Links "Configure org hierarchy" to `/org/structure`

### Access Control
- In `OrgStructure.tsx`, check `profile.role` from AuthContext
- If role is not `hr_admin`, render an access-denied message with a "Back to Dashboard" button
- No editing controls visible to non-admins

### Sidebar Update (`src/pages/Dashboard.tsx`)
- Already has Organization → Structure and Employees links — no changes needed

## 3. Route Setup
- `/org/structure` already exists in `App.tsx` as a protected route — no changes needed

## 4. Hooks and Data Fetching
- `src/hooks/useOrgUnitTypes.ts` — Fetch/create/update org_unit_types
- `src/hooks/useOrgUnits.ts` — CRUD for org_units with tree building logic

## Technical Notes

- The `ltree` path trigger handles recursive path computation: walks up parent_id chain and concatenates UUIDs (hyphens → underscores). Also cascades to children when a node's parent changes.
- Template definitions are hardcoded in the frontend (e.g. Government = ["Ministry", "Directorate", "Division", "Section", "Unit"])
- CSV import validates: unit_type must exist in org_unit_types, parent_unit_name must resolve to an existing unit of the correct parent level, no duplicate names at the same level under the same parent
- The wizard never shows again once `setup_complete` is set to true on the organization

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | Migration SQL (via migration tool) |
| Create | `src/components/org/SetupWizard.tsx` |
| Create | `src/components/org/TemplateSelector.tsx` |
| Create | `src/components/org/CustomLevelBuilder.tsx` |
| Create | `src/components/org/OrgTree.tsx` |
| Create | `src/components/org/UnitDetailPanel.tsx` |
| Create | `src/components/org/AddUnitModal.tsx` |
| Create | `src/components/org/CsvImportModal.tsx` |
| Create | `src/components/org/EditLevelsModal.tsx` |
| Create | `src/hooks/useOrgUnitTypes.ts` |
| Create | `src/hooks/useOrgUnits.ts` |
| Modify | `src/pages/OrgStructure.tsx` — full rewrite |
| Modify | `src/pages/Dashboard.tsx` — dynamic checklist |
| Modify | `src/contexts/AuthContext.tsx` — ensure `organization.setup_complete` is exposed |

