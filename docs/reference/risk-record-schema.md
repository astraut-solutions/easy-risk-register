# Risk Record Schema (Draft)

This document describes the **risk record fields** used by Easy Risk Register, including newer fields intended to support ownership/accountability and audit evidence.

## Risk object

All fields are stored locally in browser storage (`REQ-014`) and sanitized before persistence.

**Core scoring**
- `probability` (number, 1-5)
- `impact` (number, 1-5)
- `riskScore` (number, computed as probability × impact)

**Classification**
- `category` (string)
- `status` (enum: `open` | `accepted` | `mitigated` | `closed`)
- `threatType` (enum: `phishing` | `ransomware` | `business_email_compromise` | `malware` | `vulnerability` | `data_breach` | `supply_chain` | `insider` | `other`)
- `templateId` (string, optional; set when created from a bundled template)

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

Each mitigation step:
- `id` (string)
- `description` (string)
- `owner` (string, optional)
- `dueDate` (ISO timestamp string, optional)
- `status` (enum: `open` | `done`)
- `createdAt` (ISO timestamp string)
- `completedAt` (ISO timestamp string, optional)

**Compliance checklists**
- `checklists` (array of attached checklist instances)
- `checklistStatus` (enum: `not_started` | `in_progress` | `done`)

Each checklist instance:
- `id` (string)
- `templateId` (string)
- `title` (string)
- `attachedAt` (ISO timestamp string)
- `items` (array of checklist items)

Each checklist item:
- `id` (string)
- `description` (string)
- `createdAt` (ISO timestamp string)
- `completedAt` (ISO timestamp string, optional)

**Evidence**
- `evidence` (array of evidence entries)

Each evidence entry:
- `type` (enum: `link` | `ticket` | `doc` | `other`)
- `url` (string; http/https)
- `description` (string, optional)
- `addedAt` (ISO timestamp string)

**Incident response playbook (optional)**
- `playbook` (object, optional)

Playbook object:
- `title` (string)
- `lastModified` (ISO timestamp string)
- `steps` (array of playbook steps)

Each playbook step:
- `id` (string)
- `description` (string)
- `createdAt` (ISO timestamp string)
- `completedAt` (ISO timestamp string, optional)

**Metadata**
- `creationDate` (ISO timestamp string)
- `lastModified` (ISO timestamp string)

## Migration / backwards compatibility

When the persisted LocalStorage schema version changes, existing stored risks are migrated by backfilling default values for new fields.

