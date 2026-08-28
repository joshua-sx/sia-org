# AGENTS.md

## Cursor Cloud specific instructions

SIA is a **frontend-only Vite + React + TypeScript** single-page app. There is no
local backend to run: the app talks to a **hosted Supabase (Lovable Cloud) project**
over the network, configured via the `VITE_SUPABASE_*` variables in the committed
`.env`. There is no local database, Docker, or `supabase start` step — do not try to
stand up a local Supabase instance.

### Services

There is a single service: the Vite dev server.

- Use `npm` (a `package-lock.json` is committed and the README documents `npm install`).
  A `bun.lock`/`bun.lockb` also exist, but Bun is not required and is not installed.
- Standard scripts live in `package.json`: `dev`, `build`, `lint`, `test`.
- The dev server listens on **port 8080** (set in `vite.config.ts`), not Vite's
  default 5173. Open `http://localhost:8080/`.

### Non-obvious caveats

- Auth, signup, and all data flows require outbound network access to the hosted
  Supabase project and its edge functions (`supabase/functions/*` are deployed
  remotely, not run locally). If signup/login fails, first check network reachability
  to the `VITE_SUPABASE_URL` host rather than assuming a code bug.
- New-account signup calls the remote `signup` edge function and then signs in with
  the password immediately (email confirmation is effectively disabled), landing on
  `/dashboard`. Use a unique email per signup to avoid "already registered" errors.
- `npm run lint` currently reports pre-existing errors/warnings in the checked-in code
  (e.g. `no-explicit-any`, `no-var`). These are not caused by environment setup.
- Tests run under Vitest + jsdom (`npm test`); they are pure frontend unit/component
  tests and do not require the backend.
