# SIA — Sia

Sia is an **organizational intelligence platform** that structures people, roles,
goals, and performance so tools like ChatGPT can securely understand and interact
with your company.

**Customer line:** Your organization, AI-ready. Connect Sia to ChatGPT and ask
your organization anything.

The signed-in app is **Layer 1 — system of record**: multi-tenant performance
appraisals for hierarchical orgs (HR runs cycles; managers rate reports; employees
acknowledge).

**Read [`PRODUCT.md`](PRODUCT.md) first** — purpose, roles, shipped vs marketing,
MCP permissions, and how to talk about the product. That file wins if anything
else disagrees.

## What is in the app today

- Multi-tenant workspaces with role-based access (HR Admin, Manager, Employee)
- Custom org hierarchy and employee directory (including CSV import)
- Appraisal cycles: goal setting, interim and final assessments, acknowledgement
- Optional extra reviewer (comments only, not ratings)
- **Ask Sia (Phase 1):** read-only MCP server + OAuth for ChatGPT / MCP clients

**Not in the app today:** 360° self/peer ratings, OKR cascade, in-app AI chatbot,
Phase 2 org analytics, Phase 3 write actions, SSO, email notifications.

## Connect Sia to ChatGPT

Sia exposes a **read-only MCP server** authenticated via Supabase OAuth. The
authenticated user’s permissions (RLS) determine what data ChatGPT can retrieve.

### Prerequisites

- A Sia account with org structure and (optionally) an active appraisal cycle
- ChatGPT (or another MCP client) that supports OAuth + MCP tool calling

### Setup

1. **MCP endpoint:** `https://<project-ref>.supabase.co/functions/v1/mcp`
2. **Manifest:** `.lovable/mcp/manifest.json` in this repo (tool schemas + OAuth issuer)
3. **OAuth consent:** when connecting, sign in to Sia and approve access at
   `/.lovable/oauth/consent`
4. In ChatGPT, add the MCP connector using your deployment’s manifest URL or
   endpoint (per your workspace admin flow)

### Phase 1 tools (read-only)

| Tool | Purpose |
|------|---------|
| `whoami` | Identity, app role, linked employee record |
| `get_org_chart` | Units, people, reporting lines |
| `list_people` / `list_org_units` / `list_unit_types` | Org exploration |
| `get_direct_reports` / `get_person` | People lookup |
| `get_active_cycle` | Current appraisal windows |
| `get_my_goals` / `get_team_goals` | Cycle goals |
| `get_my_appraisal` / `get_appraisal_history` | Scores and history |
| `get_pending_reviews` | Outstanding / overdue tasks (role-scoped) |

Example prompts once connected:

- `@Sia Who reports to me?`
- `@Sia What are my goals?`
- `@Sia Which of my team have incomplete appraisals?` (manager)
- `@Sia Which departments have the most overdue appraisals?` (HR)

See [`src/lib/mcp/index.ts`](src/lib/mcp/index.ts) for the full tool list and
server instructions.

## Tech stack

- React + TypeScript (Vite)
- Tailwind CSS + shadcn/ui
- Supabase / Lovable Cloud (Postgres + RLS)
- MCP server (`@lovable.dev/mcp-js`) deployed as Supabase Edge Function

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

MCP source: [`src/lib/mcp/`](src/lib/mcp/). The Vite `mcpPlugin()` bundles tools
into `supabase/functions/mcp/index.ts` on build.

## Docs map

| File | Use |
|------|-----|
| [`PRODUCT.md`](PRODUCT.md) | Product source of truth |
| [`docs/phase2-roles-schema.md`](docs/phase2-roles-schema.md) | Planned roles + responsibilities schema |
| [`SPEC.md`](SPEC.md) | Appraisal-cycle feature spec (check migrations for schema) |
| [`DESIGN.md`](DESIGN.md) | Visual system (marketing vs app surfaces) |
| [`tasks/architecture-plan.md`](tasks/architecture-plan.md) | Security / RLS remediation plan |
