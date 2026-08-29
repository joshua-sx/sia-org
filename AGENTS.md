# Agent notes — SIA

Before changing product copy, roles, scoring, or appraisal UX, read **[`PRODUCT.md`](PRODUCT.md)**.

- Sia is an **organizational intelligence platform** (Layer 2: MCP + OAuth), not an in-app AI chatbot. The signed-in app is Layer 1 (performance appraisals).
- Do not describe ChatGPT integration as shipped until Phase 1 MCP tools are live.
- Employees do not self-review. Extra reviewers comment; they do not rate.
- Do not invent an acronym expansion for “SIA”.
- Do not describe SSO or cascading OKRs as shipped.
- When adding schema or features, follow PRODUCT.md **AI-ready by design** (model relationships, not flat strings).
- If marketing (`src/components/landing/*`, blog) disagrees with `PRODUCT.md`, flag it or fix the copy — do not change the product to match ads.
- For database columns and RLS, trust `supabase/migrations/` over SQL in `SPEC.md`.
- MCP tools live in `src/lib/mcp/`; they must stay read-only until Phase 3.
