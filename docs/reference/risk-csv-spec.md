# Risk CSV Specification

This document defines the **stable, versioned** CSV formats used for import/export.

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

## Security notes (CSV injection)

Exports are protected against spreadsheet formula injection by escaping fields that begin with `=`, `+`, `-`, or `@`.

