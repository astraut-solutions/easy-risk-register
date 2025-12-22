# Risk Record Schema (Draft)

This document describes the **risk record fields** used by Easy Risk Register, including newer fields intended to support ownership/accountability and audit evidence.

## Risk object

**Core scoring**
- `probability` (number, 1–5)
- `impact` (number, 1–5)
- `riskScore` (number, computed as probability × impact)

**Classification**
- `category` (string)
- `status` (enum: `open` | `accepted` | `mitigated` | `closed`)

Categories support both predefined and user-defined values. Custom categories are persisted locally.

**Accountability & review**
- `owner` (string, required; can be empty)
- `ownerTeam` (string, optional)
- `dueDate` (ISO timestamp string, optional)
- `reviewDate` (ISO timestamp string, optional)
- `reviewCadence` (enum, optional: `weekly` | `monthly` | `quarterly` | `semiannual` | `annual` | `ad-hoc`)
- `riskResponse` (enum: `treat` | `transfer` | `tolerate` | `terminate`)

**Responses / commentary**
- `ownerResponse` (string)
- `securityAdvisorComment` (string)
- `vendorResponse` (string)

**Mitigation**
- `mitigationPlan` (string, legacy/summary field)
- `mitigationSteps` (array of structured steps)

`mitigationPlan` remains supported as a single free-text summary for backward compatibility and quick notes. `mitigationSteps` is the preferred structure for tracking actionable work over time.

**Evidence**
- `evidence` (array of evidence entries)

Each evidence entry:
- `type` (enum: `link` | `ticket` | `doc` | `other`)
- `url` (string; http/https)
- `description` (string, optional)
- `addedAt` (ISO timestamp string)

**Metadata**
- `creationDate` (ISO timestamp string)
- `lastModified` (ISO timestamp string)

## Migration / backwards compatibility

When the persisted LocalStorage schema version changes, existing stored risks are migrated by backfilling default values for new fields (for example: `riskResponse: "treat"`, `evidence: []`, `mitigationSteps: []`).
