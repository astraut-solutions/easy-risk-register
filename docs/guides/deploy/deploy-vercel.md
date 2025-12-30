# Deploying to Vercel (Supabase + Serverless APIs)

This repo deploys as:

- **Frontend**: Vite static site built from `easy-risk-register-frontend/`
- **Backend**: Vercel Serverless Functions under `api/` (same-origin `/api/*`)

`vercel.json` in the repo root sets the build output directory and security headers (CSP).

## Environment variables

Vercel has two different “places” env vars are used:

- **Build-time (frontend)**: anything prefixed with `VITE_` is bundled into the browser build and is public.
- **Runtime (serverless)**: regular env vars are only available to Vercel functions under `api/`.

### Frontend (public, `VITE_*`)

Required for Supabase browser auth:

- `VITE_SUPABASE_URL` — Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (**safe to expose**)

Common optional vars:

- `VITE_API_BASE_URL` - leave blank for same-origin (`/api/...`) on Vercel; set only when pointing at a separate API host.
- Feature flags (see `easy-risk-register-frontend/.env.example`).

Never put secrets in `VITE_*` variables.

### Serverless APIs (secret, Vercel Functions)

Required for `/api/*` authentication + data access:

- `SUPABASE_URL` — Supabase Project URL (same value as `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` — Supabase anon/public key (used with user JWT so RLS applies)

Recommended / conditional:

- `SUPABASE_JWT_SECRET` — optional; enables local JWT verification (HS256). If unset, the API verifies tokens via Supabase Auth.
- `ENCRYPTION_KEY` — required in production for `/api/data-protection` (32 bytes). Accepts `base64` (32 bytes) or `hex` (64 chars). Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

Admin-only (only needed if you add endpoints that must bypass RLS):

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (**server-only; never expose to the browser**)

## Risk scoring thresholds (workspace-configurable)

Risk score is computed as `probability × impact` (1-25). Severity labels are derived from per-workspace thresholds stored in Postgres:

- Table: `public.workspace_risk_thresholds`
- Defaults (PRD): **Low 1-8**, **Medium 9-15**, **High 16-25**

There are **no environment variables** for thresholds. To change thresholds for a workspace, update the row in `public.workspace_risk_thresholds` (Owner/Admin only under RLS).

Example (Supabase SQL editor):

```sql
update public.workspace_risk_thresholds
set low_max = 7, medium_max = 14
where workspace_id = '<workspace-uuid>';
```

## Where to find Supabase values

From your Supabase project:

- **Project URL**: Project Settings → API → “Project URL”
- **Anon key**: Project Settings → API → “anon public”
- **Service role key**: Project Settings → API → “service_role” (**treat as a secret**)
- **JWT secret** (optional): Project Settings → API → JWT Settings → “JWT Secret”

## Vercel setup

1) Create a new Vercel project and import this repo.

2) Ensure the project is configured from the **repo root** (not `easy-risk-register-frontend/`):

- Build Command: `npm run build` (also defined in `vercel.json`)
- Output Directory: `easy-risk-register-frontend/dist` (also defined in `vercel.json`)

3) Add environment variables in Vercel:

- **Production**: set all required vars listed above.
- **Preview**: use a separate Supabase project (recommended) or a separate schema/keys strategy if sharing.

4) Deploy.

## API routing (Vercel)

Vercel automatically deploys any files under the repo root `api/` directory as Serverless Functions. That means:

- `api/users.js` becomes `GET /api/users`
- `api/risks/index.js` becomes `/api/risks`
- `api/risks/[id].js` becomes `/api/risks/:id`
- `api/exports/risks.csv.js` becomes `GET /api/exports/risks.csv` (download)
- `api/imports/risks.csv.js` becomes `POST /api/imports/risks.csv` (upload)

If the frontend and API are deployed in the same Vercel project (recommended), the frontend calls `/api/*` as **same-origin** requests.

## CSV export/import notes (Vercel)

- Export responses include `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`, and `Cache-Control: no-store`.
- Both endpoints require a valid `Authorization: Bearer <supabase-jwt>` header and are workspace-scoped via `x-workspace-id` (or fallback to personal workspace).
- Large exports/imports are bounded (row + payload limits). If you hit 413 errors, split the CSV into smaller files.

## CORS notes

- **On Vercel (recommended)**: no CORS configuration is needed because the frontend calls same-origin `/api/*`.
- **Local dev**: when the frontend runs on `http://localhost:5173` and the API runs on `http://localhost:3000`, the API sends CORS headers so the browser can call it cross-origin.

If you deploy the frontend and API on different hosts, treat CORS as a production security control: restrict allowed origins and avoid `*` with credentials.

## Smoke test (manual)

After deploying (or when running locally), validate the end-to-end persistence path:

1) Sign up/sign in.
2) Create a risk, refresh the page, confirm it still exists.
3) Edit the risk, refresh, confirm changes persist.
4) Delete the risk, refresh, confirm it is gone.
5) Sign in on another device/profile and confirm the same risks are visible (same user/workspace).

### Scoring boundary checks (manual)

Confirm the UI and API agree on severity boundaries by creating risks with these probability/impact pairs:

- Score `1` = `1×1` → `low`
- Score `8` = `2×4` (or `4×2`) → `low`
- Score `9` = `3×3` → `medium`
- Score `15` = `3×5` (or `5×3`) → `medium`
- Score `16` = `4×4` → `high`
- Score `25` = `5×5` → `high`

## Local parity (optional)

- Frontend env: `easy-risk-register-frontend/.env` (copy from `easy-risk-register-frontend/.env.example`)
- Serverless env (for `vercel dev`): `/.env.local` in the repo root

For more on keeping secrets out of the browser build, see `docs/guides/deploy/serverless-integrations.md`.

## Offline behavior (expectations)

Easy Risk Register is **online-first**: Supabase/Postgres is the system of record and core operations require connectivity.

- **Writes while offline are blocked**: create/update/delete/import actions are prevented client-side and show explicit “not saved” messaging.
- **Reads while offline degrade**: the UI shows a clear “Read-only mode” banner and displays either live data (when online) or cached data (if available).
- **Backend unreachable**: if `/api/*` returns a temporary-unavailable response, the UI enters read-only mode and offers a retry.

### Optional read-only cache (privacy + storage)

The app maintains an optional **read-only** browser cache for degraded viewing when offline/unreachable:

- **Storage**: IndexedDB (per-browser, per-device).
- **Bounds**: up to **100 risks** per workspace, restricted to items updated in the last **7 days** (whichever is smaller).
- **Freshness**: the UI shows a “Last updated” timestamp when cached data is shown.
- **Non-authoritative**: cached data is never treated as saved; writes remain blocked until connectivity returns.
- **Encryption interaction**: if in-browser encryption is enabled, cached data is stored encrypted; if the vault is locked, caching may be skipped and cached data may not be readable.

If your deployment has strict “no local storage of risk data” expectations, treat this cache as a feature to disable/avoid and document that users should not rely on offline access.
