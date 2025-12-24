# Evidence guidance

This guide helps you add evidence to risks in a way that is clear, durable, and useful for audits.

## What counts as evidence

Evidence is any artifact that supports one of these claims:
- The risk is real and understood (assessment)
- Ownership is assigned (accountability)
- Work is planned and tracked (mitigation)
- Reviews are performed (ongoing governance)
- Decisions are approved (acceptance/closure)

Common evidence examples:
- Ticket links (Jira/Linear/etc.) for mitigation work
- Design docs, architecture decisions, runbooks
- PR links, change requests, release notes
- Training completion reports, phishing simulation results
- Vendor attestations (SOC 2 reports, security questionnaires)
- Meeting notes or approvals (where your org allows linking)

## Good evidence entry hygiene

### Choose an evidence type

Use types to make exports easier to scan:
- `ticket`: work tracking or change management
- `doc`: policies, runbooks, design docs
- `link`: dashboards, reports, status pages, other URLs
- `other`: anything that doesn’t fit above

### Prefer durable links

Better:
- A stable ticket URL or doc permalink

Avoid (when possible):
- Ephemeral links (temporary shares, expiring URLs)
- Personal-drive links that will break on role changes

### Write a useful description

A good description answers:
- What does this evidence prove?
- What system/team does it relate to?
- What time period does it cover?

Examples:
- “Change ticket approving MFA enforcement for all admins (Q1 2025)”
- “Runbook: incident response procedure for phishing reports”
- “Vendor SOC 2 Type II report (coverage period 2024-01 to 2024-12)”

## Naming conventions (recommended)

If your evidence system supports titles or labels (tickets/docs), consider a consistent prefix:
- `RISK-[risk-id]` (if you export IDs) or
- `RISK: <risk title>` (if you reference the title)

For attachments or screenshots stored externally, use:
- `risk_<yyyy-mm-dd>_<short-topic>.<ext>`

## Retention and sensitivity reminders

Evidence often contains sensitive data:
- Treat evidence URLs and audit pack exports as sensitive
- Use access control and least privilege
- Avoid embedding secrets in evidence descriptions
- If an evidence system supports it, prefer redacted views for wider sharing

If your organization has a retention policy:
- Ensure evidence locations meet retention requirements
- Use descriptions to note retention constraints (for example “expires after 90 days”)

## Validation and safety in the app

Easy Risk Register:
- Restricts evidence URLs to `http`/`https`
- Sanitizes user text fields to reduce XSS risk
- Includes CSV injection protections on export

More detail: `docs/SECURITY.md` and `docs/security-implementation.md`

