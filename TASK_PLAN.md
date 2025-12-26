# Easy Risk Register Task Plan (Open Source, Vercel + Optional Integrations)

This plan is updated based on:

- `REPO_AUDIT_TASK_PLAN.md` (repo scan + gaps)
- `docs/product/product-requirements.md` (allows backend/integrations; core remains client-side-first)

Goal: make the app build/run locally, make integrations deployable as open source on Vercel (frontend + serverless APIs), and align implementation claims with reality (no "VERIFIED IMPLEMENTED" without build/tests/manual checks).

## Status legend

- `[ ]` Planned / not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked (needs decision or prerequisite)

## Prefix legend

- `[frontend]` Browser app (Vite/React/TS)
- `[backend]` Vercel serverless APIs (Node)
- `[infra]` Docker/services (DBs, Redis, realtime server)
- `[deploy]` Vercel configuration and environment
- `[docs]` Documentation updates
- `[arch]` Architectural decision / policy
- `[repo]` Repo hygiene/structure
- `[local]` Developer machine setup / local workflow

## P0 - Repo health (must pass build)

- [x] [frontend] Fix build errors (currently `npm run build` fails)
  - `easy-risk-register-frontend/src/services/graphDatabaseService.ts` (incomplete; TS parse error)
  - `easy-risk-register-frontend/src/services/timeSeriesService.ts` (incomplete; TS parse error)
  - `easy-risk-register-frontend/src/services/temp_realtime.ts` (incomplete; TS parse error)
- [x] [repo] Decide policy for experimental/incomplete code
  - Policy: keep integrations behind feature flags (off by default) and scope TS build to the actual app entry graph.
- [x] [frontend] Fix type/model mismatches that will break strict TS + runtime correctness
  - `Risk.financialImpact` is an object but some dashboards treat it as a number
  - `riskCalculations.ts` references `risk.exposure` (not in `Risk`)
- [x] [repo] Remove or quarantine temp/placeholder artifacts that confuse scope
  - `easy-risk-register-frontend/src/services/temp_realtime.ts`
  - `easy-risk-register-frontend/temp_executive_dashboard.tsx`
  - `easy-risk-register-frontend/test/temp.test.ts`
  - `test-security-features.js`

## P1 - Run locally (core app)

### Prerequisites

- [x] [local] Install Node.js LTS (recommend Node 20+)
- [x] [local] Install dependencies
  - From repo root: `npm run install`

### Development (frontend)

- [x] [frontend] Copy env: `easy-risk-register-frontend/.env.example` → `easy-risk-register-frontend/.env`
- [x] [frontend] Start dev server
  - From repo root: `npm run dev`
  - App: `http://localhost:5173`

### Build + production-like local run

- [x] [frontend] Build the frontend
  - From repo root: `npm run build`
- [x] [frontend] Serve the built frontend locally
  - `cd easy-risk-register-frontend && npm run preview`

### Tests (baseline)

- [x] [frontend] Run unit tests: `cd easy-risk-register-frontend && npm run test:run`
- [x] [frontend] Run lint: `cd easy-risk-register-frontend && npm run lint`

## P1 - Local integrations (optional, but supported)

### Integration principles (required for OSS + Vercel)

- [x] [arch] Do not ship secrets to the browser
  - Anything that requires a token (InfluxDB, threat intel, etc.) must be called from serverless APIs (Vercel functions), not directly from the frontend via `VITE_*` tokens.
- [x] [arch] Every integration must have:
  - Feature flag (off by default)
  - Safe empty-state UI
  - Clear "data leaves device" messaging
  - Minimal-permission credentials stored server-side only

### Time-series history (superbase)

- [x] [backend] Implement backend proxy APIs for time-series (token must not be exposed to the browser)
  - Create Vercel functions:
    - `POST /api/timeseries/write` (ingest snapshots)
    - `GET /api/timeseries/query` (read trends)
  - Local-first default: Supabase Postgres (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
  - Optional alternative: InfluxDB (`INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET`)
- [ ] [infra] Add local Docker compose for InfluxDB (dev only) and document setup
  - Provide steps: create org/bucket/token; set server env vars accordingly
- [x] [infra] Add local Docker compose for Supabase (dev only) and document setup
  - Minimal stack: Postgres + PostgREST + gateway for `/rest/v1`
- [ ] [frontend] Replace/rewire `easy-risk-register-frontend/src/services/timeSeriesService.ts` to call the backend proxy instead of using the Influx client in the browser
- [ ] [docs] Update `easy-risk-register-frontend/.env.example`
  - Replace `VITE_INFLUXDB_*` with `VITE_API_BASE_URL` (or similar) for client → backend
  - Add server-only vars for local/Vercel (no `VITE_` prefix): `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET`

### Real-time updates (Socket.io / WebSockets)

- [ ] [arch] Decide architecture for real-time in open source deployments
  - Option A: Vercel-hosted WebSocket service (not ideal on serverless; needs compatible hosting)
  - Option B: Separate small Node service (Docker-composeable) that the frontend can point at
- [ ] [infra] Implement and document local realtime server (if Option B)
  - Provide `docker-compose` service + `VITE_SOCKET_SERVER_URL`
- [ ] [frontend] Ensure `easy-risk-register-frontend/src/services/realtimeService.ts` is opt-in and does not break core app when unavailable

### Graph relationships (Neo4j/Memgraph/etc.)

- [!] [arch] Choose the graph database to support first (recommended: Neo4j, because `neo4j-driver` is already a dependency)
- [ ] [backend] Complete `easy-risk-register-frontend/src/services/graphDatabaseService.ts` or move logic to serverless (recommended)
  - Same rule: credentials must not be exposed to browser; use serverless proxy APIs
- [ ] [infra] Add docker-compose service for chosen graph DB and document local setup

### Caching (Redis)

- [ ] [arch] Decide where caching lives
  - Server-side: Redis for API responses/integration data (recommended)
  - Client-side: short-lived in-memory cache for derived views (already exists in `riskService.ts`)
- [ ] [infra] Add Redis to docker-compose (optional) and document env vars for server functions

### Threat intelligence + CVE correlation

- [ ] [backend] Implement serverless "connector" APIs (no direct API keys in browser)
  - `GET /api/threat-intel/*`
  - `GET /api/cve/*`
- [ ] [docs] Define minimum supported sources (start with unauthenticated feeds, then add optional API-key sources)
- [ ] [backend] Add input/output schemas, rate limiting/backoff, and caching strategy

## P2 - Vercel deployment (open source)

### Why Vercel (and why this architecture)

- [ ] [docs] Document "why" in this file (or README)
  - Frontend: static build served globally via CDN; simple OSS deployment
  - Backend: serverless functions scale-to-zero and keep secrets server-side
  - External OSS services: user/org can self-host (superbase, Neo4j, Redis) and connect via environment variables

### Frontend deployment (Vercel)

- [ ] [deploy] Ensure Vercel project builds from repo root
  - `vercel.json` uses `buildCommand: npm run build`
  - `outputDirectory: easy-risk-register-frontend/dist`
- [ ] [docs] Document required Vercel settings
  - Node version, build command, output directory, environment variables for feature flags and API base URL

### Backend deployment (Vercel serverless functions)

- [x] [backend] Align function directory with Vercel conventions
  - Vercel expects serverless functions under `/api/*` at repo root
  - Implemented: serverless functions live under `api/*`
- [ ] [backend] Move or mirror `backend/api/*` → `api/*` and fix imports
- [ ] [backend] Add/verify serverless runtime compatibility (ESM/CJS, node version)
- [ ] [deploy] Add server-only environment variables in Vercel (no `VITE_` prefix)
  - superbase, Neo4j, Redis, threat intel keys, etc.
- [ ] [backend] Add request validation, CORS policy, auth (if needed), and rate limiting

### Open source "deploy yourself" checklist

- [ ] [docs] Add a "Deploy your own" section (README or docs)
  - 1) Deploy frontend on Vercel
  - 2) Deploy API routes on Vercel
  - 3) (Optional) Bring your own OSS services (superbase/Neo4j/Redis) via Docker or hosted
  - 4) Configure environment variables
  - 5) Verify the app in "local-only" mode works even if integrations are off

## Feature verification (replace "VERIFIED IMPLEMENTED" with evidence)

For each feature area below, only mark as done after:

- Build passes (`npm run build`)
- Tests/lint pass (where present)
- Manual UI path verified

### Core risk management (PRD baseline)

- [ ] [frontend] Risk CRUD + validation
- [ ] [frontend] Risk scoring (probability × impact), severity labels
- [ ] [frontend] Interactive 5×5 matrix with drill-down + non-color cues
- [ ] [frontend] Filters consistent across list/matrix/charts
- [ ] [frontend] Score history snapshots with bounded retention + trend chart
- [ ] [frontend] CSV import/export with validation
- [ ] [frontend] PDF exports (register + checklist)
- [ ] [frontend] Reminders (in-app + optional desktop notifications)
- [ ] [frontend] Optional local encryption (passphrase; Web Crypto API)
- [ ] [frontend] Optional maturity radar

### Advanced/optional (integration-backed where appropriate)

- [ ] [backend] Threat intel + CVE enrichment (serverless APIs + caching)
- [ ] [backend] Time-series storage for long-term trends (serverless proxy + superbase)
- [ ] [backend] Graph relationships (serverless proxy + graph DB)
- [ ] [infra] Real-time collaboration/sync (separate service or compatible hosting)
- [ ] [arch] Performance: caching + async processing where justified
