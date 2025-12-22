# ISO 27001 mapping guidance (evidence preparation)

This document explains how Easy Risk Register records and exports can support **ISO 27001 audit evidence preparation**.

Important wording note:
- This app helps you **organize evidence** and demonstrate risk management practices.
- It does **not** certify ISO 27001 compliance and should not be described as “ISO 27001 compliant/certified”.

## What auditors typically look for (high level)

Auditors commonly ask for evidence that:
- Risks are identified and assessed consistently
- Ownership/accountability is assigned
- Risks are treated/accepted with rationale
- Reviews happen on a defined cadence
- Mitigation actions are tracked and completed
- Supporting evidence is retained and accessible

## How risk records map to common audit questions

See the risk field definitions in `docs/reference/risk-record-schema.md`.

### Risk identification and assessment

Useful fields:
- `title`, `description`, `category`
- `probability`, `impact`, `riskScore`

Evidence ideas:
- Assessment notes or ticket documenting discovery
- Architecture/design doc identifying threat/risk

### Ownership and accountability

Useful fields:
- `owner`, `ownerTeam`
- Response fields (owner/security/vendor commentary)

Evidence ideas:
- Ticket assignment, approval thread, decision log link

### Treatment decision (risk response)

Useful fields:
- `riskResponse` (treat/transfer/tolerate/terminate)
- `status` (including `accepted` where applicable)
- `ownerResponse`, `securityAdvisorComment`, `vendorResponse`

Evidence ideas:
- Risk acceptance approval artifact (meeting notes, change record, ticket)
- Vendor contract clause, insurance record, compensating control description

### Mitigation planning and execution

Useful fields:
- `mitigationPlan` (summary)
- `mitigationSteps` (structured tracking)
- `dueDate` (overall) and per-step due dates

Evidence ideas:
- Change tickets, PR links, control implementation records
- Test results, scans, training completions

### Review and ongoing governance

Useful fields:
- `reviewCadence`
- `reviewDate` (next review date)
- `lastModified`

Evidence ideas:
- Review meeting notes link, periodic review ticket, control owner attestations

## Exports for audit evidence

Easy Risk Register provides two CSV exports:
- **Standard CSV**: best for re-import/round-trip; includes JSON columns for evidence and mitigation steps
- **Audit pack CSV**: adds explicit evidence URL columns and review/acceptance metadata for spreadsheet review

Spec details: `docs/reference/risk-csv-spec.md`

## Suggested evidence bundle (example)

For a sample of “audit-ready” risks (per quarter), you can export an Audit pack and ensure each risk includes:
- Owner + team
- Review cadence + next review date
- Treatment decision + status
- At least one evidence link (ticket/doc/report)
- Mitigation steps with owners/due dates (or a clear acceptance rationale)

