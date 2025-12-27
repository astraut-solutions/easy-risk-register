-- Scope risk_trends time-series rows to workspaces and allow authenticated access via RLS.

alter table public.risk_trends
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

create index if not exists risk_trends_workspace_id_timestamp_idx
  on public.risk_trends (workspace_id, timestamp);

create index if not exists risk_trends_workspace_id_risk_id_timestamp_idx
  on public.risk_trends (workspace_id, risk_id, timestamp);

-- RLS policies
drop policy if exists risk_trends_select_member on public.risk_trends;
create policy risk_trends_select_member
  on public.risk_trends
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists risk_trends_insert_writer on public.risk_trends;
create policy risk_trends_insert_writer
  on public.risk_trends
  for insert
  to authenticated
  with check (public.is_workspace_writer(workspace_id));

grant select, insert on public.risk_trends to authenticated, service_role;

