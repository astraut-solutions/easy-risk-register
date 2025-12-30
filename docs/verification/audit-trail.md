# Audit Trail Verification

Goal: verify audit trail **visibility and export rules** by role, and confirm audit events are being recorded for the required actions.

## Prerequisites

- Supabase migrations applied through `supabase/init/013_audit_events.sql`
- At least one workspace with at least one risk
- You can create multiple test users and set workspace roles (Owner/Admin/Member/Viewer)

If you don’t have an invites UI yet, you can set roles via Supabase SQL editor (admin/service context):

1) Find workspace id:
   - `select id, name, created_by from public.workspaces order by created_at desc;`
2) Find user ids (choose a method that matches your auth setup; examples):
   - Supabase dashboard auth users list, or
   - `select id, email from auth.users order by created_at desc;`
3) Add members:
   - `insert into public.workspace_members (workspace_id, user_id, role) values ('<workspace_id>', '<user_id>', 'member');`
   - Repeat for `viewer` and optionally `admin`.

## Verify: events are recorded

Using an **Owner/Admin/Member** account in the app:

1) Create a risk.
2) Update the risk (change title/status/likelihood/impact).
3) Toggle a checklist item completed/uncompleted on that risk.
4) Delete a different test risk.

Expected:

- The risk shows an **Activity log (audit trail)** section with entries for:
  - `risk.created`
  - `risk.updated`
  - `checklist_item.completed` / `checklist_item.uncompleted`
  - `risk.deleted` (for the deleted risk)

Optional DB spot-check (SQL editor):

- `select event_type, occurred_at, actor_user_id, actor_role, payload from public.audit_events order by occurred_at desc limit 50;`

## Verify: role access rules

### Owner/Admin

1) Open a risk.
2) Expand **Activity log (audit trail)**.

Expected:

- Entries are visible.
- Export button is enabled and downloads a JSON file.

### Member

1) Open the same risk.
2) Expand **Activity log (audit trail)**.

Expected:

- Entries are visible.
- Export button is disabled (or absent), with copy indicating export is restricted.

### Viewer

1) Open the same risk.
2) Expand **Activity log (audit trail)**.

Expected:

- The UI indicates the audit trail is not available for Viewer.
- Direct API access is denied:
  - `GET /api/risks/:id/activity` returns `403`.

## Verify: retention baseline (manual)

In a privileged database context:

1) Run:
   - `select public.prune_audit_events();`

Expected:

- The function returns an integer count of deleted rows (likely `0` in a fresh environment).

