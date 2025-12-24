# Risk CSV Specification

This document defines the **stable, versioned** CSV formats used for import/export.

## Versioning

- `csvSpecVersion`: CSV spec version (current: `1`)
- `csvVariant`: `standard` | `audit_pack`

Import is **backward-compatible**: older exports without `csvSpecVersion` are accepted and missing fields are backfilled with defaults.

## Standard CSV (csvSpecVersion = 1, csvVariant = standard)

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
- `evidenceJson` (JSON array of evidence entries)
- `mitigationStepsJson` (JSON array of mitigation steps)
- `creationDate`
- `lastModified`

## Audit Pack CSV (csvSpecVersion = 1, csvVariant = audit_pack)

Includes all **Standard CSV** columns, plus:

- `evidenceCount`
- `evidenceUrls` (space-separated list)
- `evidenceTypes` (space-separated list)
- `evidenceAddedAt` (space-separated list)
- `mitigationStepsOpenCount`
- `mitigationStepsDoneCount`

## Security notes (CSV injection)

Exports are protected against spreadsheet formula injection by escaping fields that begin with `=`, `+`, `-`, or `@`.
