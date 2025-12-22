# Audit-ready workflow (ISO 27001 / SOC 2 support)

This guide explains how to use Easy Risk Register to prepare **audit evidence** and demonstrate **ownership/accountability** practices.

Important wording note:
- Easy Risk Register can help you **prepare evidence** for ISO 27001 / SOC 2 audits.
- It does **not** make you “certified” or “compliant” by itself.

## What “audit-ready” means in this app

For each risk, you should be able to show:
- **Ownership** (who is accountable)
- **Review cadence and dates** (when it was last/next reviewed)
- **Decision history** (status, including acceptance where applicable)
- **Evidence links** (tickets, docs, runbooks, reports)
- **Mitigation tracking** (a plan and/or structured steps)

See also:
- `docs/reference/risk-record-schema.md`
- `docs/reference/risk-csv-spec.md`

## Recommended workflow

### 1) Capture accountability and review fields

When creating/editing a risk:
- Set **Owner** and (optionally) **Owner team**
- Set **Due date** for mitigation completion (if applicable)
- Set **Review cadence** and **Next review date** (recommended for ongoing risks)
- Set **Risk response** (treat/transfer/tolerate/terminate)
- Use the response fields for short, decision-oriented notes:
  - Owner response
  - Security advisor comment
  - Vendor response

### 2) Add evidence early (and keep it current)

Add evidence entries for any artifact that supports the risk record, for example:
- Jira/Linear tickets for mitigation work
- Policies, runbooks, or design docs
- Vendor SOC 2 reports or attestations
- Screenshots or export reports (where appropriate)

Use the Evidence description to clarify:
- What the evidence shows
- Scope (system/team/asset)
- Date/time relevance (if not obvious from the URL)

More guidance: `docs/guides/evidence-guidance.md`

### 3) Track mitigation as steps (not just free text)

Use **mitigation steps** for audit-friendly tracking:
- Each step can have an owner and due date
- Mark steps “done” when completed

Keep **mitigation plan** as a short summary (legacy/overview) and use steps for execution detail.

### 4) Review regularly and record outcomes

On review:
- Update **review date** (next review)
- Confirm or update **risk response**
- Update **status** (open / accepted / mitigated / closed)
- Add new evidence links (for example, “completed training report”, “PR link”, “change ticket”)

Tip: If a risk is **accepted**, capture the rationale in Owner response and link to the approval artifact in Evidence.

### 5) Export for audits (“Audit pack”)

When you need to share or archive evidence:
- Use **Export CSV → Audit pack** for a spreadsheet-friendly variant that includes evidence URL columns and review/acceptance metadata.
- Use **Standard CSV** when you primarily need reliable **round-trip** re-import (it includes JSON columns for evidence and mitigation steps).

Security note: CSV exports include spreadsheet injection protection, but you should still treat exported files as sensitive.

### 6) Keep exports and evidence organized

Recommended practice for audit season:
- Export a dated audit pack (for example monthly or quarterly)
- Store it in an access-controlled location
- Prefer linking to durable evidence locations (ticket/doc systems) over local files

