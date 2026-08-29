# Phase 2 schema: roles and responsibilities

**Status:** Design only — not implemented. Phase 1 uses `employees.job_title` and
active-cycle goal titles for “what does this person do?” queries.

## Problem

Ownership questions like “Who is responsible for social media?” need structured
role → responsibility relationships, not a free-text job title alone.

## Proposed entities

```text
organizations
    └── roles (org-scoped job definitions)
            └── role_responsibilities (ordered text or tagged capabilities)
    └── employees
            └── role_id (optional FK; fallback job_title until migrated)
```

### `roles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | tenant |
| `name` | text | e.g. “Social Media Manager” |
| `org_unit_id` | uuid FK nullable | default department for the role |
| `description` | text nullable | |
| `is_active` | boolean | default true |

Unique: `(organization_id, lower(name))`

### `role_responsibilities`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `role_id` | uuid FK | |
| `label` | text | e.g. “Content strategy” |
| `sort_order` | int | display + MCP ordering |

### `employees` change

- Add `role_id uuid REFERENCES roles(id) ON DELETE SET NULL`
- Keep `job_title` during migration; backfill `role_id` where titles match

## MCP impact (Phase 2)

New / extended tools:

- `find_by_responsibility(query)` — search responsibilities across roles → employees
- `get_role(role_id)` — role + responsibilities + current holders
- Extend `get_person` to return `role.responsibilities[]` when `role_id` is set

## Graph edge summary

```text
Employee --holds--> Role --has--> Responsibility
Employee --belongs_to--> OrgUnit
Employee --reports_to--> Employee
```

## Migration strategy

1. Add tables + RLS (HR write; org read)
2. Optional HR UI to define roles/responsibilities
3. CSV import mapping `job_title` → `role_id` where names match
4. Extend MCP tools; deprecate job-title-only ownership heuristics

## Out of scope for Phase 2 schema

- Skills taxonomy
- Matrix reporting (multiple managers)
- Evergreen OKRs separate from cycle goals
