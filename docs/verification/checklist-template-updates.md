# Checklist Template Update Verification (No Timestamp Overwrites)

Goal: verify that updating a checklist template (title/description/items) does **not** overwrite existing per-risk checklist item completion timestamps.

This is critical for auditability: once an item is marked complete, its `completed_at` should remain stable unless a user explicitly changes that item.

## Preconditions

- Supabase migrations applied through `supabase/init/006_compliance_checklists.sql`.
- You can sign in (Supabase configured) and have a writable workspace (Owner/Admin/Member).
- You have at least one risk you can edit.

## Verify: template updates do not change existing instances

1) In the app, open an existing risk and attach the privacy incident checklist template:
   - Template id: `checklist_privacy_incident_ndb_v1`
2) Mark 1-2 items as completed.
3) Record the completion timestamps:
   - UI: the checklist items show “Completed <date>”
   - Optional DB query (psql):
     - Find the checklist instance + items:
       - `select rc.id, rc.template_id from public.risk_checklists rc order by rc.attached_at desc limit 1;`
       - `select id, position, completed_at from public.risk_checklist_items where checklist_id = '<checklist_id>' order by position;`
4) Update the template (simulate a template change):
   - DB (psql): change an item description for position 1:
     - `update public.checklist_template_items set description = description || ' (updated)' where template_id = 'checklist_privacy_incident_ndb_v1' and position = 1;`
   - Or update `public.checklist_templates.title` / `description`.
5) Re-open the same risk and confirm:
   - The existing checklist instance still shows the same completed items.
   - The completed items keep their original `completed_at` timestamps.
   - The item descriptions inside the existing instance do **not** silently change (instances snapshot template text at attach-time).

## Verify: newly attached instances use the updated template

1) Create a new risk (or use a different existing risk).
2) Attach the same template again (`checklist_privacy_incident_ndb_v1`).
3) Confirm the new checklist instance reflects the updated template text.
4) Confirm the original risk’s checklist instance is unchanged.

## Expected outcome

- Existing per-risk checklist items retain completion timestamps and text even if the template is updated.
- Only newly attached checklists reflect the updated template content.

