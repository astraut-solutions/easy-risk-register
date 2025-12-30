-- Compliance maturity radar (framework self-assessment)
-- Adds:
--   - Framework presets + domains (global, read-only for authenticated users)
--   - Workspace-scoped assessments + per-domain scores (0-4) with timestamps
--   - RPC helpers to create/update an assessment atomically
--
-- Notes:
--   - This is a self-assessment feature (assistive, not a certification).
--   - Domain scores are intentionally simple (integer 0-4).
--
-- Rollback guidance is included at the end of the file (commented).

-- Global presets (safe to read in all workspaces; writes restricted to service_role/admin workflows).
create table if not exists public.maturity_frameworks (
  id text primary key,
  name text not null,
  description text not null default '',
  scale_min int not null default 0 check (scale_min >= 0),
  scale_max int not null default 4 check (scale_max >= scale_min),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maturity_framework_domains (
  id text primary key,
  framework_id text not null references public.maturity_frameworks (id) on delete cascade,
  key text not null,
  title text not null,
  description text not null default '',
  position int not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maturity_framework_domains_framework_key_unique unique (framework_id, key),
  constraint maturity_framework_domains_framework_position_unique unique (framework_id, position)
);

do $$
begin
  alter table public.maturity_framework_domains
    add constraint maturity_framework_domains_framework_id_id_unique unique (framework_id, id);
exception
  when duplicate_object then null;
end $$;

create index if not exists maturity_framework_domains_framework_id_idx
  on public.maturity_framework_domains (framework_id);

create index if not exists maturity_framework_domains_framework_id_position_idx
  on public.maturity_framework_domains (framework_id, position);

-- Workspace-scoped assessments.
create table if not exists public.maturity_assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  framework_id text not null references public.maturity_frameworks (id),
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

do $$
begin
  alter table public.maturity_assessments
    add constraint maturity_assessments_id_workspace_unique unique (id, workspace_id);
exception
  when duplicate_object then null;
end $$;

create index if not exists maturity_assessments_workspace_id_framework_id_assessed_at_idx
  on public.maturity_assessments (workspace_id, framework_id, assessed_at desc);

create index if not exists maturity_assessments_workspace_id_assessed_at_idx
  on public.maturity_assessments (workspace_id, assessed_at desc);

-- Per-domain scores for an assessment.
create table if not exists public.maturity_assessment_domain_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  assessment_id uuid not null,
  framework_id text not null references public.maturity_frameworks (id),
  domain_id text not null,
  score int not null check (score between 0 and 4),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint maturity_assessment_domain_scores_assessment_domain_unique unique (assessment_id, domain_id),
  constraint maturity_assessment_domain_scores_assessment_workspace_fk
    foreign key (assessment_id, workspace_id)
    references public.maturity_assessments (id, workspace_id)
    on delete cascade,
  constraint maturity_assessment_domain_scores_domain_fk
    foreign key (framework_id, domain_id)
    references public.maturity_framework_domains (framework_id, id)
);

create index if not exists maturity_assessment_domain_scores_workspace_id_assessment_id_idx
  on public.maturity_assessment_domain_scores (workspace_id, assessment_id);

create index if not exists maturity_assessment_domain_scores_workspace_id_framework_id_updated_at_idx
  on public.maturity_assessment_domain_scores (workspace_id, framework_id, updated_at desc);

-- Ensure `framework_id` on score rows always matches the parent assessment's framework.
create or replace function public.tg_set_maturity_assessment_domain_score_framework()
returns trigger
language plpgsql
as $$
declare
  v_framework_id text;
begin
  select a.framework_id
    into v_framework_id
  from public.maturity_assessments a
  where a.id = new.assessment_id
    and a.workspace_id = new.workspace_id;

  if v_framework_id is null then
    raise exception 'Invalid assessment_id/workspace_id';
  end if;

  new.framework_id := v_framework_id;
  return new;
end $$;

drop trigger if exists maturity_assessment_domain_scores_set_framework on public.maturity_assessment_domain_scores;
create trigger maturity_assessment_domain_scores_set_framework
  before insert or update on public.maturity_assessment_domain_scores
  for each row execute function public.tg_set_maturity_assessment_domain_score_framework();

-- Audit triggers (re-use existing audit helper from 002).
drop trigger if exists maturity_assessments_set_audit_fields on public.maturity_assessments;
create trigger maturity_assessments_set_audit_fields
  before insert or update on public.maturity_assessments
  for each row execute function public.tg_set_audit_fields();

drop trigger if exists maturity_assessment_domain_scores_set_audit_fields on public.maturity_assessment_domain_scores;
create trigger maturity_assessment_domain_scores_set_audit_fields
  before insert or update on public.maturity_assessment_domain_scores
  for each row execute function public.tg_set_audit_fields();

-- RPC: create assessment + domain scores atomically (bypasses the lack of multi-statement transactions in supabase-js).
create or replace function public.create_maturity_assessment(
  p_workspace_id uuid,
  p_framework_id text,
  p_assessed_at timestamptz default now(),
  p_scores jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = on
as $$
declare
  v_assessment_id uuid;
  v_domain_count int;
  v_score_count int;
  v_invalid_keys int;
  v_scale_min int;
  v_scale_max int;
begin
  if not public.is_workspace_writer(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  select scale_min, scale_max
    into v_scale_min, v_scale_max
  from public.maturity_frameworks
  where id = p_framework_id;

  if v_scale_min is null or v_scale_max is null then
    raise exception 'Unknown framework';
  end if;

  if p_scores is null or jsonb_typeof(p_scores) <> 'object' then
    raise exception 'Scores must be a JSON object';
  end if;

  select count(*)::int
    into v_domain_count
  from public.maturity_framework_domains
  where framework_id = p_framework_id;

  select count(*)::int
    into v_score_count
  from jsonb_object_keys(p_scores);

  if v_domain_count <= 0 then
    raise exception 'Framework has no domains';
  end if;

  if v_score_count <> v_domain_count then
    raise exception 'Expected % domain scores, got %', v_domain_count, v_score_count;
  end if;

  select count(*)::int
    into v_invalid_keys
  from jsonb_object_keys(p_scores) k
  where not exists (
    select 1
    from public.maturity_framework_domains d
    where d.framework_id = p_framework_id
      and d.key = k
  );

  if v_invalid_keys > 0 then
    raise exception 'Scores contain unknown domain keys';
  end if;

  insert into public.maturity_assessments (workspace_id, framework_id, assessed_at)
  values (p_workspace_id, p_framework_id, coalesce(p_assessed_at, now()))
  returning id into v_assessment_id;

  insert into public.maturity_assessment_domain_scores (workspace_id, assessment_id, domain_id, score)
  select
    p_workspace_id,
    v_assessment_id,
    d.id,
    ((p_scores ->> d.key)::int)
  from public.maturity_framework_domains d
  where d.framework_id = p_framework_id
    and ((p_scores ->> d.key)::int) between v_scale_min and v_scale_max;

  -- Ensure we inserted all domains (range failures would reduce inserted count).
  if (select count(*) from public.maturity_assessment_domain_scores s where s.assessment_id = v_assessment_id) <> v_domain_count then
    raise exception 'Invalid score values (expected integers between % and %)', v_scale_min, v_scale_max;
  end if;

  return v_assessment_id;
end $$;

alter function public.create_maturity_assessment(uuid, text, timestamptz, jsonb) owner to service_role;
grant execute on function public.create_maturity_assessment(uuid, text, timestamptz, jsonb) to authenticated, service_role;

create or replace function public.update_maturity_assessment(
  p_workspace_id uuid,
  p_assessment_id uuid,
  p_assessed_at timestamptz default null,
  p_scores jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = on
as $$
declare
  v_framework_id text;
  v_domain_count int;
  v_score_count int;
  v_invalid_keys int;
  v_scale_min int;
  v_scale_max int;
begin
  if not public.is_workspace_writer(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  select framework_id
    into v_framework_id
  from public.maturity_assessments
  where id = p_assessment_id
    and workspace_id = p_workspace_id;

  if v_framework_id is null then
    raise exception 'Assessment not found';
  end if;

  if p_assessed_at is not null then
    update public.maturity_assessments
    set assessed_at = p_assessed_at
    where id = p_assessment_id
      and workspace_id = p_workspace_id;
  end if;

  if p_scores is null then
    return;
  end if;

  select scale_min, scale_max
    into v_scale_min, v_scale_max
  from public.maturity_frameworks
  where id = v_framework_id;

  if v_scale_min is null or v_scale_max is null then
    raise exception 'Unknown framework';
  end if;

  if jsonb_typeof(p_scores) <> 'object' then
    raise exception 'Scores must be a JSON object';
  end if;

  select count(*)::int
    into v_domain_count
  from public.maturity_framework_domains
  where framework_id = v_framework_id;

  select count(*)::int
    into v_score_count
  from jsonb_object_keys(p_scores);

  if v_score_count <> v_domain_count then
    raise exception 'Expected % domain scores, got %', v_domain_count, v_score_count;
  end if;

  select count(*)::int
    into v_invalid_keys
  from jsonb_object_keys(p_scores) k
  where not exists (
    select 1
    from public.maturity_framework_domains d
    where d.framework_id = v_framework_id
      and d.key = k
  );

  if v_invalid_keys > 0 then
    raise exception 'Scores contain unknown domain keys';
  end if;

  insert into public.maturity_assessment_domain_scores (workspace_id, assessment_id, domain_id, score)
  select
    p_workspace_id,
    p_assessment_id,
    d.id,
    ((p_scores ->> d.key)::int)
  from public.maturity_framework_domains d
  where d.framework_id = v_framework_id
    and ((p_scores ->> d.key)::int) between v_scale_min and v_scale_max
  on conflict (assessment_id, domain_id) do update set
    score = excluded.score;

  if (select count(*) from public.maturity_assessment_domain_scores s where s.assessment_id = p_assessment_id) <> v_domain_count then
    raise exception 'Invalid score values (expected integers between % and %)', v_scale_min, v_scale_max;
  end if;
end $$;

alter function public.update_maturity_assessment(uuid, uuid, timestamptz, jsonb) owner to service_role;
grant execute on function public.update_maturity_assessment(uuid, uuid, timestamptz, jsonb) to authenticated, service_role;

-- RLS (workspace isolation).
alter table public.maturity_assessments enable row level security;
alter table public.maturity_assessments force row level security;

alter table public.maturity_assessment_domain_scores enable row level security;
alter table public.maturity_assessment_domain_scores force row level security;

drop policy if exists maturity_assessments_select_member on public.maturity_assessments;
create policy maturity_assessments_select_member
  on public.maturity_assessments
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists maturity_assessments_insert_writer on public.maturity_assessments;
create policy maturity_assessments_insert_writer
  on public.maturity_assessments
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists maturity_assessments_update_writer on public.maturity_assessments;
create policy maturity_assessments_update_writer
  on public.maturity_assessments
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists maturity_assessments_delete_writer on public.maturity_assessments;
create policy maturity_assessments_delete_writer
  on public.maturity_assessments
  for delete
  to authenticated
  using (public.is_workspace_writer(workspace_id));

drop policy if exists maturity_assessment_domain_scores_select_member on public.maturity_assessment_domain_scores;
create policy maturity_assessment_domain_scores_select_member
  on public.maturity_assessment_domain_scores
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists maturity_assessment_domain_scores_insert_writer on public.maturity_assessment_domain_scores;
create policy maturity_assessment_domain_scores_insert_writer
  on public.maturity_assessment_domain_scores
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists maturity_assessment_domain_scores_update_writer on public.maturity_assessment_domain_scores;
create policy maturity_assessment_domain_scores_update_writer
  on public.maturity_assessment_domain_scores
  for update
  to authenticated
  using (public.is_workspace_writer(workspace_id))
  with check (public.is_workspace_writer(workspace_id));

drop policy if exists maturity_assessment_domain_scores_delete_writer on public.maturity_assessment_domain_scores;
create policy maturity_assessment_domain_scores_delete_writer
  on public.maturity_assessment_domain_scores
  for delete
  to authenticated
  using (public.is_workspace_writer(workspace_id));

grant select on public.maturity_frameworks to authenticated, service_role;
grant select on public.maturity_framework_domains to authenticated, service_role;
grant select, insert, update, delete on public.maturity_assessments to authenticated, service_role;
grant select, insert, update, delete on public.maturity_assessment_domain_scores to authenticated, service_role;

-- Seed presets and domains (idempotent).
insert into public.maturity_frameworks (id, name, description, scale_min, scale_max)
values
  (
    'maturity_acsc_essential_eight_v1',
    'ACSC Essential Eight (inspired)',
    'A lightweight Essential Eight-inspired self-assessment (assistive, not a certification).',
    0,
    4
  ),
  (
    'maturity_nist_csf_v1',
    'NIST CSF (inspired)',
    'A lightweight NIST Cybersecurity Framework-inspired self-assessment (assistive, not a certification).',
    0,
    4
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  scale_min = excluded.scale_min,
  scale_max = excluded.scale_max,
  updated_at = now();

-- Upsert domains by (framework_id, key); IDs are stable per key/framework.
insert into public.maturity_framework_domains (id, framework_id, key, title, description, position)
values
  ('maturity_acsc_essential_eight_v1:application_control', 'maturity_acsc_essential_eight_v1', 'application_control', 'Application control', '', 1),
  ('maturity_acsc_essential_eight_v1:patch_applications', 'maturity_acsc_essential_eight_v1', 'patch_applications', 'Patch applications', '', 2),
  ('maturity_acsc_essential_eight_v1:macro_settings', 'maturity_acsc_essential_eight_v1', 'macro_settings', 'Configure Microsoft Office macros', '', 3),
  ('maturity_acsc_essential_eight_v1:user_application_hardening', 'maturity_acsc_essential_eight_v1', 'user_application_hardening', 'User application hardening', '', 4),
  ('maturity_acsc_essential_eight_v1:restrict_admin', 'maturity_acsc_essential_eight_v1', 'restrict_admin', 'Restrict administrative privileges', '', 5),
  ('maturity_acsc_essential_eight_v1:patch_operating_systems', 'maturity_acsc_essential_eight_v1', 'patch_operating_systems', 'Patch operating systems', '', 6),
  ('maturity_acsc_essential_eight_v1:mfa', 'maturity_acsc_essential_eight_v1', 'mfa', 'Multi-factor authentication (MFA)', '', 7),
  ('maturity_acsc_essential_eight_v1:backups', 'maturity_acsc_essential_eight_v1', 'backups', 'Regular backups', '', 8),

  ('maturity_nist_csf_v1:identify', 'maturity_nist_csf_v1', 'identify', 'Identify', '', 1),
  ('maturity_nist_csf_v1:protect', 'maturity_nist_csf_v1', 'protect', 'Protect', '', 2),
  ('maturity_nist_csf_v1:detect', 'maturity_nist_csf_v1', 'detect', 'Detect', '', 3),
  ('maturity_nist_csf_v1:respond', 'maturity_nist_csf_v1', 'respond', 'Respond', '', 4),
  ('maturity_nist_csf_v1:recover', 'maturity_nist_csf_v1', 'recover', 'Recover', '', 5)
on conflict (framework_id, key) do update set
  id = excluded.id,
  title = excluded.title,
  description = excluded.description,
  position = excluded.position,
  updated_at = now();

-- Rollback (manual):
--   drop policy if exists maturity_assessment_domain_scores_delete_writer on public.maturity_assessment_domain_scores;
--   drop policy if exists maturity_assessment_domain_scores_update_writer on public.maturity_assessment_domain_scores;
--   drop policy if exists maturity_assessment_domain_scores_insert_writer on public.maturity_assessment_domain_scores;
--   drop policy if exists maturity_assessment_domain_scores_select_member on public.maturity_assessment_domain_scores;
--   drop policy if exists maturity_assessments_delete_writer on public.maturity_assessments;
--   drop policy if exists maturity_assessments_update_writer on public.maturity_assessments;
--   drop policy if exists maturity_assessments_insert_writer on public.maturity_assessments;
--   drop policy if exists maturity_assessments_select_member on public.maturity_assessments;
--   drop function if exists public.update_maturity_assessment(uuid, uuid, timestamptz, jsonb);
--   drop function if exists public.create_maturity_assessment(uuid, text, timestamptz, jsonb);
--   drop trigger if exists maturity_assessment_domain_scores_set_audit_fields on public.maturity_assessment_domain_scores;
--   drop trigger if exists maturity_assessments_set_audit_fields on public.maturity_assessments;
--   drop trigger if exists maturity_assessment_domain_scores_set_framework on public.maturity_assessment_domain_scores;
--   drop function if exists public.tg_set_maturity_assessment_domain_score_framework();
--   drop table if exists public.maturity_assessment_domain_scores;
--   drop table if exists public.maturity_assessments;
--   drop table if exists public.maturity_framework_domains;
--   drop table if exists public.maturity_frameworks;
