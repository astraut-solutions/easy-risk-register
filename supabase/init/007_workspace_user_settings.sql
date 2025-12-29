-- Workspace-scoped per-user settings.
-- Adds:
--   - public.workspace_user_settings: per-user preferences within a workspace
--   - public.ensure_workspace_user_settings(workspace_id): idempotently creates defaults for the current user
--
-- Initial settings covered:
--   - tooltips_enabled: allow users to disable educational tooltips
--   - onboarding_dismissed: onboarding state (dismissed vs shown)
--
-- Rollback guidance is included at the end of the file (commented).

create table if not exists public.workspace_user_settings (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null,
  tooltips_enabled boolean not null default true,
  onboarding_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint workspace_user_settings_pkey primary key (workspace_id, user_id)
);

create index if not exists workspace_user_settings_workspace_id_idx
  on public.workspace_user_settings (workspace_id);

create index if not exists workspace_user_settings_user_id_idx
  on public.workspace_user_settings (user_id);

drop trigger if exists workspace_user_settings_set_audit_fields on public.workspace_user_settings;
create trigger workspace_user_settings_set_audit_fields
  before insert or update on public.workspace_user_settings
  for each row execute function public.tg_set_audit_fields();

alter table public.workspace_user_settings enable row level security;
alter table public.workspace_user_settings force row level security;

drop policy if exists workspace_user_settings_select_self on public.workspace_user_settings;
create policy workspace_user_settings_select_self
  on public.workspace_user_settings
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id) and user_id = public.current_uid());

drop policy if exists workspace_user_settings_insert_self on public.workspace_user_settings;
create policy workspace_user_settings_insert_self
  on public.workspace_user_settings
  for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and user_id = public.current_uid());

drop policy if exists workspace_user_settings_update_self on public.workspace_user_settings;
create policy workspace_user_settings_update_self
  on public.workspace_user_settings
  for update
  to authenticated
  using (public.is_workspace_member(workspace_id) and user_id = public.current_uid())
  with check (public.is_workspace_member(workspace_id) and user_id = public.current_uid());

drop policy if exists workspace_user_settings_delete_self on public.workspace_user_settings;
create policy workspace_user_settings_delete_self
  on public.workspace_user_settings
  for delete
  to authenticated
  using (public.is_workspace_member(workspace_id) and user_id = public.current_uid());

grant select, insert, update, delete on public.workspace_user_settings to authenticated, service_role;

-- Idempotently create a default settings row for the current user within a workspace.
create or replace function public.ensure_workspace_user_settings(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.current_uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_workspace_id is null then
    raise exception 'p_workspace_id cannot be null';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of workspace';
  end if;

  insert into public.workspace_user_settings (workspace_id, user_id)
  values (p_workspace_id, v_user_id)
  on conflict (workspace_id, user_id) do nothing;
end $$;

alter function public.ensure_workspace_user_settings(uuid) owner to service_role;
grant execute on function public.ensure_workspace_user_settings(uuid) to authenticated, service_role;

-- Seed defaults for existing workspace memberships (idempotent).
insert into public.workspace_user_settings (workspace_id, user_id)
select wm.workspace_id, wm.user_id
from public.workspace_members wm
where not exists (
  select 1
  from public.workspace_user_settings s
  where s.workspace_id = wm.workspace_id
    and s.user_id = wm.user_id
);

-- Rollback (manual):
--   drop function if exists public.ensure_workspace_user_settings(uuid);
--   drop table if exists public.workspace_user_settings;

