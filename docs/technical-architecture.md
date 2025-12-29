# Technical Architecture (Current Implementation)

This document describes the architecture that is currently implemented in this repo. For planned work, see `TASK_PLAN.md`.

## Components

### Frontend (browser)

- React + TypeScript + Vite (`easy-risk-register-frontend/`)
- Authenticates via Supabase Auth (`@supabase/supabase-js`)
- Calls same-origin serverless APIs under `/api/*` (or `VITE_API_BASE_URL` when configured)
- Persists non-authoritative UI state locally (e.g. filters + cached preferences) with workspace-synced preferences where available (e.g. tooltips/onboarding via `/api/settings`)

### Serverless APIs

- Vercel serverless functions (`api/`)
- Require an end-user Supabase JWT (`Authorization: Bearer ...`)
- Resolve a request-scoped `workspaceId` (optional `x-workspace-id`, otherwise "Personal" workspace fallback)
- Call Supabase using the **anon key + user JWT**, so **RLS policies** remain the primary enforcement
- Workspace-scoped settings endpoints (e.g. `/api/settings`) store per-user preferences server-side with local fallback

See `docs/guides/security/auth-workspace-scoping-baseline.md`.

### Database (Supabase Postgres)

- Workspace-scoped tables (`workspaces`, `workspace_members`, `categories`, `risks`)
- RLS policies enforce per-user/per-workspace access
- Core schema lives in `supabase/init/*.sql`

## Data model

- Core risk fields live in first-class columns (`title`, `probability`, `impact`, `status`, etc.).
- Optional/advanced per-risk fields are stored in `public.risks.data` (jsonb) as an extension payload.

See `docs/reference/risk-record-schema.md`.

## Security model (high level)

- CSP enforced via headers (`vercel.json` and `easy-risk-register-frontend/server.mjs`)
- User input sanitized in the frontend before display and before sending to APIs
- Authorization enforced primarily by Supabase RLS; the API layer adds defense-in-depth scoping by `workspaceId`
- No Supabase service role key is shipped to the browser
