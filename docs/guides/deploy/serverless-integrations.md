# Serverless Integrations (No Browser Secrets)

Any integration that needs credentials (threat intel API keys, etc.) must run server-side, not in the browser.

## Why

In Vite, any environment variable prefixed with `VITE_` is bundled into the frontend build and can be read by anyone in the browser.

## Pattern used in this repo

- Frontend calls `/api/...` (same-origin on Vercel) or `VITE_API_BASE_URL + /api/...` (when pointing at a separate API host).
- Serverless functions live in `api/` and read **server-only** environment variables (no `VITE_` prefix).

## CORS guidance (local dev vs. production)

- **Same-origin on Vercel**: recommended. The frontend calls `/api/*` on the same origin, so CORS is not involved.
- **Local dev (cross-origin)**: common when running Vite on `http://localhost:5173` and the dev API on `http://localhost:3000`. The API sets CORS headers so browser requests are allowed.
- **Separate hosts in production**: avoid if possible. If you must split frontend and API across origins, restrict allowed origins and do not rely on permissive defaults.

## Feature flags (frontend)

Integrations are feature-flagged and **off by default**. See `easy-risk-register-frontend/.env.example` for the current list, including:

- `VITE_ENABLE_TIMESERIES`
- `VITE_ENABLE_GRAPH_DB`
- `VITE_ENABLE_REALTIME`
- `VITE_ENABLE_SIEM`
- `VITE_ENABLE_VULN_SCANNER`

When an integration is enabled, the app must show clear "data leaves device" messaging and still behave safely when the integration backend is unavailable.

## Auth-protected APIs (serverless)

All `/api/*` routes require an **end-user Supabase JWT** (Bearer token):

- `GET /api/users` (returns current user + resolved `workspaceId`)
- `POST /api/audit`
- `POST /api/data-protection` (encrypt/decrypt)
- `GET/POST /api/timeseries/*`
- `GET /api/risks/:id/checklists` (list per-risk checklist instances + items)
- `POST /api/risks/:id/checklists` (attach a checklist template to a risk)
- `PATCH /api/risks/:id/checklists/items/:itemId` (complete/uncomplete a checklist item)

Notes:

- Checklist templates and checklist UX are **assistive guidance only** (not legal advice).
- Checklist endpoints are workspace-scoped via `x-workspace-id` (or personal-workspace fallback) and enforced primarily by Supabase RLS.

Server-side environment variables:

- `SUPABASE_URL` (required)
- `SUPABASE_ANON_KEY` (required; server uses this with the user's JWT so RLS enforces access)
- `SUPABASE_JWT_SECRET` (optional; enables local JWT verification, otherwise the API verifies via Supabase Auth)
- `ENCRYPTION_KEY` (required in production; used by `/api/data-protection`)

## Time-series (Supabase Postgres)

Time-series snapshots are stored in Supabase Postgres in `public.risk_trends`:
- `workspace_id` (uuid), `risk_id` (text), `probability` (int), `impact` (int), `risk_score` (int), `timestamp` (bigint), `category` (text), `status` (text)

### Docker Compose (dev only)

This repo includes a minimal Supabase-compatible local stack (Postgres + PostgREST + a small gateway) under the `development` Docker Compose profile.

Start it:

- From the repo root: `docker-compose --profile development up -d supabase-db supabase-rest supabase-gateway`

Set server-side env vars for your local serverless runtime (`vercel dev`):

- `SUPABASE_URL=http://127.0.0.1:54321`
- `SUPABASE_ANON_KEY=<dev key>`
- `SUPABASE_JWT_SECRET=<dev jwt secret>` (optional but recommended for local verification)

Dev-only defaults used by the minimal compose stack:

- JWT secret: `dev-supabase-jwt-secret` (override by setting `SUPABASE_JWT_SECRET`)
- Keys: generated JWTs for `anon` and `service_role` (set `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY`)

### Rotating local Supabase keys (recommended after any exposure)

1) Generate fresh local keys:

- `node scripts/generate-local-supabase-keys.mjs`

2) Put the output into your root `/.env.local` (gitignored) or export them in your shell.

3) Restart the local stack (dev profile):

- `docker-compose --profile development down`
- `docker-compose --profile development up -d supabase-db supabase-rest supabase-auth supabase-storage supabase-realtime supabase-gateway`

Notes:

- Dev only; do not reuse these keys in production.
- The gateway exposes PostgREST at `/rest/v1` so `@supabase/supabase-js` works with `SUPABASE_URL=http://127.0.0.1:54321`.

Server-side environment variables:

- `SUPABASE_URL` (compose gateway: `http://127.0.0.1:54321`)
- `SUPABASE_ANON_KEY` (set in `/.env.local` or your shell)
- `SUPABASE_JWT_SECRET` (optional; local JWT verification)

## Local development options

- **Recommended for core app**: run the frontend only (`npm run dev`) and keep integrations disabled.
- **To develop serverless APIs locally**: use Vercel CLI (`vercel dev`) so `/api/*` routes are available locally.

### Local test checklist (Supabase + `/api/timeseries/*`)

1) Start the local Supabase stack (Docker Compose):
- From the repo root: `docker-compose --profile development up -d supabase-studio`
- Open Studio: `http://127.0.0.1:54323`

2) Apply the Supabase init SQLs (psql):

- `docker exec -i easy-risk-register-supabase-db-1 psql -U postgres -d postgres < supabase/init/001_roles_and_schema.sql`
- `docker exec -i easy-risk-register-supabase-db-1 psql -U postgres -d postgres < supabase/init/002_workspaces_core_tables_rls.sql`
- `docker exec -i easy-risk-register-supabase-db-1 psql -U postgres -d postgres < supabase/init/003_risk_trends_workspace_rls.sql`

Notes:

- The container name may differ depending on your Docker project name; use `docker ps` to find the Postgres container.

3) Set server env vars for local `vercel dev`:
- `SUPABASE_URL=http://127.0.0.1:54321`
- `SUPABASE_ANON_KEY=...` (from your `/.env.local` or `scripts/generate-local-supabase-keys.mjs`)
- `SUPABASE_JWT_SECRET=...` (optional; enables local JWT verification)

4) Run local serverless + frontend:
- From repo root: `vercel dev`

5) Sanity check in browser:
- Use a client that can set headers (Bearer token required), e.g. `curl -H "Authorization: Bearer <jwt>" "http://localhost:3000/api/timeseries/query?limit=1"`
