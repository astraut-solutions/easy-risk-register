-- Auto-provision a "Personal" workspace for new users (full Supabase/GoTrue stack only).
--
-- Important: this repo also supports a minimal PostgREST-only local stack where `auth.users`
-- may not exist. In that case, the trigger is not created (safe/no-op).

-- Idempotent helper: creates a workspace + membership for a specific user if they don't already
-- belong to any workspace. Also seeds baseline categories for that workspace.
create or replace function public.ensure_personal_workspace_for_user(
  p_user_id uuid,
  p_workspace_name text default 'Personal'
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_existing_workspace_id uuid;
  v_workspace_id uuid;
begin
  if p_user_id is null then
    raise exception 'p_user_id cannot be null';
  end if;

  select wm.workspace_id
    into v_existing_workspace_id
  from public.workspace_members wm
  where wm.user_id = p_user_id
  order by wm.created_at asc
  limit 1;

  if v_existing_workspace_id is not null then
    return v_existing_workspace_id;
  end if;

  insert into public.workspaces (name, created_by)
  values (coalesce(nullif(p_workspace_name, ''), 'Personal'), p_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, p_user_id, 'owner');

  -- Seed baseline categories (AU SME-friendly defaults).
  insert into public.categories (workspace_id, name)
  select v_workspace_id, v.name
  from (
    values
      ('Operational'),
      ('Financial'),
      ('Compliance'),
      ('Security'),
      ('Privacy'),
      ('Third-party'),
      ('Strategic')
  ) as v(name)
  where not exists (
    select 1
    from public.categories c
    where c.workspace_id = v_workspace_id
      and lower(c.name) = lower(v.name)
  );

  return v_workspace_id;
end $$;

-- If GoTrue creates `auth.users` after the DB init scripts ran (normal local compose startup),
-- this event trigger attaches the provisioning trigger when the table is created.
create or replace function public.on_ddl_create_auth_users_attach_personal_workspace_trigger()
returns event_trigger
language plpgsql
as $$
begin
  -- Be maximally defensive: this event trigger fires after *any* CREATE TABLE in the DB
  -- (including GoTrue/Realtime/Storage migrations). We only act once `auth.users` exists.
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    begin
      execute 'drop trigger if exists auth_users_create_personal_workspace on auth.users';
      execute 'create trigger auth_users_create_personal_workspace
        after insert on auth.users
        for each row
        execute function public.tg_auth_users_create_personal_workspace()';
    exception
      when others then
        -- Do not block migrations if anything unexpected happens.
        null;
    end;
  end if;
end $$;

do $$
begin
  drop event trigger if exists evt_auth_users_attach_personal_workspace;
  create event trigger evt_auth_users_attach_personal_workspace
    on ddl_command_end
    when tag in ('CREATE TABLE')
    execute function public.on_ddl_create_auth_users_attach_personal_workspace_trigger();
end $$;

alter function public.ensure_personal_workspace_for_user(uuid, text) owner to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    grant execute on function public.ensure_personal_workspace_for_user(uuid, text) to supabase_admin;
  end if;
end $$;

-- Trigger to provision the personal workspace when a user is created in GoTrue.
create or replace function public.tg_auth_users_create_personal_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  perform public.ensure_personal_workspace_for_user(new.id, 'Personal');
  return new;
end $$;

alter function public.tg_auth_users_create_personal_workspace() owner to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    grant execute on function public.tg_auth_users_create_personal_workspace() to supabase_admin;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    -- `auth.users` exists (full GoTrue stack): attach trigger.
    execute 'drop trigger if exists auth_users_create_personal_workspace on auth.users';
    execute 'create trigger auth_users_create_personal_workspace
      after insert on auth.users
      for each row
      execute function public.tg_auth_users_create_personal_workspace()';
  end if;
end $$;
