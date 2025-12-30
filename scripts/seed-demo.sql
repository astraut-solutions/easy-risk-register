\set ON_ERROR_STOP on

-- Required psql vars (passed via `psql -v key=value`):
--   owner_id, admin_id, member_id (UUID strings)
--   workspace_name (text)
--   owner_email, admin_email, member_email (text; optional)

-- This app auto-selects the *oldest* workspace created by the current user.
-- When users are created in GoTrue, a "Personal" workspace may be created automatically.
-- To ensure the frontend shows seeded data immediately after login, seed into each user's personal workspace.

-- =====================
-- Owner personal workspace
-- =====================
select set_config('request.jwt.claim.sub', :'owner_id', false);

select coalesce(
  (select w.id
   from public.workspaces w
   where w.created_by = :'owner_id'::uuid
   order by w.created_at asc
   limit 1),
  public.create_workspace(:'workspace_name')
) as owner_workspace_id;
\gset

-- Optionally also add other demo users into the owner's workspace (app currently doesn't expose a workspace switcher).
insert into public.workspace_members (workspace_id, user_id, role)
values
  (:'owner_workspace_id'::uuid, :'admin_id'::uuid, 'admin'),
  (:'owner_workspace_id'::uuid, :'member_id'::uuid, 'member')
on conflict do nothing;

-- Ensure per-workspace defaults exist for workspaces created after migrations ran.
insert into public.workspace_risk_thresholds (workspace_id)
values (:'owner_workspace_id'::uuid)
on conflict (workspace_id) do nothing;

insert into public.workspace_reminder_settings (
  workspace_id,
  reminders_enabled,
  review_interval_days,
  due_soon_days,
  max_due_items
)
values (:'owner_workspace_id'::uuid, true, 30, 7, 20)
on conflict (workspace_id) do update set
  reminders_enabled = excluded.reminders_enabled,
  review_interval_days = excluded.review_interval_days,
  due_soon_days = excluded.due_soon_days,
  max_due_items = excluded.max_due_items,
  updated_at = now();

insert into public.workspace_user_settings (
  workspace_id,
  user_id,
  tooltips_enabled,
  onboarding_dismissed,
  reminders_enabled
)
values
  (:'owner_workspace_id'::uuid, :'owner_id'::uuid, true, true, true)
on conflict (workspace_id, user_id) do update set
  tooltips_enabled = excluded.tooltips_enabled,
  onboarding_dismissed = excluded.onboarding_dismissed,
  reminders_enabled = excluded.reminders_enabled,
  updated_at = now();

-- Owner risks
insert into public.risks (
  workspace_id,
  title,
  description,
  mitigation_plan,
  probability,
  impact,
  category,
  status,
  threat_type,
  data
)
values (
  :'owner_workspace_id'::uuid,
  'Phishing leads to credential compromise',
  'Staff may fall for targeted phishing, leading to account takeover and data exposure.',
  'Enable MFA, run phishing simulations, and enforce password manager use.',
  4,
  4,
  'Security',
  'open',
  'phishing',
  jsonb_build_object('demo', true, 'owner_email', nullif(:'owner_email', ''))
)
returning id as risk_phish_id;
\gset

insert into public.risks (
  workspace_id, title, description, mitigation_plan, probability, impact, category, status, threat_type, data
)
values (
  :'owner_workspace_id'::uuid,
  'Third-party outage impacts operations',
  'A key SaaS provider outage could halt order processing and customer support.',
  'Create manual fallback process and establish SLA escalation paths.',
  3,
  3,
  'Third-party',
  'open',
  'other',
  jsonb_build_object('demo', true)
)
returning id as risk_outage_id;
\gset

insert into public.risks (
  workspace_id, title, description, mitigation_plan, probability, impact, category, status, threat_type, data
)
values (
  :'owner_workspace_id'::uuid,
  'Ransomware encrypts file shares',
  'Ransomware could encrypt shared drives and disrupt service delivery.',
  'Implement immutable backups, EDR, least privilege, and patch cadence.',
  2,
  5,
  'Security',
  'open',
  'ransomware',
  jsonb_build_object('demo', true)
)
returning id as risk_ransom_id;
\gset

-- Admin risks
select set_config('request.jwt.claim.sub', :'admin_id', false);

insert into public.risks (
  workspace_id,
  title,
  description,
  mitigation_plan,
  probability,
  impact,
  category,
  status,
  threat_type,
  data
)
values (
  :'owner_workspace_id'::uuid,
  'Privacy breach via misdirected email',
  'Sensitive client information may be sent to the wrong recipient.',
  'Add recipient warnings, DLP rules, and staff training.',
  3,
  4,
  'Privacy',
  'mitigated',
  'data_breach',
  jsonb_build_object('demo', true, 'admin_email', nullif(:'admin_email', ''))
)
returning id as risk_privacy_id;
\gset

insert into public.risks (
  workspace_id, title, description, mitigation_plan, probability, impact, category, status, threat_type, data
)
values (
  :'owner_workspace_id'::uuid,
  'Compliance obligations not tracked',
  'Regulatory requirements may be missed due to lack of ownership and reminders.',
  'Maintain a compliance calendar and monthly review cadence.',
  3,
  3,
  'Compliance',
  'open',
  'other',
  jsonb_build_object('demo', true)
)
returning id as risk_compliance_id;
\gset

-- Member risk
select set_config('request.jwt.claim.sub', :'member_id', false);

insert into public.risks (
  workspace_id,
  title,
  description,
  mitigation_plan,
  probability,
  impact,
  category,
  status,
  threat_type,
  data
)
values (
  :'owner_workspace_id'::uuid,
  'Single point of failure: key person dependency',
  'Operational continuity risk if a critical staff member is unavailable.',
  'Cross-train and document procedures; define backup owners.',
  4,
  3,
  'Operational',
  'open',
  'other',
  jsonb_build_object('demo', true, 'member_email', nullif(:'member_email', ''))
)
returning id as risk_keyperson_id;
\gset

-- Review metadata for reminders (a mix of overdue + due soon).
update public.risks
set last_reviewed_at = now() - interval '40 days',
    next_review_at = now() - interval '10 days',
    review_interval_days = 30
where id = :'risk_outage_id'::uuid;

update public.risks
set last_reviewed_at = now() - interval '25 days',
    next_review_at = now() + interval '5 days',
    review_interval_days = 30
where id = :'risk_phish_id'::uuid;

update public.risks
set last_reviewed_at = now() - interval '5 days',
    next_review_at = now() + interval '25 days',
    review_interval_days = 30
where id = :'risk_keyperson_id'::uuid;

-- Attach a checklist to the privacy incident risk and complete a couple of items.
select set_config('request.jwt.claim.sub', :'admin_id', false);

with template as (
  select title, description
  from public.checklist_templates
  where id = 'checklist_privacy_incident_ndb_v1'
),
upsert as (
  insert into public.risk_checklists (
    workspace_id,
    risk_id,
    template_id,
    template_title,
    template_description,
    attached_at
  )
  select
    :'owner_workspace_id'::uuid,
    :'risk_privacy_id'::uuid,
    'checklist_privacy_incident_ndb_v1',
    template.title,
    coalesce(template.description, ''),
    now()
  from template
  on conflict (workspace_id, risk_id, template_id) do update set
    template_title = excluded.template_title,
    template_description = excluded.template_description,
    updated_at = now()
  returning id
)
select
  coalesce(
    (select id from upsert),
    (select rc.id
     from public.risk_checklists rc
     where rc.workspace_id = :'owner_workspace_id'::uuid
       and rc.risk_id = :'risk_privacy_id'::uuid
       and rc.template_id = 'checklist_privacy_incident_ndb_v1')
  ) as checklist_id;
\gset

insert into public.risk_checklist_items (workspace_id, checklist_id, position, description, created_at)
select
  :'owner_workspace_id'::uuid,
  :'checklist_id'::uuid,
  i.position,
  i.description,
  now()
from public.checklist_template_items i
where i.template_id = 'checklist_privacy_incident_ndb_v1'
on conflict (checklist_id, position) do update set
  description = excluded.description;

select i.id as checklist_item_id
from public.risk_checklist_items i
where i.workspace_id = :'owner_workspace_id'::uuid
  and i.checklist_id = :'checklist_id'::uuid
  and i.position = 1;
\gset

update public.risk_checklist_items
set completed_at = now(),
    completed_by = :'admin_id'::uuid
where id = :'checklist_item_id'::uuid
  and workspace_id = :'owner_workspace_id'::uuid;

select i.id as checklist_item_id
from public.risk_checklist_items i
where i.workspace_id = :'owner_workspace_id'::uuid
  and i.checklist_id = :'checklist_id'::uuid
  and i.position = 2;
\gset

update public.risk_checklist_items
set completed_at = now(),
    completed_by = :'admin_id'::uuid
where id = :'checklist_item_id'::uuid
  and workspace_id = :'owner_workspace_id'::uuid;

select public.refresh_risk_checklist_status(:'owner_workspace_id'::uuid, :'checklist_id'::uuid);

-- Attach a playbook to the privacy incident risk and mark one step completed.
with template as (
  select title, description
  from public.playbook_templates
  where id = 'playbook_privacy_incident_ndb_v1'
),
upsert as (
  insert into public.risk_playbooks (
    workspace_id,
    risk_id,
    template_id,
    template_title,
    template_description,
    attached_at,
    title,
    description
  )
  select
    :'owner_workspace_id'::uuid,
    :'risk_privacy_id'::uuid,
    'playbook_privacy_incident_ndb_v1',
    template.title,
    coalesce(template.description, ''),
    now(),
    template.title,
    ''
  from template
  on conflict (workspace_id, risk_id, template_id) do update set
    template_title = excluded.template_title,
    template_description = excluded.template_description,
    title = excluded.title,
    updated_at = now()
  returning id
)
select
  coalesce(
    (select id from upsert),
    (select rp.id
     from public.risk_playbooks rp
     where rp.workspace_id = :'owner_workspace_id'::uuid
       and rp.risk_id = :'risk_privacy_id'::uuid
       and rp.template_id = 'playbook_privacy_incident_ndb_v1')
  ) as playbook_id;
\gset

insert into public.risk_playbook_steps (workspace_id, risk_id, playbook_id, position, section, description, created_at)
select
  :'owner_workspace_id'::uuid,
  :'risk_privacy_id'::uuid,
  :'playbook_id'::uuid,
  s.position,
  s.section,
  s.description,
  now()
from public.playbook_template_steps s
where s.template_id = 'playbook_privacy_incident_ndb_v1'
on conflict (playbook_id, position) do update set
  section = excluded.section,
  description = excluded.description;

update public.risk_playbook_steps
set completed_at = now(),
    completed_by = :'admin_id'::uuid
where workspace_id = :'owner_workspace_id'::uuid
  and playbook_id = :'playbook_id'::uuid
  and position = 4;

-- Create a maturity assessment snapshot (NIST CSF inspired).
select public.create_maturity_assessment(
  :'owner_workspace_id'::uuid,
  'maturity_nist_csf_v1',
  now() - interval '7 days',
  jsonb_build_object(
    'identify', 2,
    'protect', 2,
    'detect', 1,
    'respond', 1,
    'recover', 1
  )
) as assessment_id;
\gset

-- Seed a few audit events (append-only).
insert into public.audit_events (workspace_id, risk_id, event_type, payload)
values
  (:'owner_workspace_id'::uuid, :'risk_phish_id'::uuid, 'risk_created', jsonb_build_object('demo', true)),
  (:'owner_workspace_id'::uuid, :'risk_privacy_id'::uuid, 'checklist_attached', jsonb_build_object('demo', true, 'template_id', 'checklist_privacy_incident_ndb_v1')),
  (:'owner_workspace_id'::uuid, :'risk_privacy_id'::uuid, 'playbook_attached', jsonb_build_object('demo', true, 'template_id', 'playbook_privacy_incident_ndb_v1')),
  (:'owner_workspace_id'::uuid, null, 'maturity_assessed', jsonb_build_object('demo', true, 'assessment_id', :'assessment_id'::uuid));

-- Seed a few timeseries points (used by /api/timeseries/* in local dev).
insert into public.risk_trends (risk_id, probability, impact, risk_score, timestamp, category, status)
values
  (:'risk_phish_id'::text, 4, 4, 16, (extract(epoch from (now() - interval '3 days')) * 1000)::bigint, 'Security', 'open'),
  (:'risk_phish_id'::text, 4, 4, 16, (extract(epoch from (now() - interval '2 days')) * 1000)::bigint, 'Security', 'open'),
  (:'risk_phish_id'::text, 3, 4, 12, (extract(epoch from (now() - interval '1 days')) * 1000)::bigint, 'Security', 'open'),
  (:'risk_phish_id'::text, 3, 4, 12, (extract(epoch from now()) * 1000)::bigint, 'Security', 'open');

-- =====================
-- Admin personal workspace (minimal seed)
-- =====================
select set_config('request.jwt.claim.sub', :'admin_id', false);
select coalesce(
  (select w.id
   from public.workspaces w
   where w.created_by = :'admin_id'::uuid
   order by w.created_at asc
   limit 1),
  public.create_workspace('Personal')
) as admin_workspace_id;
\gset

insert into public.workspace_user_settings (workspace_id, user_id, tooltips_enabled, onboarding_dismissed, reminders_enabled)
values (:'admin_workspace_id'::uuid, :'admin_id'::uuid, true, true, true)
on conflict (workspace_id, user_id) do update set
  tooltips_enabled = excluded.tooltips_enabled,
  onboarding_dismissed = excluded.onboarding_dismissed,
  reminders_enabled = excluded.reminders_enabled,
  updated_at = now();

insert into public.risks (workspace_id, title, description, mitigation_plan, probability, impact, category, status, threat_type, data)
values (
  :'admin_workspace_id'::uuid,
  'Demo: admin workspace starter risk',
  'A starter risk seeded into the admin personal workspace so the UI is not empty.',
  'Review and edit this risk.',
  2,
  3,
  'Operational',
  'open',
  'other',
  jsonb_build_object('demo', true, 'seed', 'admin_personal')
);

-- =====================
-- Member personal workspace (minimal seed)
-- =====================
select set_config('request.jwt.claim.sub', :'member_id', false);
select coalesce(
  (select w.id
   from public.workspaces w
   where w.created_by = :'member_id'::uuid
   order by w.created_at asc
   limit 1),
  public.create_workspace('Personal')
) as member_workspace_id;
\gset

insert into public.workspace_user_settings (workspace_id, user_id, tooltips_enabled, onboarding_dismissed, reminders_enabled)
values (:'member_workspace_id'::uuid, :'member_id'::uuid, true, true, false)
on conflict (workspace_id, user_id) do update set
  tooltips_enabled = excluded.tooltips_enabled,
  onboarding_dismissed = excluded.onboarding_dismissed,
  reminders_enabled = excluded.reminders_enabled,
  updated_at = now();

insert into public.risks (workspace_id, title, description, mitigation_plan, probability, impact, category, status, threat_type, data)
values (
  :'member_workspace_id'::uuid,
  'Demo: member workspace starter risk',
  'A starter risk seeded into the member personal workspace so the UI is not empty.',
  'Review and edit this risk.',
  2,
  2,
  'Operational',
  'open',
  'other',
  jsonb_build_object('demo', true, 'seed', 'member_personal')
);
