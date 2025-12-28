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

- `VITE_API_BASE_URL` — leave blank for same-origin (`/api/...`) on Vercel; set only when pointing at a separate API host.
- Feature flags (see `easy-risk-register-frontend/.env.example`), e.g. `VITE_ENABLE_TIMESERIES`.

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

If you enable time-series integrations:

- `INFLUXDB_URL`
- `INFLUXDB_TOKEN`
- `INFLUXDB_ORG`
- `INFLUXDB_BUCKET`

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

If the frontend and API are deployed in the same Vercel project (recommended), the frontend calls `/api/*` as **same-origin** requests.

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

## Local parity (optional)

- Frontend env: `easy-risk-register-frontend/.env` (copy from `easy-risk-register-frontend/.env.example`)
- Serverless env (for `vercel dev`): `/.env.local` in the repo root

For more on keeping secrets out of the browser build, see `docs/guides/deploy/serverless-integrations.md`.
