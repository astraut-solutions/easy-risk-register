# Serverless Integrations (No Browser Secrets)

Any integration that needs credentials (InfluxDB tokens, threat intel API keys, etc.) must run server-side, not in the browser.

## Why

In Vite, any environment variable prefixed with `VITE_` is bundled into the frontend build and can be read by anyone in the browser.

## Pattern used in this repo

- Frontend calls `/api/...` (same-origin on Vercel) or `VITE_API_BASE_URL + /api/...` (when pointing at a separate API host).
- Serverless functions live in `api/` and read **server-only** environment variables (no `VITE_` prefix).

## Time-series (InfluxDB)

API routes:

- `POST /api/timeseries/write`
- `GET /api/timeseries/query`

Server-side environment variables:

- `INFLUXDB_URL`
- `INFLUXDB_TOKEN`
- `INFLUXDB_ORG`
- `INFLUXDB_BUCKET`

## Time-series (Supabase Postgres) — local-first

Create a `risk_trends` table (recommended types):
- `risk_id` (text), `probability` (int), `impact` (int), `risk_score` (int), `timestamp` (bigint), `category` (text), `status` (text)

Server-side environment variables:

- `SUPABASE_URL` (local CLI default: `http://127.0.0.1:54321`)
- `SUPABASE_SERVICE_ROLE_KEY` (local CLI prints this as “Secret”; keep it server-side only)

## Local development options

- **Recommended for core app**: run the frontend only (`npm run dev`) and keep integrations disabled.
- **To develop serverless APIs locally**: use Vercel CLI (`vercel dev`) so `/api/*` routes are available locally.

### Local test checklist (Supabase + `/api/timeseries/*`)

1) Start Supabase:
- From the repo root: `supabase start`
- Open Studio: `http://127.0.0.1:54323`

2) Create the `risk_trends` table (SQL editor):

```sql
create table if not exists public.risk_trends (
  id uuid primary key default gen_random_uuid(),
  risk_id text not null,
  probability int not null,
  impact int not null,
  risk_score int not null,
  timestamp bigint not null,
  category text,
  status text
);

alter table public.risk_trends enable row level security;
alter table public.risk_trends force row level security;
```

No policies is intentional if you only access the table via server APIs (service role bypasses RLS).

3) Set server env vars for local `vercel dev`:
- `SUPABASE_URL=http://127.0.0.1:54321`
- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (from `supabase start` output)

4) Run local serverless + frontend:
- From repo root: `vercel dev`

5) Sanity check in browser:
- `http://localhost:3000/api/timeseries/query?limit=1`
