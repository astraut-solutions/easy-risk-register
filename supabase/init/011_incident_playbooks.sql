-- Incident response planner (playbooks per risk)
-- Adds:
--   - Playbook templates (global)
--   - Per-risk playbook instances + editable steps (workspace-scoped)
--
-- Notes:
--   - Template edits do NOT overwrite existing per-risk playbooks; instances copy the template at attach time.
--   - Instances are intended to be lightweight and printable (assistive, not legal advice).
--
-- Rollback guidance is included at the end of the file (commented).

do $$
begin
  create type public.playbook_step_section as enum ('roles', 'immediate_actions', 'communications', 'recovery', 'other');
exception
  when duplicate_object then null;
end $$;

-- Global templates (safe to read in all workspaces; writes restricted to service_role/admin workflows).
create table if not exists public.playbook_templates (
  id text primary key,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playbook_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.playbook_templates (id) on delete cascade,
  position int not null check (position > 0),
  section public.playbook_step_section not null default 'other',
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playbook_template_steps_template_position_unique unique (template_id, position)
);

create index if not exists playbook_template_steps_template_id_idx on public.playbook_template_steps (template_id);
create index if not exists playbook_template_steps_template_id_section_idx on public.playbook_template_steps (template_id, section);

-- Per-risk playbook instance (snapshot of template title/description and steps at attach-time).
create table if not exists public.risk_playbooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  risk_id uuid not null references public.risks (id) on delete cascade,
  template_id text not null references public.playbook_templates (id),
  template_title text not null,
  template_description text not null default '',
  attached_at timestamptz not null default now(),
  title text not null,
  description text not null default '',
  data jsonb not null default '{}'::jsonb,
  encrypted_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint risk_playbooks_workspace_risk_template_unique unique (workspace_id, risk_id, template_id)
);

do $$
begin
  alter table public.risk_playbooks
    add constraint risk_playbooks_data_is_object check (jsonb_typeof(data) = 'object');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.risk_playbooks
    add constraint risk_playbooks_encrypted_fields_is_object check (jsonb_typeof(encrypted_fields) = 'object');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.risk_playbook_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  risk_id uuid not null references public.risks (id) on delete cascade,
  playbook_id uuid not null references public.risk_playbooks (id) on delete cascade,
  position int not null check (position > 0),
  section public.playbook_step_section not null default 'other',
  description text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid,
  constraint risk_playbook_steps_playbook_position_unique unique (playbook_id, position)
);

create index if not exists risk_playbooks_workspace_id_idx on public.risk_playbooks (workspace_id);
create index if not exists risk_playbooks_workspace_id_risk_id_idx on public.risk_playbooks (workspace_id, risk_id);
create index if not exists risk_playbook_steps_workspace_id_idx on public.risk_playbook_steps (workspace_id);
create index if not exists risk_playbook_steps_workspace_id_risk_id_idx on public.risk_playbook_steps (workspace_id, risk_id);
create index if not exists risk_playbook_steps_workspace_id_playbook_id_idx on public.risk_playbook_steps (workspace_id, playbook_id);
create index if not exists risk_playbook_steps_workspace_id_completed_at_idx on public.risk_playbook_steps (workspace_id, completed_at);

-- Audit triggers (re-use existing audit helper from 002).
drop trigger if exists risk_playbooks_set_audit_fields on public.risk_playbooks;
create trigger risk_playbooks_set_audit_fields
  before insert or update on public.risk_playbooks
  for each row execute function public.tg_set_audit_fields();

-- Attach RPC (atomic; used by server-side APIs).
create or replace function public.attach_risk_playbook_template(
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
  v_playbook_id uuid;
  v_title text;
  v_description text;
begin
  if not public.is_workspace_writer(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  if not exists (
    select 1
    from public.risks r
    where r.id = p_risk_id
      and r.workspace_id = p_workspace_id
  ) then
    raise exception 'Risk not found';
  end if;

  select t.title, t.description
    into v_title, v_description
  from public.playbook_templates t
  where t.id = p_template_id;

  if v_title is null then
    raise exception 'Unknown template';
  end if;

  insert into public.risk_playbooks (
    workspace_id,
    risk_id,
    template_id,
    template_title,
    template_description,
    attached_at,
    title,
    description
  )
  values (
    p_workspace_id,
    p_risk_id,
    p_template_id,
    v_title,
    coalesce(v_description, ''),
    now(),
    v_title,
    ''
  )
  returning id into v_playbook_id;

  insert into public.risk_playbook_steps (
    workspace_id,
    risk_id,
    playbook_id,
    position,
    section,
    description
  )
  select
    p_workspace_id,
    p_risk_id,
    v_playbook_id,
    s.position,
    s.section,
    s.description
  from public.playbook_template_steps s
  where s.template_id = p_template_id
  order by s.position asc;

  return v_playbook_id;
end $$;

alter function public.attach_risk_playbook_template(uuid, uuid, text) owner to service_role;
grant execute on function public.attach_risk_playbook_template(uuid, uuid, text) to authenticated, service_role;

-- RLS
alter table public.playbook_templates enable row level security;
alter table public.playbook_templates force row level security;

alter table public.playbook_template_steps enable row level security;
alter table public.playbook_template_steps force row level security;

alter table public.risk_playbooks enable row level security;
alter table public.risk_playbooks force row level security;

alter table public.risk_playbook_steps enable row level security;
alter table public.risk_playbook_steps force row level security;

-- Templates: readable by any authenticated user.
drop policy if exists playbook_templates_select_authenticated on public.playbook_templates;
create policy playbook_templates_select_authenticated
  on public.playbook_templates
  for select
  to authenticated
  using (true);

drop policy if exists playbook_template_steps_select_authenticated on public.playbook_template_steps;
create policy playbook_template_steps_select_authenticated
  on public.playbook_template_steps
  for select
  to authenticated
  using (true);

-- Per-risk instances: scoped to workspace membership.
drop policy if exists risk_playbooks_select_member on public.risk_playbooks;
create policy risk_playbooks_select_member
  on public.risk_playbooks
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_playbooks_insert_writer on public.risk_playbooks;
create policy risk_playbooks_insert_writer
  on public.risk_playbooks
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_playbooks_update_writer on public.risk_playbooks;
create policy risk_playbooks_update_writer
  on public.risk_playbooks
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_playbooks_delete_writer on public.risk_playbooks;
create policy risk_playbooks_delete_writer
  on public.risk_playbooks
  for delete
  to authenticated
  using (public.is_workspace_writer(workspace_id));

drop policy if exists risk_playbook_steps_select_member on public.risk_playbook_steps;
create policy risk_playbook_steps_select_member
  on public.risk_playbook_steps
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_playbook_steps_insert_writer on public.risk_playbook_steps;
create policy risk_playbook_steps_insert_writer
  on public.risk_playbook_steps
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_playbook_steps_update_writer on public.risk_playbook_steps;
create policy risk_playbook_steps_update_writer
  on public.risk_playbook_steps
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risk_playbook_steps_delete_writer on public.risk_playbook_steps;
create policy risk_playbook_steps_delete_writer
  on public.risk_playbook_steps
  for delete
  to authenticated
  using (public.is_workspace_writer(workspace_id));

grant select on public.playbook_templates to authenticated, service_role;
grant select on public.playbook_template_steps to authenticated, service_role;
grant select, insert, update, delete on public.risk_playbooks to authenticated, service_role;
grant select, insert, update, delete on public.risk_playbook_steps to authenticated, service_role;

-- Seed: Privacy incident response playbook template (assistive, not legal advice).
insert into public.playbook_templates (id, title, description)
values (
  'playbook_privacy_incident_ndb_v1',
  'Privacy incident response playbook (NDB assist)',
  'A lightweight playbook to help plan roles and response steps for privacy incidents (assistive, not legal advice).'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

-- Upsert template steps by (template_id, position); do not depend on stable UUIDs.
insert into public.playbook_template_steps (template_id, position, section, description)
values
  ('playbook_privacy_incident_ndb_v1', 1, 'roles', 'Incident lead (name + contact details)'),
  ('playbook_privacy_incident_ndb_v1', 2, 'roles', 'Technical lead / IT support (internal or MSP contact)'),
  ('playbook_privacy_incident_ndb_v1', 3, 'roles', 'Communications lead (customer / staff comms)'),
  ('playbook_privacy_incident_ndb_v1', 4, 'immediate_actions', 'Containment: disable compromised accounts and isolate affected devices'),
  ('playbook_privacy_incident_ndb_v1', 5, 'immediate_actions', 'Preserve evidence: capture logs, email headers, and timelines'),
  ('playbook_privacy_incident_ndb_v1', 6, 'immediate_actions', 'Identify data involved: what personal info may be affected'),
  ('playbook_privacy_incident_ndb_v1', 7, 'communications', 'Internal notification: inform leadership and relevant staff'),
  ('playbook_privacy_incident_ndb_v1', 8, 'communications', 'Customer communications: draft and approve messaging (if needed)'),
  ('playbook_privacy_incident_ndb_v1', 9, 'recovery', 'Recovery: reset passwords/keys, patch root cause, restore from backups if needed'),
  ('playbook_privacy_incident_ndb_v1', 10, 'recovery', 'Post-incident review: document lessons learned and update controls/training')
on conflict (template_id, position) do update set
  section = excluded.section,
  description = excluded.description,
  updated_at = now();

-- Rollback (manual):
--   drop function if exists public.attach_risk_playbook_template(uuid, uuid, text);
--   drop trigger if exists risk_playbooks_set_audit_fields on public.risk_playbooks;
--   drop table if exists public.risk_playbook_steps;
--   drop table if exists public.risk_playbooks;
--   drop table if exists public.playbook_template_steps;
--   drop table if exists public.playbook_templates;
--   drop type if exists public.playbook_step_section;

