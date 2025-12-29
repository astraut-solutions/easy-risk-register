-- Compliance checklists (privacy incident assist)
-- Adds:
--   - Checklist templates (global)
--   - Per-risk checklist instances + items with timestamps
--   - First-class checklist status fields + indexes for filtering
--
-- Notes:
--   - Template edits do NOT overwrite existing per-risk checklist items; instances copy the template at attach time.
--   - Status is maintained via triggers for fast filtering.
--
-- Rollback guidance is included at the end of the file (commented).

do $$
begin
  create type public.checklist_status as enum ('not_started', 'in_progress', 'done');
exception
  when duplicate_object then null;
end $$;

-- Global templates (safe to read in all workspaces; write restricted to service_role/admin workflows).
create table if not exists public.checklist_templates (
  id text primary key,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.checklist_templates (id) on delete cascade,
  position int not null check (position > 0),
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_template_items_template_position_unique unique (template_id, position)
);

create index if not exists checklist_template_items_template_id_idx on public.checklist_template_items (template_id);

-- Per-risk checklist instance (snapshot of template title/description at attach-time).
create table if not exists public.risk_checklists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  risk_id uuid not null references public.risks (id) on delete cascade,
  template_id text not null references public.checklist_templates (id),
  template_title text not null,
  template_description text not null default '',
  attached_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  status public.checklist_status not null default 'not_started',
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint risk_checklists_workspace_risk_template_unique unique (workspace_id, risk_id, template_id)
);

create table if not exists public.risk_checklist_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  checklist_id uuid not null references public.risk_checklists (id) on delete cascade,
  position int not null check (position > 0),
  description text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid,
  constraint risk_checklist_items_checklist_position_unique unique (checklist_id, position)
);

create index if not exists risk_checklists_workspace_id_idx on public.risk_checklists (workspace_id);
create index if not exists risk_checklists_workspace_id_risk_id_idx on public.risk_checklists (workspace_id, risk_id);
create index if not exists risk_checklists_workspace_id_status_idx on public.risk_checklists (workspace_id, status);
create index if not exists risk_checklist_items_workspace_id_idx on public.risk_checklist_items (workspace_id);
create index if not exists risk_checklist_items_workspace_id_checklist_id_idx on public.risk_checklist_items (workspace_id, checklist_id);
create index if not exists risk_checklist_items_workspace_id_completed_at_idx on public.risk_checklist_items (workspace_id, completed_at);

-- First-class status on risks for fast filtering (overall status across attached checklists).
alter table public.risks add column if not exists checklist_status public.checklist_status not null default 'not_started';
create index if not exists risks_workspace_id_checklist_status_idx on public.risks (workspace_id, checklist_status);

-- Audit triggers (re-use existing audit helper from 002).
drop trigger if exists risk_checklists_set_audit_fields on public.risk_checklists;
create trigger risk_checklists_set_audit_fields
  before insert or update on public.risk_checklists
  for each row execute function public.tg_set_audit_fields();

-- Status maintenance (runs with elevated privileges; explicit workspace checks happen at the API layer and RLS).
create or replace function public.refresh_risk_checklist_rollup(p_workspace_id uuid, p_risk_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_total int;
  v_not_started int;
  v_done int;
  v_status public.checklist_status;
begin
  select count(*)::int,
         count(*) filter (where status = 'not_started')::int,
         count(*) filter (where status = 'done')::int
    into v_total, v_not_started, v_done
  from public.risk_checklists
  where workspace_id = p_workspace_id
    and risk_id = p_risk_id;

  if v_total = 0 then
    v_status := 'not_started';
  elsif v_done = v_total then
    v_status := 'done';
  elsif v_not_started = v_total then
    v_status := 'not_started';
  else
    v_status := 'in_progress';
  end if;

  update public.risks
  set checklist_status = v_status
  where id = p_risk_id
    and workspace_id = p_workspace_id;
end $$;

create or replace function public.refresh_risk_checklist_status(p_workspace_id uuid, p_checklist_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_total int;
  v_completed int;
  v_status public.checklist_status;
  v_started_at timestamptz;
  v_completed_at timestamptz;
  v_risk_id uuid;
begin
  select rc.risk_id into v_risk_id
  from public.risk_checklists rc
  where rc.id = p_checklist_id
    and rc.workspace_id = p_workspace_id;

  if v_risk_id is null then
    return;
  end if;

  select count(*)::int,
         count(*) filter (where i.completed_at is not null)::int,
         min(i.completed_at),
         max(i.completed_at)
    into v_total, v_completed, v_started_at, v_completed_at
  from public.risk_checklist_items i
  where i.checklist_id = p_checklist_id
    and i.workspace_id = p_workspace_id;

  if v_total = 0 then
    v_status := 'not_started';
    v_started_at := null;
    v_completed_at := null;
  elsif v_completed = 0 then
    v_status := 'not_started';
    v_started_at := null;
    v_completed_at := null;
  elsif v_completed = v_total then
    v_status := 'done';
    -- started_at should reflect first completion (min completed_at)
    -- completed_at should reflect last completion (max completed_at)
  else
    v_status := 'in_progress';
    v_completed_at := null;
  end if;

  update public.risk_checklists
  set status = v_status,
      started_at = v_started_at,
      completed_at = v_completed_at
  where id = p_checklist_id
    and workspace_id = p_workspace_id;

  perform public.refresh_risk_checklist_rollup(p_workspace_id, v_risk_id);
end $$;

alter function public.refresh_risk_checklist_status(uuid, uuid) owner to service_role;
alter function public.refresh_risk_checklist_rollup(uuid, uuid) owner to service_role;
grant execute on function public.refresh_risk_checklist_status(uuid, uuid) to authenticated, service_role;
grant execute on function public.refresh_risk_checklist_rollup(uuid, uuid) to authenticated, service_role;

create or replace function public.tg_risk_checklist_items_refresh_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_risk_checklist_status(old.workspace_id, old.checklist_id);
    return old;
  end if;

  perform public.refresh_risk_checklist_status(new.workspace_id, new.checklist_id);
  return new;
end $$;

drop trigger if exists risk_checklist_items_refresh_status on public.risk_checklist_items;
create trigger risk_checklist_items_refresh_status
  after insert or update or delete on public.risk_checklist_items
  for each row execute function public.tg_risk_checklist_items_refresh_status();

create or replace function public.tg_risk_checklists_refresh_rollup()
returns trigger
language plpgsql
as $$
declare
  v_workspace_id uuid;
  v_risk_id uuid;
begin
  if tg_op = 'DELETE' then
    v_workspace_id := old.workspace_id;
    v_risk_id := old.risk_id;
  else
    v_workspace_id := new.workspace_id;
    v_risk_id := new.risk_id;
  end if;

  perform public.refresh_risk_checklist_rollup(v_workspace_id, v_risk_id);
  return coalesce(new, old);
end $$;

drop trigger if exists risk_checklists_refresh_rollup on public.risk_checklists;
create trigger risk_checklists_refresh_rollup
  after insert or update or delete on public.risk_checklists
  for each row execute function public.tg_risk_checklists_refresh_rollup();

-- Attach/complete RPCs (atomic; used by server-side APIs).
create or replace function public.attach_risk_checklist_template(
  p_workspace_id uuid,
  p_risk_id uuid,
  p_template_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_checklist_id uuid;
  v_title text;
  v_description text;
begin
  if not public.is_workspace_writer(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  if not exists (select 1 from public.risks r where r.id = p_risk_id and r.workspace_id = p_workspace_id) then
    raise exception 'Risk not found';
  end if;

  select t.title, t.description into v_title, v_description
  from public.checklist_templates t
  where t.id = p_template_id;

  if v_title is null then
    raise exception 'Unknown template';
  end if;

  insert into public.risk_checklists (
    workspace_id,
    risk_id,
    template_id,
    template_title,
    template_description,
    attached_at
  )
  values (p_workspace_id, p_risk_id, p_template_id, v_title, coalesce(v_description, ''), now())
  returning id into v_checklist_id;

  insert into public.risk_checklist_items (workspace_id, checklist_id, position, description, created_at)
  select p_workspace_id, v_checklist_id, i.position, i.description, now()
  from public.checklist_template_items i
  where i.template_id = p_template_id
  order by i.position asc;

  perform public.refresh_risk_checklist_rollup(p_workspace_id, p_risk_id);
  return v_checklist_id;
end $$;

create or replace function public.set_risk_checklist_item_completed(
  p_workspace_id uuid,
  p_risk_id uuid,
  p_item_id uuid,
  p_completed boolean
)
returns table (
  item_id uuid,
  checklist_id uuid,
  completed_at timestamptz,
  checklist_status public.checklist_status,
  risk_checklist_status public.checklist_status
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_checklist_id uuid;
  v_completed_at timestamptz;
  v_checklist_status public.checklist_status;
  v_risk_status public.checklist_status;
begin
  if not public.is_workspace_writer(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  update public.risk_checklist_items i
  set completed_at = case when p_completed then now() else null end,
      completed_by = case when p_completed then public.current_uid() else null end
  where i.id = p_item_id
    and i.workspace_id = p_workspace_id
    and exists (
      select 1
      from public.risk_checklists rc
      where rc.id = i.checklist_id
        and rc.workspace_id = p_workspace_id
        and rc.risk_id = p_risk_id
    )
  returning i.checklist_id, i.completed_at into v_checklist_id, v_completed_at;

  if v_checklist_id is null then
    raise exception 'Item not found';
  end if;

  perform public.refresh_risk_checklist_status(p_workspace_id, v_checklist_id);

  select rc.status into v_checklist_status
  from public.risk_checklists rc
  where rc.id = v_checklist_id
    and rc.workspace_id = p_workspace_id;

  select r.checklist_status into v_risk_status
  from public.risks r
  where r.id = p_risk_id
    and r.workspace_id = p_workspace_id;

  item_id := p_item_id;
  checklist_id := v_checklist_id;
  completed_at := v_completed_at;
  checklist_status := v_checklist_status;
  risk_checklist_status := v_risk_status;
  return next;
end $$;

alter function public.attach_risk_checklist_template(uuid, uuid, text) owner to service_role;
alter function public.set_risk_checklist_item_completed(uuid, uuid, uuid, boolean) owner to service_role;
grant execute on function public.attach_risk_checklist_template(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.set_risk_checklist_item_completed(uuid, uuid, uuid, boolean) to authenticated, service_role;

-- RLS
alter table public.checklist_templates enable row level security;
alter table public.checklist_templates force row level security;
alter table public.checklist_template_items enable row level security;
alter table public.checklist_template_items force row level security;
alter table public.risk_checklists enable row level security;
alter table public.risk_checklists force row level security;
alter table public.risk_checklist_items enable row level security;
alter table public.risk_checklist_items force row level security;

-- Templates: read for authenticated, no direct writes (seed/migrations only).
drop policy if exists checklist_templates_select_authenticated on public.checklist_templates;
create policy checklist_templates_select_authenticated
  on public.checklist_templates
  for select
  to authenticated
  using (true);

drop policy if exists checklist_template_items_select_authenticated on public.checklist_template_items;
create policy checklist_template_items_select_authenticated
  on public.checklist_template_items
  for select
  to authenticated
  using (true);

-- Per-risk instances: scoped to workspace membership.
drop policy if exists risk_checklists_select_member on public.risk_checklists;
create policy risk_checklists_select_member
  on public.risk_checklists
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_checklists_insert_writer on public.risk_checklists;
create policy risk_checklists_insert_writer
  on public.risk_checklists
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_checklists_update_writer on public.risk_checklists;
create policy risk_checklists_update_writer
  on public.risk_checklists
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_checklists_delete_admin on public.risk_checklists;
create policy risk_checklists_delete_admin
  on public.risk_checklists
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

drop policy if exists risk_checklist_items_select_member on public.risk_checklist_items;
create policy risk_checklist_items_select_member
  on public.risk_checklist_items
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_checklist_items_insert_writer on public.risk_checklist_items;
create policy risk_checklist_items_insert_writer
  on public.risk_checklist_items
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_checklist_items_update_writer on public.risk_checklist_items;
create policy risk_checklist_items_update_writer
  on public.risk_checklist_items
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_checklist_items_delete_admin on public.risk_checklist_items;
create policy risk_checklist_items_delete_admin
  on public.risk_checklist_items
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select on public.checklist_templates to authenticated, service_role;
grant select on public.checklist_template_items to authenticated, service_role;
grant select, insert, update, delete on public.risk_checklists to authenticated, service_role;
grant select, insert, update, delete on public.risk_checklist_items to authenticated, service_role;

-- Seed: Privacy incident response checklist template (id matches frontend constant).
insert into public.checklist_templates (id, title, description)
values (
  'checklist_privacy_incident_ndb_v1',
  'Privacy incident response (NDB assist)',
  'A lightweight checklist to help document key response steps for privacy incidents (assistive, not legal advice).'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

-- Upsert template items by (template_id, position); do not depend on stable UUIDs.
insert into public.checklist_template_items (template_id, position, description)
values
  ('checklist_privacy_incident_ndb_v1', 1, 'Confirm incident scope and affected systems/accounts'),
  ('checklist_privacy_incident_ndb_v1', 2, 'Containment: disable compromised accounts, isolate affected endpoints'),
  ('checklist_privacy_incident_ndb_v1', 3, 'Preserve evidence (logs, email headers, forensic images where possible)'),
  ('checklist_privacy_incident_ndb_v1', 4, 'Identify whether personal information is involved'),
  ('checklist_privacy_incident_ndb_v1', 5, 'Assess likelihood of serious harm (internal assessment)'),
  ('checklist_privacy_incident_ndb_v1', 6, 'Determine whether the incident may be an eligible data breach (NDB)'),
  ('checklist_privacy_incident_ndb_v1', 7, 'Prepare internal incident summary (timeline, actions, open items)'),
  ('checklist_privacy_incident_ndb_v1', 8, 'Decide notification approach and communications plan'),
  ('checklist_privacy_incident_ndb_v1', 9, 'Complete post-incident review and update controls/training')
on conflict (template_id, position) do update set
  description = excluded.description,
  updated_at = now();

-- Rollback (manual):
--   drop function if exists public.set_risk_checklist_item_completed(uuid, uuid, uuid, boolean);
--   drop function if exists public.attach_risk_checklist_template(uuid, uuid, text);
--   drop function if exists public.refresh_risk_checklist_status(uuid, uuid);
--   drop function if exists public.refresh_risk_checklist_rollup(uuid, uuid);
--   drop function if exists public.tg_risk_checklist_items_refresh_status();
--   drop function if exists public.tg_risk_checklists_refresh_rollup();
--   drop table if exists public.risk_checklist_items;
--   drop table if exists public.risk_checklists;
--   drop table if exists public.checklist_template_items;
--   drop table if exists public.checklist_templates;
--   alter table public.risks drop column if exists checklist_status;
--   drop type if exists public.checklist_status;
