# Risk Record Schema (Implementation)

This document describes the **current risk schema** as implemented in Supabase and exposed via the serverless API.

## Where data lives

- **System of record**: Supabase Postgres (`public.risks`) with workspace scoping enforced by RLS.
- **Client storage**: non-authoritative UI state only (filters/settings). Core risks are fetched from `/api/risks`.

## Core tables

Defined in `supabase/init/002_workspaces_core_tables_rls.sql` and `supabase/init/006_compliance_checklists.sql`:

- `public.workspaces`
- `public.workspace_members`
- `public.categories`
- `public.risks`
- `public.checklist_templates`
- `public.checklist_template_items`
- `public.risk_checklists`
- `public.risk_checklist_items`

## `public.risks` columns

- `id` (uuid, PK)
- `workspace_id` (uuid, FK)
- `title` (text)
- `description` (text)
- `mitigation_plan` (text)
- `probability` (int, 1-5)
- `impact` (int, 1-5)
- `risk_score` (int, generated: `probability * impact`)
- `category` (text)
- `status` (text: `open` | `mitigated` | `closed` | `accepted`)
- `threat_type` (text: `phishing` | `ransomware` | `business_email_compromise` | `malware` | `vulnerability` | `data_breach` | `supply_chain` | `insider` | `other`)
- `checklist_status` (enum: `not_started` | `in_progress` | `done`) - rollup across attached checklists for server-side filtering
- `data` (jsonb, default `{}`) - extension payload used by the UI for optional/advanced fields
- `created_at`, `updated_at` (timestamptz)
- `created_by`, `updated_by` (uuid)

## API representation

`/api/risks` maps Supabase rows into a stable JSON shape used by the frontend:

- `id`
- `title`
- `description`
- `probability`
- `impact`
- `riskScore`
- `category`
- `status`
- `threatType`
- `mitigationPlan`
- `checklistStatus` (from `checklist_status`)
- `data` (object; passthrough from `public.risks.data`)
- `creationDate` (from `created_at`)
- `lastModified` (from `updated_at`)

See `api/risks/index.js` and `api/risks/[id].js`.

## Compliance checklists (normalized)

Per-risk checklists are stored in dedicated tables (not in `public.risks.data`):

- Templates (global): `public.checklist_templates` + `public.checklist_template_items`
- Per-risk instances: `public.risk_checklists` + `public.risk_checklist_items`

Template changes do **not** rewrite existing per-risk checklist items; instances copy template content at attach-time and retain completion timestamps.

## `data` extension payload (current usage)

The frontend currently stores several "Phase 2+" fields inside the `data` JSON (not normalized into separate tables yet). This allows incremental rollout while keeping the core schema stable.

Common keys include:

- `templateId` (string; identifies the bundled template used to create the risk, if any)
- `owner` (string), `ownerTeam` (string)
- `dueDate` (ISO string), `reviewDate` (ISO string), `reviewCadence` (enum string)
- `riskResponse` (enum string)
- `mitigationSteps` (array)
- `evidence` (array)
- `playbook` (object)

If you plan to query/filter these fields server-side, consider promoting them to first-class columns or tables (see `TASK_PLAN.md` Cycle 2+).
