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
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'risk_score_snapshots') then
    missing := array_append(missing, 'public.risk_score_snapshots');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workspace_user_settings') then
    missing := array_append(missing, 'public.workspace_user_settings');
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workspace_reminder_settings') then
    missing := array_append(missing, 'public.workspace_reminder_settings');
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

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname='ensure_personal_workspace_for_user') then
    raise exception 'Missing function: public.ensure_personal_workspace_for_user(uuid, text)';
  end if;
end $$;

do $$
begin
  -- GoTrue-only check: if `auth.users` exists, ensure the auto-provision trigger is present.
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    if not exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth'
        and c.relname = 'users'
        and t.tgname = 'auth_users_create_personal_workspace'
        and not t.tgisinternal
    ) then
      raise exception 'Missing trigger: auth.auth_users_create_personal_workspace on auth.users';
    end if;
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
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='last_reviewed_at') then
    col_missing := array_append(col_missing, 'risks.last_reviewed_at');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='next_review_at') then
    col_missing := array_append(col_missing, 'risks.next_review_at');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risks' and column_name='review_interval_days') then
    col_missing := array_append(col_missing, 'risks.review_interval_days');
  end if;

  -- workspace_user_settings columns (per-user reminder opt-in + snooze)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_user_settings' and column_name='reminders_enabled') then
    col_missing := array_append(col_missing, 'workspace_user_settings.reminders_enabled');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_user_settings' and column_name='reminders_snoozed_until') then
    col_missing := array_append(col_missing, 'workspace_user_settings.reminders_snoozed_until');
  end if;

  -- workspace_reminder_settings columns (workspace defaults/cadence)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_reminder_settings' and column_name='reminders_enabled') then
    col_missing := array_append(col_missing, 'workspace_reminder_settings.reminders_enabled');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_reminder_settings' and column_name='review_interval_days') then
    col_missing := array_append(col_missing, 'workspace_reminder_settings.review_interval_days');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_reminder_settings' and column_name='due_soon_days') then
    col_missing := array_append(col_missing, 'workspace_reminder_settings.due_soon_days');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workspace_reminder_settings' and column_name='max_due_items') then
    col_missing := array_append(col_missing, 'workspace_reminder_settings.max_due_items');
  end if;

  -- risk_trends columns (time-series)
  -- risk_score_snapshots columns (bounded trend history)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risk_score_snapshots' and column_name='workspace_id') then
    col_missing := array_append(col_missing, 'risk_score_snapshots.workspace_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risk_score_snapshots' and column_name='risk_id') then
    col_missing := array_append(col_missing, 'risk_score_snapshots.risk_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risk_score_snapshots' and column_name='risk_score') then
    col_missing := array_append(col_missing, 'risk_score_snapshots.risk_score');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='risk_score_snapshots' and column_name='created_at') then
    col_missing := array_append(col_missing, 'risk_score_snapshots.created_at');
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
    where n.nspname='public' and c.relname='risk_score_snapshots' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'risk_score_snapshots');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='workspace_user_settings' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'workspace_user_settings');
  end if;
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='workspace_reminder_settings' and c.relrowsecurity and c.relforcerowsecurity
  ) then
    rls_missing := array_append(rls_missing, 'workspace_reminder_settings');
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
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='risk_score_snapshots' and policyname='risk_score_snapshots_select_member') then
    policy_missing := array_append(policy_missing, 'risk_score_snapshots.risk_score_snapshots_select_member');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspace_user_settings' and policyname='workspace_user_settings_select_self') then
    policy_missing := array_append(policy_missing, 'workspace_user_settings.workspace_user_settings_select_self');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspace_reminder_settings' and policyname='workspace_reminder_settings_select_member') then
    policy_missing := array_append(policy_missing, 'workspace_reminder_settings.workspace_reminder_settings_select_member');
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

-- Snapshot should be captured on insert.
select (
  select count(*)
  from public.risk_score_snapshots
  where workspace_id = (:'test_workspace_id')::uuid
) >= 1 as snapshot_insert_ok
\gset
\if :snapshot_insert_ok
\else
\echo 'Snapshot capture failed: expected at least 1 snapshot row after risk insert'
\quit 1
\endif

-- Retention bound: repeatedly change probability; ensure we never exceed 20 snapshots.
do $$
declare
  v_risk_id uuid;
  v_count int;
begin
  select id into v_risk_id
  from public.risks
  where workspace_id = (:'test_workspace_id')::uuid
  limit 1;

  for i in 1..25 loop
    update public.risks
    set probability = ((i % 5) + 1)
    where id = v_risk_id
      and workspace_id = (:'test_workspace_id')::uuid;
  end loop;

  select count(*)::int into v_count
  from public.risk_score_snapshots
  where workspace_id = (:'test_workspace_id')::uuid
    and risk_id = v_risk_id;

  if v_count > 20 then
    raise exception 'Retention bound failed: expected <=20 snapshots per risk, got %', v_count;
  end if;
end $$;

-- Age bound (best-effort): inserting an old snapshot should be cleaned up by the retention trigger.
do $$
declare
  v_risk_id uuid;
begin
  select id into v_risk_id
  from public.risks
  where workspace_id = (:'test_workspace_id')::uuid
  limit 1;

  insert into public.risk_score_snapshots (
    workspace_id, risk_id, probability, impact, risk_score, category, status, created_at, created_by
  )
  values (
    (:'test_workspace_id')::uuid,
    v_risk_id,
    1,
    1,
    1,
    'Test Category',
    'open',
    now() - interval '120 days',
    null
  );

  if exists (
    select 1
    from public.risk_score_snapshots
    where workspace_id = (:'test_workspace_id')::uuid
      and risk_id = v_risk_id
      and created_at < now() - interval '90 days'
  ) then
    raise exception 'Retention age bound failed: found snapshots older than 90 days for risk %', v_risk_id;
  end if;
end $$;

reset role;
select 'behavioral_smoke_ok' as result;
rollback;
