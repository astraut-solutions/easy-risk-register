# Audit Trail: Retention and Access Rules

This document describes the **audit trail** retention baseline and the role-based access rules enforced by the database (Supabase/Postgres RLS) and the application UI.

## What is captured

Audit events are written to `public.audit_events` for:

- Risk create/update/delete
- Checklist item completion/uncompletion

Events are stored **append-only** with a minimal JSON payload designed to avoid copying large fields (and to avoid storing plaintext for E2EE-protected fields).

## Retention baseline (90 days)

Baseline retention is **90 days** (P2 requirement). The database includes a helper function:

- `public.prune_audit_events(p_before timestamptz default (now() - interval '90 days')) -> int`

Recommended operational approach:

1) Decide a schedule (e.g. daily).
2) Run the pruning query using a privileged database context:
   - `select public.prune_audit_events();`

Notes:

- Pruning requires `service_role` privileges (deletes are restricted to `service_role`).
- This repo does not ship a public HTTP endpoint for pruning; run it via database operations (migration/ops) or a scheduled database job in your environment.

## Access rules (roles)

Workspace roles are: `owner`, `admin`, `member`, `viewer`.

### Database (RLS)

RLS on `public.audit_events` enforces:

- Owner/Admin/Member: can **read** audit events in their workspace.
- Viewer: **no access** (read is denied).
- Insert: restricted to workspace “writers” (Owner/Admin/Member). Events are written by server-side APIs on behalf of end users.
- Update: blocked (append-only).
- Delete: restricted to `service_role` only (retention pruning).

### Application UI

The risk edit view shows an **Activity log (audit trail)** panel:

- Owner/Admin: can view and export the per-risk activity log (export downloads JSON locally).
- Member: can view only (export button disabled).
- Viewer: activity log is not shown (or shows an access message), and the backend returns `403` if called directly.

