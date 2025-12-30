# Playbook Template Update Verification (No Instance Overwrites)

Goal: verify that updating a playbook template (title/description/steps) does **not** overwrite existing per-risk playbook instances or their step completion timestamps.

This is critical for incident auditability: once a team has tailored a playbook for a specific risk and marked steps complete, later template changes must not silently rewrite history.

## Preconditions

- Supabase migrations applied through `supabase/init/011_incident_playbooks.sql`.
- You can sign in (Supabase configured) and have a writable workspace (Owner/Admin/Member).
- You have at least one risk you can edit.

## Verify: template updates do not change existing instances

1) In the app, open an existing risk and attach a playbook template (example):
   - Template id: `playbook_privacy_incident_ndb_v1`
2) Edit the attached playbook:
   - Change the playbook title/description.
   - Mark 1-2 steps as completed.
3) Record what you changed:
   - UI: title/description and step completion timestamps.
   - Optional DB queries (psql):
     - Find the latest playbook instance for the risk:
       - `select rp.id, rp.template_id, rp.title, rp.attached_at from public.risk_playbooks rp where rp.risk_id = '<risk_id>' order by rp.attached_at desc limit 1;`
     - List the step timestamps:
       - `select position, description, completed_at from public.risk_playbook_steps where playbook_id = '<playbook_id>' order by position;`
4) Update the template (simulate a template change):
   - DB (psql): change a template step description:
     - `update public.playbook_template_steps set description = description || ' (updated)' where template_id = 'playbook_privacy_incident_ndb_v1' and position = 1;`
   - Or update `public.playbook_templates.title` / `description`.
5) Re-open the same risk and confirm:
   - The existing playbook instance still shows your edited title/description.
   - The completed steps keep their original `completed_at` timestamps.
   - The existing instance step descriptions do **not** silently change (instances snapshot template steps at attach-time).

## Verify: newly attached instances use the updated template

1) Create a new risk (or use a different existing risk).
2) Attach the same template again (`playbook_privacy_incident_ndb_v1`).
3) Confirm the new playbook instance reflects the updated template text.
4) Confirm the original risk's playbook instance is unchanged.

## Expected outcome

- Existing per-risk playbooks remain editable and retain their content + completion timestamps after template updates.
- Only newly attached playbooks reflect updated template content.

