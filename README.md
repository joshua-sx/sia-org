# SIA — Smart Performance Management

SIA is a multi-tenant performance-appraisal product for organizations with a
formal hierarchy. HR runs dated review cycles; managers set weighted goals and
rate their reports; employees acknowledge the final score.

**Read [`PRODUCT.md`](PRODUCT.md) first** — purpose, roles, shipped vs marketing,
and how to talk about the product. That file wins if anything else disagrees.

## What is in the app today

- Multi-tenant workspaces with role-based access (HR Admin, Manager, Employee)
- Custom org hierarchy and employee directory (including CSV import)
- Appraisal cycles: goal setting, interim and final assessments, acknowledgement
- Optional extra reviewer (comments only, not ratings)

**Not in the app today:** 360° self/peer ratings, OKR cascade, Sia AI, SSO.
Those still appear on the marketing site; do not treat them as shipped.

## Tech stack

- React + TypeScript (Vite)
- Tailwind CSS + shadcn/ui
- Supabase / Lovable Cloud (Postgres + RLS)

## Development

```bash
npm install
npm run dev
```

```
npm run lint
npm test
npm run build
```

## Docs map

| File | Use |
|------|-----|
| [`PRODUCT.md`](PRODUCT.md) | Product source of truth |
| [`SPEC.md`](SPEC.md) | Appraisal-cycle feature spec (check migrations for schema) |
| [`DESIGN.md`](DESIGN.md) | Visual system (marketing vs app surfaces) |
| [`tasks/architecture-plan.md`](tasks/architecture-plan.md) | Security / RLS remediation plan |
