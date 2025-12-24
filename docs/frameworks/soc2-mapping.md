# SOC 2 mapping guidance (evidence preparation)

This document explains how Easy Risk Register records and exports can support **SOC 2 audit evidence preparation**.

Important wording note:
- This app helps you **organize evidence** and demonstrate risk management practices.
- It does **not** make you SOC 2 compliant by itself. Avoid “SOC 2 compliant/certified” wording.

## SOC 2 context (practical)

SOC 2 audits focus on the Trust Services Criteria (TSC). Risk management evidence often supports multiple areas, especially:
- Security (common criteria)
- Availability
- Confidentiality (and sometimes Processing Integrity / Privacy, depending on scope)

This app is most useful for:
- Showing that risks are tracked, owned, reviewed, and addressed
- Providing links to evidence artifacts that live in your systems (tickets/docs/reports)

## How risk records support common SOC 2 evidence requests

See the risk field definitions in `docs/reference/risk-record-schema.md`.

### Governance: ownership and accountability

Useful fields:
- `owner`, `ownerTeam`
- `riskResponse`, `status`

Example evidence artifacts:
- Ticket assignments, approval records, decision logs

### Operational effectiveness: tracking work and outcomes

Useful fields:
- `mitigationSteps` (owners, due dates, done status)
- `mitigationPlan`
- `dueDate`, `lastModified`

Example evidence artifacts:
- Change tickets, PR links, scan reports, training attestations

### Periodic review and monitoring

Useful fields:
- `reviewCadence`, `reviewDate`
- `securityAdvisorComment` (review notes), `notes`

Example evidence artifacts:
- Quarterly review tickets, meeting notes, monitoring dashboards

### Third-party / vendor risk (when applicable)

Useful fields:
- `category` (vendor/third-party), `vendorResponse`, `evidence`

Example evidence artifacts:
- Vendor SOC reports, security questionnaires, DPA/MSA references

## Example: a SOC 2-friendly risk record

Recommended minimum:
- Owner + team
- Status + risk response
- Review cadence + next review date
- Mitigation steps with owners/due dates (or acceptance rationale)
- Evidence links to the systems-of-record (tickets/docs/reports)

## Exports for audit evidence

Use:
- **Audit pack CSV** for spreadsheet reviews and evidence URL visibility
- **Standard CSV** for backup and reliable re-import/round-trip

Spec details: `docs/reference/risk-csv-spec.md`

