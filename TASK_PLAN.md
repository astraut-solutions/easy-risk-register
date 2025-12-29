# Easy Risk Register Task Plan (Feature-Based)

Goal: ship a privacy-first, Australia-focused risk register where **core data is persisted in Supabase (Postgres)** and accessed via **server-side APIs** (Vercel serverless functions).

Each feature below is listed with the **database -> backend -> frontend -> deployment -> verification** work needed so that completing the feature means it is actually shippable.

## Status legend

- `[ ]` Planned / not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked (needs decision or prerequisite)

## Prefix legend

- `[database]` Supabase Postgres schema, migrations, RLS policies
- `[backend]` Vercel serverless APIs (`/api/*`)
- `[frontend]` Browser app (`easy-risk-register-frontend/`)
- `[deploy]` Vercel configuration, env vars, secrets, hosting
- `[docs]` Documentation updates
- `[arch]` Architectural decision / policy
- `[verify]` Tests, checks, and release validation

## Cycle 1 (Phase 1): Core DB-Backed Register (MVP)

### Feature: Auth + workspace scoping baseline
- [x] [arch] Workspace model decision (MVP): ship single-workspace UX, keep multi-workspace-ready schema
  - [x] Define MVP behavior: auto-create a "Personal" workspace on first login; user is Owner/Admin; UI shows current workspace (no switcher)
  - [x] Define post-MVP: add multi-workspace switcher + invites (P2) without schema changes
- [x] [arch] Workspace scoping decision: derive `workspace_id` via `workspace_members` (no custom JWT claim in MVP)
  - [x] Define request resolution: accept `x-workspace-id` (or query param) -> verify membership -> else fallback to user's personal workspace
  - [x] Document backend convention and rationale (revocation correctness; supports multi-workspace later)
- [x] [database] Create `workspaces` + `workspace_members` tables (roles: owner/admin/member/viewer)
  - [x] `workspaces` fields (id, name, created_at, created_by)
  - [x] `workspace_members` fields (workspace_id, user_id, role, created_at) + unique(workspace_id, user_id)
  - [x] Implemented in `supabase/init/002_workspaces_core_tables_rls.sql`
- [x] [database] Add required `workspace_id` + audit fields to core tables (at minimum: `risks`, `categories`)
  - [x] Enforced NOT NULL `workspace_id` (FK to `workspaces`)
  - [x] Added `created_by`, `updated_by`, `created_at`, `updated_at` + triggers to maintain audit fields
  - [x] Implemented in `supabase/init/002_workspaces_core_tables_rls.sql`
- [x] [database] Implement RLS policies for workspace isolation (and role constraints where applicable)
  - [x] Read policy: allow if `exists` membership row for current user in `workspace_members` for the row `workspace_id`
  - [x] Write policy: allow only for roles with write access (owner/admin/member)
  - [x] Admin policy: restrict admin-only actions (workspace + member management) to owner/admin
  - [x] Implemented in `supabase/init/002_workspaces_core_tables_rls.sql` (`public.current_uid()` helper; avoids clashing with GoTrue `auth` schema)
- [x] [backend] Implement auth/session verification for `/api/*` (no service keys in the browser)
  - [x] Require an end-user Supabase JWT; return 401 when missing/invalid
  - [x] Prefer passing the user JWT through to Supabase so RLS remains the primary enforcement
- [x] [backend] Add request-scoped `workspaceId` resolution used consistently across all endpoints
  - [x] If `x-workspace-id` provided: validate format and verify membership; else fallback to the user's personal workspace
  - [x] Ensure every query/mutation filters by resolved `workspaceId` (defense-in-depth on top of RLS)
  - [x] Standardize errors: 401 unauthenticated, 403 not a member, 404 not found-in-workspace
- [x] [frontend] Add sign-in/out UX and a clear "current workspace" indicator (even if only one workspace)
  - [x] MVP: show current workspace name (read-only), no switcher UI
  - [x] Centralize API client to optionally attach `x-workspace-id` later (when switcher ships)
- [x] [deploy] Document required env vars (Supabase URL, anon key for client, server-side secrets for APIs) and Vercel setup
- [x] [verify] Smoke test: cannot read/write outside workspace; no unauthenticated access to protected APIs

### Feature: Risk data model + CRUD as system of record
- [x] [database] Define `risks` table fields (description/title, category, probability, impact, mitigation, status, timestamps)
- [x] [database] Define `categories` table + seed baseline categories (AU SME-friendly defaults)
- [x] [database] Add indexes for list/filter (workspace_id, status, category, severity/score, updated_at)
- [x] [backend] Implement `GET/POST /api/risks` and `GET/PATCH/DELETE /api/risks/:id` with validation and consistent errors
- [x] [backend] Implement `GET /api/categories` (and admin-only category management if needed)
- [x] [frontend] Replace local persistence with API-backed queries/mutations (loading/error/empty states)
- [x] [frontend] Create/edit/delete risk flows with confirmation and form validation
- [x] [deploy/verify] Vercel API routing + CORS guidance documented; manual smoke test confirms create/edit/delete persists across refresh and devices

### Feature: Risk scoring (5x5) and severity thresholds
- [x] [database] Decide whether score is stored or computed (store `score`, `severity`, or compute in queries)
- [x] [database] Add workspace-configurable thresholds if required (defaults: Low 1-8, Medium 9-15, High 16-25)
- [x] [backend] Enforce score/severity consistency server-side (don't trust client calculations)
- [x] [frontend] Display score and severity labels; update in real-time as probability/impact change
- [x] [deploy] Add configuration knobs (if any) to documented env/settings flow
- [x] [verify] Check boundary cases (1, 8, 9, 15, 16, 25) render correctly and match API output

### Feature: Matrix view + filtering + drill-down
- [x] [database] Ensure filterable fields exist for MVP (category, status; add threat type later if needed)
- [x] [backend] Add list endpoints/params for filtering/sorting/pagination (avoid client-side filtering only)
- [x] [frontend] Implement interactive 5x5 matrix with cell counts and drill-down to filtered list
- [x] [frontend] Add accessible legends/labels (not color-only) and keyboard navigation for drill-down
- [x] [deploy] Verify performance on "up to 1000 risks" target (basic instrumentation notes)
- [x] [verify] Cross-browser spot check + accessibility quick pass (matrix + filters)

### Feature: Export baseline (CSV) + safe import (CSV)
- [x] [database] Decide which fields are exported/imported; align columns with schema and docs
- [x] [backend] Implement `GET /api/exports/risks.csv` (server-side) and validate workspace scoping
- [x] [backend] Implement `POST /api/imports/risks.csv` with validation and CSV injection defenses
- [x] [frontend] Add export UI (filters respected) and import UI (preview + error reporting)
- [ ] [deploy] Ensure export routes work in Vercel (streaming/response headers) and are protected by auth
- [ ] [verify] Validate CSV injection neutralization (`=`, `+`, `-`, `@`) on export/import and round-trip import

### Feature: Offline/unreachable behavior (MVP rules)
- [ ] [database] No change (behavioral requirement)
- [ ] [backend] Ensure APIs return clear error shapes for offline/unreachable cases
- [ ] [frontend] Block writes while offline; show explicit "not saved" messaging (no silent failures)
- [ ] [frontend] Optional: implement bounded read-only cache (last 7 days or 100 items) with "last updated" timestamp
- [ ] [deploy] Document offline expectations and any caching limits (privacy + storage)
- [ ] [verify] Toggle offline in browser devtools: confirm writes are blocked and cached view (if enabled) is read-only

### Feature: Cycle 1 release readiness
- [ ] [verify] Run frontend unit/integration tests (Vitest) and fix regressions
- [ ] [verify] Run E2E smoke tests (Playwright) for sign-in, CRUD, matrix, and export flows (where present)
- [ ] [verify] Run `npm run build` for `easy-risk-register-frontend/`
- [ ] [deploy] Validate Vercel deploy with required Supabase env vars configured

## Cycle 2 (Phase 2): Cyber Templates & Compliance

### Feature: Cyber risk templates (bundled, offline-capable)
- [ ] [database] Decide whether templates are bundled-only or also user-customizable (table + RLS if customizable)
- [ ] [backend] If customizable: implement template CRUD APIs (workspace-scoped); otherwise no backend required
- [ ] [frontend] Add template picker with preview; selecting a template pre-fills the risk form
- [ ] [frontend] Ensure template-derived risks become independent records when edited
- [ ] [deploy] Ensure templates are bundled in build artifacts (no runtime dependency)
- [ ] [verify] Create from template path end-to-end; ensure no network call required for bundled templates

### Feature: Compliance checklists (privacy incident assist)
- [ ] [database] Add checklist data model: checklist templates + per-risk checklist items with timestamps
- [ ] [database] Add checklist status fields/indexes to support filtering (not started/in progress/done)
- [ ] [backend] Implement checklist endpoints (attach template, complete item, list status) with workspace scoping
- [ ] [frontend] Add checklist UI on risk details (progress, timestamps) and checklist-based filtering
- [ ] [deploy] Ensure checklist endpoints are protected and documented (assistive guidance only)
- [ ] [verify] Edge case: updating checklist templates does not overwrite existing completion timestamps

### Feature: Threat type + checklist status filtering enhancements
- [ ] [database] Add `threat_type` (or equivalent) fields/enums to risks and indexes for filtering
- [ ] [backend] Extend risk list endpoints to filter by threat type and checklist state consistently
- [ ] [frontend] Add filter UI and ensure matrix + list + dashboard share the same filter semantics
- [ ] [deploy] Update env/docs as needed for new filters (none expected)
- [ ] [verify] Filter combinations behave consistently across views

### Feature: Guided onboarding + educational tooltips
- [ ] [database] Add user/workspace settings (tooltips on/off, onboarding state)
- [ ] [backend] Add settings endpoints (workspace-scoped)
- [ ] [frontend] Add tooltips on key fields + "first 3 steps" onboarding checklist; allow disabling tooltips
- [ ] [deploy] Ensure external links (if any) are optional and do not block core use
- [ ] [verify] Accessibility check for tooltip triggers and keyboard-only flow

## Cycle 3 (Phase 3): Reporting, Trends, Reminders

### Feature: Risk score history (bounded) for trends
- [ ] [database] Add `risk_score_snapshots` (or `risk_trends`) table with bounded retention strategy (20 snapshots per risk or 90 days)
- [ ] [backend] Record snapshots on create/update; add query endpoints for overall and per-risk trends
- [x] [backend] Migrate off Influx-based time-series if present (use Supabase as system of record)
- [ ] [frontend] Add trend views (overall exposure + per-risk history) with clear "what changed" UX
- [ ] [deploy] Remove/replace time-series env vars that are no longer needed (if applicable)
- [ ] [verify] Performance check on 1000 risks; retention bounds enforced

### Feature: Dashboard charts + PNG export
- [ ] [database] No change (depends on risk + history tables)
- [ ] [backend] Add aggregated endpoints as needed (or compute client-side with bounded payloads)
- [ ] [frontend] Implement 2-3 default charts (distribution + trends) with drill-down + accessible table equivalents
- [ ] [frontend] Implement PNG export (default 1080p) for charts
- [ ] [deploy] Verify bundle size and chart rendering performance
- [ ] [verify] Chart drill-down matches filters/matrix semantics; "DB unreachable" state is clear

### Feature: PDF exports (register + incident/checklist)
- [ ] [database] No change (uses existing data)
- [ ] [backend] Implement PDF generation endpoints for risk register (filtered) and incident/checklist template exports
- [ ] [frontend] Add export UI for PDF (include charts where enabled)
- [ ] [deploy] Confirm Vercel serverless limits are respected (PDF generation time/size) and document constraints
- [ ] [verify] Export validation (content correctness, filters, charts inclusion) + regression check on CSV export

### Feature: Automated reminders (notifications + in-app fallback)
- [ ] [database] Add reminder settings + risk metadata needed to schedule prompts (workspace-scoped)
- [ ] [backend] Define reminder computation logic (what is "due") and expose via API; avoid background jobs in MVP
- [ ] [frontend] Implement opt-in reminders; Notification API prompt; fallback in-app banners + snooze/disable
- [ ] [deploy] Document browser permission behavior and supported environments
- [ ] [verify] Denied permission path shows in-app reminders; cadence respects settings

## Cycle 4 (Phase 4): Advanced Privacy Controls (Optional)

### Feature: End-to-end encryption (selected fields)
- [ ] [arch] Confirm crypto posture (PBKDF2 + AES-GCM, no server-side recovery) and define sensitive fields
- [ ] [database] Ensure encrypted fields can be stored (ciphertext + metadata) without breaking search/list UX
- [ ] [backend] Ensure APIs treat encrypted fields as opaque (no plaintext logging); enforce payload limits
- [ ] [frontend] Implement passphrase flow (enable/disable/rotate) and client-side encrypt/decrypt via Web Crypto
- [ ] [deploy] Document limitations (no recovery), and ensure logs/telemetry don't capture plaintext
- [ ] [verify] Threat model review + recovery-flow validation (passphrase loss, rotation)

### Feature: Incident response planner (playbooks per risk)
- [ ] [database] Add playbook templates + per-risk playbook instances (editable)
- [ ] [backend] Implement playbook CRUD APIs (workspace-scoped)
- [ ] [frontend] Add playbook UI on risk details and include in relevant PDF exports
- [ ] [deploy] Document "assistive, not legal advice" constraints
- [ ] [verify] Playbooks remain editable and template updates don't overwrite existing risk playbooks

### Feature: Maturity radar (ACSC/NIST self-assessment)
- [ ] [database] Add maturity assessment tables (framework preset, domain scores, timestamps)
- [ ] [backend] Implement assessment CRUD APIs + query for latest/series
- [ ] [frontend] Implement radar chart + table fallback; export as PNG and include in PDFs
- [ ] [deploy] Ensure presets and copy avoid implying certification/compliance guarantees
- [ ] [verify] Accessibility check + export correctness

### Feature: Audit trail (append-only, role-based access)
- [ ] [database] Add `audit_events` append-only table + retention baseline (90 days) + RLS by role
- [ ] [backend] Record risk CRUD and checklist completion events; add per-risk activity log endpoint
- [ ] [frontend] Add per-risk activity log UI; restrict export to Owner/Admin
- [ ] [deploy] Document retention and access rules
- [ ] [verify] Verify role rules: Owner/Admin view+export, Member view-only, Viewer no access

## Cycle 5 (Phase 5): User Validation and Iteration

### Feature: Usability validation loop
- [ ] [docs] Prepare interview scripts and success-metric instrumentation plan (time-to-first-risk, export adoption)
- [ ] [frontend] Add lightweight UX instrumentation (privacy-respecting; can be local-only if needed)
- [ ] [verify] Run 5-10 SME interviews/tests; triage issues; feed into next task plan revision






