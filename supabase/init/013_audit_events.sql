-- Audit trail (append-only, role-based access)
-- Adds:
--   - public.audit_events (append-only)
--   - RLS: Owner/Admin/Member can read; Viewer has no access
--   - Retention baseline: helper function to prune older than 90 days
--
-- Notes:
--   - This table is append-only for `authenticated` via privileges + RLS.
--   - Deletes are allowed only for `service_role` (retention pruning).
--   - Payload should avoid storing plaintext for E2EE fields; store minimal metadata.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  risk_id uuid,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid not null,
  actor_role public.workspace_role not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_workspace_id_occurred_at_idx
  on public.audit_events (workspace_id, occurred_at desc);
create index if not exists audit_events_workspace_id_risk_id_occurred_at_idx
  on public.audit_events (workspace_id, risk_id, occurred_at desc);
create index if not exists audit_events_event_type_idx
  on public.audit_events (event_type);

-- Populate actor fields from the request JWT (server-side APIs pass end-user JWT through to PostgREST).
create or replace function public.tg_audit_events_set_actor()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid;
  v_role public.workspace_role;
begin
  if new.actor_user_id is null then
    v_uid := public.current_uid();
    if v_uid is null then
      raise exception 'Missing actor_user_id';
    end if;
    new.actor_user_id := v_uid;
  end if;

  if new.actor_role is null then
    select wm.role into v_role
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.actor_user_id;

    if v_role is null then
      raise exception 'Forbidden';
    end if;

    new.actor_role := v_role;
  end if;

  if new.occurred_at is null then
    new.occurred_at := now();
  end if;

  return new;
end $$;

alter function public.tg_audit_events_set_actor() owner to service_role;
grant execute on function public.tg_audit_events_set_actor() to authenticated, service_role;

drop trigger if exists audit_events_set_actor on public.audit_events;
create trigger audit_events_set_actor
  before insert on public.audit_events
  for each row execute function public.tg_audit_events_set_actor();

-- Prevent updates (append-only). Deletes are allowed only for service_role (retention).
create or replace function public.tg_audit_events_prevent_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end $$;

drop trigger if exists audit_events_prevent_update on public.audit_events;
create trigger audit_events_prevent_update
  before update on public.audit_events
  for each row execute function public.tg_audit_events_prevent_update();

create or replace function public.tg_audit_events_restrict_delete()
returns trigger
language plpgsql
as $$
begin
  if current_user <> 'service_role' then
    raise exception 'audit_events delete restricted';
  end if;
  return old;
end $$;

drop trigger if exists audit_events_restrict_delete on public.audit_events;
create trigger audit_events_restrict_delete
  before delete on public.audit_events
  for each row execute function public.tg_audit_events_restrict_delete();

-- Retention helper (baseline: 90 days).
create or replace function public.prune_audit_events(p_before timestamptz default (now() - interval '90 days'))
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_deleted int;
begin
  delete from public.audit_events
  where occurred_at < p_before;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

alter function public.prune_audit_events(timestamptz) owner to service_role;
grant execute on function public.prune_audit_events(timestamptz) to service_role;

-- RLS
alter table public.audit_events enable row level security;
alter table public.audit_events force row level security;

-- View: Owner/Admin/Member; no Viewer access.
drop policy if exists audit_events_select_writer on public.audit_events;
create policy audit_events_select_writer
  on public.audit_events
  for select
  to authenticated
  using (public.is_workspace_writer(workspace_id));

-- Append-only inserts from writers (server-side APIs will record events on behalf of end users).
drop policy if exists audit_events_insert_writer on public.audit_events;
create policy audit_events_insert_writer
  on public.audit_events
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

grant select, insert on public.audit_events to authenticated, service_role;

-- Rollback (manual):
--   drop function if exists public.prune_audit_events(timestamptz);
--   drop trigger if exists audit_events_restrict_delete on public.audit_events;
--   drop function if exists public.tg_audit_events_restrict_delete();
--   drop trigger if exists audit_events_prevent_update on public.audit_events;
--   drop function if exists public.tg_audit_events_prevent_update();
--   drop trigger if exists audit_events_set_actor on public.audit_events;
--   drop function if exists public.tg_audit_events_set_actor();
--   drop table if exists public.audit_events;
