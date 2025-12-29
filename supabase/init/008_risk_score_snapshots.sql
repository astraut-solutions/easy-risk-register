-- Bounded risk score history for trends.
-- Retention strategy:
--   - Keep at most 20 snapshots per risk AND
--   - Keep at most 90 days of snapshots per risk.
--
-- Notes:
--   - Snapshots are captured server-side via a DB trigger on `public.risks` (insert + relevant updates).
--   - Retention is enforced on insert into `public.risk_score_snapshots` (best-effort, bounded work).
--   - Includes a one-time best-effort backfill from legacy `public.risk_trends` if present and snapshots are empty.
--
-- Rollback guidance is included at the end of the file (commented).

create table if not exists public.risk_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  risk_id uuid not null references public.risks (id) on delete cascade,
  probability int not null check (probability between 1 and 5),
  impact int not null check (impact between 1 and 5),
  risk_score int not null check (risk_score between 1 and 25),
  category text not null,
  status text not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists risk_score_snapshots_workspace_id_created_at_idx
  on public.risk_score_snapshots (workspace_id, created_at desc);

create index if not exists risk_score_snapshots_workspace_id_risk_id_created_at_idx
  on public.risk_score_snapshots (workspace_id, risk_id, created_at desc);

alter table public.risk_score_snapshots enable row level security;
alter table public.risk_score_snapshots force row level security;

drop policy if exists risk_score_snapshots_select_member on public.risk_score_snapshots;
create policy risk_score_snapshots_select_member
  on public.risk_score_snapshots
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_score_snapshots_insert_writer on public.risk_score_snapshots;
create policy risk_score_snapshots_insert_writer
  on public.risk_score_snapshots
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

grant select, insert on public.risk_score_snapshots to authenticated, service_role;

-- Retention enforcement (bypass RLS; runs server-side).
create or replace function public.enforce_risk_score_snapshot_retention(p_workspace_id uuid, p_risk_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  -- Age-based retention (90 days).
  delete from public.risk_score_snapshots s
  where s.workspace_id = p_workspace_id
    and s.risk_id = p_risk_id
    and s.created_at < now() - interval '90 days';

  -- Count-based retention (keep newest 20).
  with recent as (
    select id
    from public.risk_score_snapshots
    where workspace_id = p_workspace_id
      and risk_id = p_risk_id
    order by created_at desc
    limit 20
  )
  delete from public.risk_score_snapshots s
  where s.workspace_id = p_workspace_id
    and s.risk_id = p_risk_id
    and not exists (select 1 from recent r where r.id = s.id);
end $$;

alter function public.enforce_risk_score_snapshot_retention(uuid, uuid) owner to service_role;
grant execute on function public.enforce_risk_score_snapshot_retention(uuid, uuid) to anon, authenticated, service_role;

create or replace function public.tg_enforce_risk_score_snapshot_retention()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  perform public.enforce_risk_score_snapshot_retention(new.workspace_id, new.risk_id);
  return new;
end $$;

drop trigger if exists risk_score_snapshots_enforce_retention on public.risk_score_snapshots;
create trigger risk_score_snapshots_enforce_retention
  after insert on public.risk_score_snapshots
  for each row execute function public.tg_enforce_risk_score_snapshot_retention();

-- Snapshot capture from risk writes (bypass RLS; runs server-side).
create or replace function public.tg_capture_risk_score_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if tg_op = 'UPDATE' then
    if new.probability = old.probability
       and new.impact = old.impact
       and new.category = old.category
       and new.status = old.status then
      return new;
    end if;
  end if;

  insert into public.risk_score_snapshots (
    workspace_id,
    risk_id,
    probability,
    impact,
    risk_score,
    category,
    status,
    created_at,
    created_by
  )
  values (
    new.workspace_id,
    new.id,
    new.probability,
    new.impact,
    new.risk_score,
    new.category,
    new.status,
    now(),
    public.current_uid()
  );

  return new;
end $$;

drop trigger if exists risks_capture_score_snapshot on public.risks;
create trigger risks_capture_score_snapshot
  after insert or update on public.risks
  for each row execute function public.tg_capture_risk_score_snapshot();

-- One-time best-effort backfill from legacy `risk_trends` (if present).
do $$
begin
  if to_regclass('public.risk_trends') is null then
    return;
  end if;

  -- Avoid duplicating data if this file is re-applied.
  if exists (select 1 from public.risk_score_snapshots limit 1) then
    return;
  end if;

  insert into public.risk_score_snapshots (
    workspace_id,
    risk_id,
    probability,
    impact,
    risk_score,
    category,
    status,
    created_at,
    created_by
  )
  select
    rt.workspace_id,
    r.id,
    rt.probability,
    rt.impact,
    rt.risk_score,
    coalesce(rt.category, r.category),
    coalesce(rt.status, r.status),
    to_timestamp(rt.timestamp / 1000.0),
    null
  from (
    select
      t.*,
      row_number() over (partition by t.workspace_id, t.risk_id order by t.timestamp desc) as rn
    from public.risk_trends t
    where t.workspace_id is not null
      and t.timestamp >= (extract(epoch from (now() - interval '90 days')) * 1000)
  ) rt
  join public.risks r
    on r.workspace_id = rt.workspace_id
   and r.id::text = rt.risk_id
  where rt.rn <= 20
  order by rt.workspace_id, rt.risk_id, rt.timestamp asc;
exception
  when undefined_table then null;
end $$;

-- Rollback guidance:
--   drop trigger if exists risks_capture_score_snapshot on public.risks;
--   drop function if exists public.tg_capture_risk_score_snapshot();
--   drop trigger if exists risk_score_snapshots_enforce_retention on public.risk_score_snapshots;
--   drop function if exists public.tg_enforce_risk_score_snapshot_retention();
--   drop function if exists public.enforce_risk_score_snapshot_retention(uuid, uuid);
--   drop table if exists public.risk_score_snapshots;
