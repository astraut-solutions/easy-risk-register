# Risk CSV Specification

This document defines the **stable, versioned** CSV formats used for import/export.

## Endpoints

When deployed on Vercel (recommended), serverless endpoints are available under `/api/*`:

- Export: `GET /api/exports/risks.csv` (downloads `text/csv`)
- Import: `POST /api/imports/risks.csv` (uploads `text/csv`)

Both endpoints require `Authorization: Bearer <supabase-jwt>` and are workspace-scoped (`x-workspace-id` header or personal-workspace fallback).

## Versioning

- `csvSpecVersion`: CSV spec version (current: `2`)
- `csvVariant`: `standard` | `audit_pack`

Import is **backward-compatible**: older exports without `csvSpecVersion` are accepted and missing fields are backfilled with defaults.

## Standard CSV (`csvSpecVersion = 2`, `csvVariant = standard`)

Columns (in order):

- `csvSpecVersion`
- `csvVariant`
- `id`
- `title`
- `description`
- `probability`
- `impact`
- `riskScore`
- `category`
- `threatType`
- `templateId`
- `status`
- `mitigationPlan`
- `owner`
- `ownerTeam`
- `dueDate`
- `reviewDate`
- `reviewCadence`
- `riskResponse`
- `ownerResponse`
- `securityAdvisorComment`
- `vendorResponse`
- `notes`
- `checklistStatus`
- `checklistsJson` (JSON array of attached checklists)
- `evidenceJson` (JSON array of evidence entries)
- `mitigationStepsJson` (JSON array of mitigation steps)
- `creationDate`
- `lastModified`

Notes:
- Playbooks are not currently exported to CSV. Use PDF exports for playbook inclusion.
- JSON columns are intended to support **round-trip import/export** without losing structure.

## Audit Pack CSV (`csvSpecVersion = 2`, `csvVariant = audit_pack`)

Includes all **Standard CSV** columns, plus:

- `evidenceCount`
- `evidenceUrls` (space-separated list)
- `evidenceTypes` (space-separated list)
- `evidenceAddedAt` (space-separated list)
- `mitigationStepsOpenCount`
- `mitigationStepsDoneCount`

## Import behavior

- Import creates **new** risk rows in the database; it does **not** update existing risks.
- Required fields for a valid import row: `title`, `category`, `probability` (1-5), `impact` (1-5).
- Fields not represented in the current DB schema are stored under the JSON column `risks.data` (for example owner/review fields, evidence JSON, mitigation steps JSON).

## Security notes (CSV injection)

- Exports are protected against spreadsheet formula injection by escaping fields that begin with `=`, `+`, `-`, or `@`.
- Imports reject unescaped formula-leading cells in key text fields. If you need to import a literal value that starts with `=`, `+`, `-`, or `@`, prefix it with `'` in the CSV.

## Limits

To keep serverless execution bounded, import/export endpoints enforce basic limits (payload size and max rows). If you hit a 413 error, split the CSV into smaller files.

