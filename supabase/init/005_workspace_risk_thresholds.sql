-- Workspace-configurable risk scoring thresholds (for 5x5 risk matrix labels).
-- Defaults match the PRD: Low 1-8, Medium 9-15, High 16-25.

create table if not exists public.workspace_risk_thresholds (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  low_max int not null default 8 check (low_max between 1 and 23),
  medium_max int not null default 15 check (medium_max between 2 and 24 and medium_max > low_max),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists workspace_risk_thresholds_workspace_id_idx
  on public.workspace_risk_thresholds (workspace_id);

drop trigger if exists workspace_risk_thresholds_set_audit_fields on public.workspace_risk_thresholds;
create trigger workspace_risk_thresholds_set_audit_fields
  before insert or update on public.workspace_risk_thresholds
  for each row execute function public.tg_set_audit_fields();

alter table public.workspace_risk_thresholds enable row level security;
alter table public.workspace_risk_thresholds force row level security;

drop policy if exists workspace_risk_thresholds_select_member on public.workspace_risk_thresholds;
create policy workspace_risk_thresholds_select_member
  on public.workspace_risk_thresholds
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_risk_thresholds_insert_admin on public.workspace_risk_thresholds;
create policy workspace_risk_thresholds_insert_admin
  on public.workspace_risk_thresholds
  for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_risk_thresholds_update_admin on public.workspace_risk_thresholds;
create policy workspace_risk_thresholds_update_admin
  on public.workspace_risk_thresholds
  for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_risk_thresholds_delete_admin on public.workspace_risk_thresholds;
create policy workspace_risk_thresholds_delete_admin
  on public.workspace_risk_thresholds
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspace_risk_thresholds to authenticated, service_role;

-- Helper to compute severity labels using workspace thresholds.
create or replace function public.risk_severity(p_workspace_id uuid, p_score int)
returns text
language plpgsql
stable
as $$
declare
  v_low_max int;
  v_medium_max int;
begin
  if p_score is null then
    return null;
  end if;

  select w.low_max, w.medium_max
    into v_low_max, v_medium_max
  from public.workspace_risk_thresholds w
  where w.workspace_id = p_workspace_id;

  v_low_max := coalesce(v_low_max, 8);
  v_medium_max := coalesce(v_medium_max, 15);

  if p_score <= v_low_max then
    return 'low';
  elsif p_score <= v_medium_max then
    return 'medium';
  end if;

  return 'high';
end $$;

-- Seed defaults for existing workspaces (idempotent).
insert into public.workspace_risk_thresholds (workspace_id)
select w.id
from public.workspaces w
where not exists (
  select 1
  from public.workspace_risk_thresholds t
  where t.workspace_id = w.id
);

