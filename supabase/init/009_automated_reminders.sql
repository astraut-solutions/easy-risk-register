-- Automated reminders (notifications + in-app fallback).
--
-- Adds:
--   - public.workspace_reminder_settings: workspace-level defaults/cadence for reminders
--   - public.workspace_user_settings: per-user opt-in + snooze controls (new columns)
--   - public.risks: review metadata to drive "due" computation (new columns)
--
-- Rollback guidance is included at the end of the file (commented).

create table if not exists public.workspace_reminder_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  reminders_enabled boolean not null default false,
  review_interval_days int not null default 30 check (review_interval_days between 1 and 365),
  due_soon_days int not null default 7 check (due_soon_days between 0 and 30),
  max_due_items int not null default 20 check (max_due_items between 1 and 200),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists workspace_reminder_settings_workspace_id_idx
  on public.workspace_reminder_settings (workspace_id);

drop trigger if exists workspace_reminder_settings_set_audit_fields on public.workspace_reminder_settings;
create trigger workspace_reminder_settings_set_audit_fields
  before insert or update on public.workspace_reminder_settings
  for each row execute function public.tg_set_audit_fields();

alter table public.workspace_reminder_settings enable row level security;
alter table public.workspace_reminder_settings force row level security;

drop policy if exists workspace_reminder_settings_select_member on public.workspace_reminder_settings;
create policy workspace_reminder_settings_select_member
  on public.workspace_reminder_settings
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_reminder_settings_insert_admin on public.workspace_reminder_settings;
create policy workspace_reminder_settings_insert_admin
  on public.workspace_reminder_settings
  for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_reminder_settings_update_admin on public.workspace_reminder_settings;
create policy workspace_reminder_settings_update_admin
  on public.workspace_reminder_settings
  for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_reminder_settings_delete_admin on public.workspace_reminder_settings;
create policy workspace_reminder_settings_delete_admin
  on public.workspace_reminder_settings
  for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspace_reminder_settings to authenticated, service_role;

-- Seed defaults for existing workspaces (idempotent).
insert into public.workspace_reminder_settings (workspace_id)
select w.id
from public.workspaces w
where not exists (
  select 1
  from public.workspace_reminder_settings s
  where s.workspace_id = w.id
);

-- Per-user reminder opt-in + snooze controls.
alter table public.workspace_user_settings
  add column if not exists reminders_enabled boolean not null default false;

alter table public.workspace_user_settings
  add column if not exists reminders_snoozed_until timestamptz;

create index if not exists workspace_user_settings_workspace_id_reminders_enabled_idx
  on public.workspace_user_settings (workspace_id, reminders_enabled);

create index if not exists workspace_user_settings_workspace_id_reminders_snoozed_until_idx
  on public.workspace_user_settings (workspace_id, reminders_snoozed_until);

-- Risk review metadata to drive due computations.
alter table public.risks
  add column if not exists last_reviewed_at timestamptz;

alter table public.risks
  add column if not exists next_review_at timestamptz;

alter table public.risks
  add column if not exists review_interval_days int;

do $$
begin
  alter table public.risks
    add constraint risks_review_interval_days_check check (review_interval_days between 1 and 365);
exception
  when duplicate_object then null;
end $$;

create index if not exists risks_workspace_id_next_review_at_idx
  on public.risks (workspace_id, next_review_at);

create index if not exists risks_workspace_id_last_reviewed_at_idx
  on public.risks (workspace_id, last_reviewed_at);

-- Rollback guidance (manual):
--   drop index if exists risks_workspace_id_last_reviewed_at_idx;
--   drop index if exists risks_workspace_id_next_review_at_idx;
--   alter table public.risks drop constraint if exists risks_review_interval_days_check;
--   alter table public.risks drop column if exists review_interval_days;
--   alter table public.risks drop column if exists next_review_at;
--   alter table public.risks drop column if exists last_reviewed_at;
--   drop index if exists workspace_user_settings_workspace_id_reminders_snoozed_until_idx;
--   drop index if exists workspace_user_settings_workspace_id_reminders_enabled_idx;
--   alter table public.workspace_user_settings drop column if exists reminders_snoozed_until;
--   alter table public.workspace_user_settings drop column if exists reminders_enabled;
--   drop table if exists public.workspace_reminder_settings;
