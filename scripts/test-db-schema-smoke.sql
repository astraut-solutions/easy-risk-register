-- Workspace MVP schema smoke checks (Postgres).
-- Run inside the dev Supabase DB container:
--   psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f scripts/test-db-schema-smoke.sql

\set ON_ERROR_STOP on

do $$
declare
  missing text[];
begin
  -- Tables
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workspaces') then
    missing := array_append(missing, 'public.workspaces');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workspace_members') then
    missing := array_append(missing, 'public.workspace_members');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'categories') then
    missing := array_append(missing, 'public.categories');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'risks') then
    missing := array_append(missing, 'public.risks');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'risk_trends') then
    missing := array_append(missing, 'public.risk_trends');
  end if;

  if coalesce(array_length(missing, 1), 0) > 0 then
    raise exception 'Missing required table(s): %', array_to_string(missing, ', ');
  end if;
end $$;

do $$
begin
  -- Core functions/types
  if to_regtype('public.workspace_role') is null then
    raise exception 'Missing type: public.workspace_role';
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname='current_uid') then
    raise exception 'Missing function: public.current_uid()';
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname='create_workspace') then
    raise exception 'Missing function: public.create_workspace(text)';
  end if;
end $$;

do $$
declare
  col_missing text[];
  function_owner text;
  is_security_definer boolean;
begin
  -- workspaces columns
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspaces' and column_name='id') then
    col_missing := array_append(col_missing, 'workspaces.id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspaces' and column_name='name') then
    col_missing := array_append(col_missing, 'workspaces.name');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspaces' and column_name='created_at') then
    col_missing := array_append(col_missing, 'workspaces.created_at');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspaces' and column_name='created_by') then
    col_missing := array_append(col_missing, 'workspaces.created_by');
  end if;

  -- workspace_members columns
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_members' and column_name='workspace_id') then
    col_missing := array_append(col_missing, 'workspace_members.workspace_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_members' and column_name='user_id') then
    col_missing := array_append(col_missing, 'workspace_members.user_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_members' and column_name='role') then
    col_missing := array_append(col_missing, 'workspace_members.role');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_members' and column_name='created_at') then
    col_missing := array_append(col_missing, 'workspace_members.created_at');
  end if;

  -- categories columns
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='workspace_id') then
    col_missing := array_append(col_missing, 'categories.workspace_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='created_by') then
    col_missing := array_append(col_missing, 'categories.created_by');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='updated_by') then
    col_missing := array_append(col_missing, 'categories.updated_by');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='created_at') then
    col_missing := array_append(col_missing, 'categories.created_at');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='updated_at') then
    col_missing := array_append(col_missing, 'categories.updated_at');
  end if;

  -- risks columns
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='workspace_id') then
    col_missing := array_append(col_missing, 'risks.workspace_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='created_by') then
    col_missing := array_append(col_missing, 'risks.created_by');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='updated_by') then
    col_missing := array_append(col_missing, 'risks.updated_by');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='created_at') then
    col_missing := array_append(col_missing, 'risks.created_at');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='updated_at') then
    col_missing := array_append(col_missing, 'risks.updated_at');
  end if;

  -- risk_trends columns (time-series)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risk_trends' and column_name='workspace_id') then
    col_missing := array_append(col_missing, 'risk_trends.workspace_id');
  end if;

  if coalesce(array_length(col_missing, 1), 0) > 0 then
    raise exception 'Missing required column(s): %', array_to_string(col_missing, ', ');
  end if;

  select pg_get_userbyid(p.proowner), p.prosecdef
    into function_owner, is_security_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'create_workspace'
    and oidvectortypes(p.proargtypes) = 'text';

  if function_owner is distinct from 'service_role' then
    raise exception 'public.create_workspace(text) owner expected service_role, got %', function_owner;
  end if;
  if not is_security_definer then
    raise exception 'public.create_workspace(text) must be SECURITY DEFINER';
  end if;

  if not has_function_privilege('authenticated', 'public.create_workspace(text)', 'execute') then
    raise exception 'authenticated must have EXECUTE on public.create_workspace(text)';
  end if;
end $$;

do $$
declare
  rls_missing text[];
begin
  -- RLS enabled + forced
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='workspaces' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'workspaces');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='workspace_members' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'workspace_members');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='categories' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'categories');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='risks' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'risks');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='risk_trends' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'risk_trends');
  end if;

  if coalesce(array_length(rls_missing, 1), 0) > 0 then
    raise exception 'RLS must be enabled+forced for: %', array_to_string(rls_missing, ', ');
  end if;
end $$;

do $$
declare
  policy_missing text[];
begin
  -- Workspace isolation policies (names from init SQL)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspaces' and policyname='workspaces_select_member') then
    policy_missing := array_append(policy_missing, 'workspaces.workspaces_select_member');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspace_members' and policyname='workspace_members_select_member') then
    policy_missing := array_append(policy_missing, 'workspace_members.workspace_members_select_member');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='categories_select_member') then
    policy_missing := array_append(policy_missing, 'categories.categories_select_member');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='risks' and policyname='risks_select_member') then
    policy_missing := array_append(policy_missing, 'risks.risks_select_member');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='risk_trends' and policyname='risk_trends_select_member') then
    policy_missing := array_append(policy_missing, 'risk_trends.risk_trends_select_member');
  end if;

  if coalesce(array_length(policy_missing, 1), 0) > 0 then
    raise exception 'Missing required policy(s): %', array_to_string(policy_missing, ', ');
  end if;
end $$;

select 'schema_smoke_ok' as result;

-- Behavioral checks (exercise RLS + bootstrap).
-- These intentionally run as the `authenticated` role using simulated JWT claim settings.
\echo 'Running behavioral workspace/RLS checks...'
\set ON_ERROR_STOP on

begin;
select gen_random_uuid() as test_user_id \gset
select set_config('request.jwt.claim.sub', :'test_user_id', true);
select set_config('request.jwt.claims', json_build_object('sub', :'test_user_id', 'role', 'authenticated')::text, true);

select public.create_workspace('Personal') as test_workspace_id \gset

set role authenticated;

-- Workspace should be visible to its member.
select (
  select count(*)
  from public.workspaces
  where id = (:'test_workspace_id')::uuid
) = 1 as workspace_visible_ok
\gset
\if :workspace_visible_ok
\else
\echo 'RLS select failed: workspaces not visible to member'
\quit 1
\endif

-- Membership should be visible to the member (this catches RLS recursion bugs).
select (
  select count(*)
  from public.workspace_members
  where workspace_id = (:'test_workspace_id')::uuid
    and user_id = (:'test_user_id')::uuid
) = 1 as membership_visible_ok
\gset
\if :membership_visible_ok
\else
\echo 'RLS select failed: workspace_members not visible to member'
\quit 1
\endif

-- Writer can insert categories/risks in their workspace.
insert into public.categories (workspace_id, name)
values ((:'test_workspace_id')::uuid, 'Test Category');

insert into public.risks (workspace_id, title, description, probability, impact, category, status, threat_type, data)
values (
  (:'test_workspace_id')::uuid,
  'Test Risk',
  '',
  3,
  3,
  'Test Category',
  'open',
  'other',
  '{}'::jsonb
);

reset role;
select 'behavioral_smoke_ok' as result;
rollback;
