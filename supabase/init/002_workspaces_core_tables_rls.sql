-- Multi-tenant workspace model + RLS policies.
-- This repo can run either a minimal PostgREST stack or a fuller Supabase stack (GoTrue, etc).
-- To avoid clashing with GoTrue's `auth` schema, we use a local helper that extracts the JWT `sub` claim.

create or replace function public.current_uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif((current_setting('request.jwt.claims', true)::json ->> 'sub'), '')
  )::uuid
$$;

grant execute on function public.current_uid() to anon, authenticated, service_role;

do $$
begin
  create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  constraint workspace_members_pkey primary key (workspace_id, user_id)
);

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index if not exists workspace_members_workspace_id_role_idx on public.workspace_members (workspace_id, role);

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = public.current_uid()
  )
$$;

create or replace function public.is_workspace_writer(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = public.current_uid()
      and wm.role in ('owner', 'admin', 'member')
  )
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = public.current_uid()
      and wm.role in ('owner', 'admin')
  )
$$;

alter function public.is_workspace_member(uuid) owner to service_role;
alter function public.is_workspace_writer(uuid) owner to service_role;
alter function public.is_workspace_admin(uuid) owner to service_role;

grant execute on function public.is_workspace_member(uuid) to anon, authenticated, service_role;
grant execute on function public.is_workspace_writer(uuid) to anon, authenticated, service_role;
grant execute on function public.is_workspace_admin(uuid) to anon, authenticated, service_role;

alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

alter table public.workspace_members enable row level security;
alter table public.workspace_members force row level security;

-- Workspaces
drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member
  on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists workspaces_insert_self on public.workspaces;
create policy workspaces_insert_self
  on public.workspaces
  for insert
  to authenticated
  with check (created_by = public.current_uid());

drop policy if exists workspaces_update_admin on public.workspaces;
create policy workspaces_update_admin
  on public.workspaces
  for update
  to authenticated
  using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));

drop policy if exists workspaces_delete_admin on public.workspaces;
create policy workspaces_delete_admin
  on public.workspaces
  for delete
  to authenticated
  using (public.is_workspace_admin(id));

-- Workspace members
drop policy if exists workspace_members_select_member on public.workspace_members;
create policy workspace_members_select_member
  on public.workspace_members
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_members_insert_admin on public.workspace_members;
create policy workspace_members_insert_admin
  on public.workspace_members
  for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_members_update_admin on public.workspace_members;
create policy workspace_members_update_admin
  on public.workspace_members
  for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_members_delete_admin on public.workspace_members;
create policy workspace_members_delete_admin
  on public.workspace_members
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspaces to authenticated, service_role;
grant select, insert, update, delete on public.workspace_members to authenticated, service_role;

-- Core tables (first pass): categories + risks.
-- These are intentionally minimal and can be expanded later as more server-side persistence is introduced.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create unique index if not exists categories_workspace_id_name_uq
  on public.categories (workspace_id, lower(name));
create index if not exists categories_workspace_id_idx
  on public.categories (workspace_id);

create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text not null default '',
  probability int not null check (probability between 1 and 5),
  impact int not null check (impact between 1 and 5),
  risk_score int generated always as (probability * impact) stored,
  category text not null,
  status text not null default 'open' check (status in ('open', 'mitigated', 'closed', 'accepted')),
  threat_type text not null default 'other' check (
    threat_type in (
      'phishing',
      'ransomware',
      'business_email_compromise',
      'malware',
      'vulnerability',
      'data_breach',
      'supply_chain',
      'insider',
      'other'
    )
  ),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists risks_workspace_id_idx on public.risks (workspace_id);
create index if not exists risks_workspace_id_status_idx on public.risks (workspace_id, status);
create index if not exists risks_workspace_id_category_idx on public.risks (workspace_id, category);
create index if not exists risks_workspace_id_threat_type_idx on public.risks (workspace_id, threat_type);
create index if not exists risks_workspace_id_score_idx on public.risks (workspace_id, risk_score desc);

create or replace function public.tg_set_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    if new.created_by is null and public.current_uid() is not null then
      new.created_by := public.current_uid();
    end if;
  end if;

  new.updated_at := now();
  if public.current_uid() is not null then
    new.updated_by := public.current_uid();
  end if;

  return new;
end $$;

drop trigger if exists categories_set_audit_fields on public.categories;
create trigger categories_set_audit_fields
  before insert or update on public.categories
  for each row execute function public.tg_set_audit_fields();

drop trigger if exists risks_set_audit_fields on public.risks;
create trigger risks_set_audit_fields
  before insert or update on public.risks
  for each row execute function public.tg_set_audit_fields();

alter table public.categories enable row level security;
alter table public.categories force row level security;

alter table public.risks enable row level security;
alter table public.risks force row level security;

drop policy if exists categories_select_member on public.categories;
create policy categories_select_member
  on public.categories
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists categories_insert_writer on public.categories;
create policy categories_insert_writer
  on public.categories
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists categories_update_writer on public.categories;
create policy categories_update_writer
  on public.categories
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists categories_delete_admin on public.categories;
create policy categories_delete_admin
  on public.categories
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

drop policy if exists risks_select_member on public.risks;
create policy risks_select_member
  on public.risks
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risks_insert_writer on public.risks;
create policy risks_insert_writer
  on public.risks
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risks_update_writer on public.risks;
create policy risks_update_writer
  on public.risks
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists risks_delete_admin on public.risks;
create policy risks_delete_admin
  on public.risks
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.categories to authenticated, service_role;
grant select, insert, update, delete on public.risks to authenticated, service_role;

-- Bootstrap helper: create a workspace and add the creator as owner.
create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_user_id uuid;
begin
  v_user_id := public.current_uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.workspaces (name, created_by)
  values (p_name, v_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, v_user_id, 'owner');

  return v_workspace_id;
end $$;

alter function public.create_workspace(text) owner to service_role;
grant execute on function public.create_workspace(text) to authenticated;
