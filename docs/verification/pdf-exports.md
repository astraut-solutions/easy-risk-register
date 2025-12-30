# PDF export verification checklist

Goal: validate PDF exports for correctness, filters, chart inclusion, and ensure CSV export remains unaffected.

## Preconditions

- App deployed (or running locally) with Supabase configured.
- You can sign in and have a workspace with risks (ideally >10 risks across multiple categories/statuses).
- At least one risk has the privacy incident checklist attached (`checklist_privacy_incident_ndb_v1`) with 1-2 completed items.

## Verify: risk register PDF (server download)

1) In the app, set a distinct filter combination (example):
   - Category = `Compliance`
   - Status = `open`
   - Threat type = `phishing`
   - Checklist status = `in_progress`
2) Open `Export` -> `Export PDF report` -> `Risk register` -> scope `Current view`.
3) Click `Download register PDF`.
4) Confirm the PDF header shows:
   - Generated timestamp
   - “Applied filters” includes the selected filters
5) Spot check that exported rows match the visible list ordering (updated desc) and do not include out-of-filter risks.

## Verify: risk register PDF scope ("All risks")

1) Open `Export` -> `Export PDF report` -> set scope `All risks`.
2) Click `Download register PDF`.
3) Confirm “Applied filters” shows `None (all risks)` and that the export includes risks outside the previous filter.

## Verify: matrix + severity mapping

1) Apply a matrix selection (Likelihood X Impact) and set severity filter (Low/Medium/High).
2) Export `Current view` and confirm:
   - Matrix selection reduces exported risks to that cell (probability/impact equality).
   - Severity filter changes exported rows using score thresholds:
     - Low: `maxScore=8`
     - Medium: `minScore=9 & maxScore=15`
     - High: `minScore=16`

## Verify: privacy incident / checklist PDF (server download)

1) Open `Export` -> `Export PDF report` -> `Privacy incident / checklist` and select the risk with the privacy incident checklist attached.
2) Click `Download checklist PDF`.
3) Confirm:
   - Risk title/status appear
   - Checklist completion shows the correct completed count
   - Completed items show completion timestamps
   - If the risk has a playbook in the UI, the playbook section is included.

## Verify: dashboard charts PDF (charts included)

1) Go to `Dashboard charts`.
2) Apply a filter set (and optionally a matrix selection).
3) Click `Export dashboard PDF` (either from the Dashboard page or from the global `Export` menu).
4) In the report view, Print / Save as PDF and confirm the PDF includes:
   - Chart images (severity + category + trend)
   - A data table fallback section when enabled

## Verify: maturity self-assessment PDF (chart + table included)

1) Go to `Maturity radar`.
2) Create an assessment (or select an existing one) and set a few domain scores.
3) Click `Export PDF` (either from the Maturity page or from the global `Export` menu via `Export maturity PDF`).
4) In the report view, Print / Save as PDF and confirm the PDF includes:
   - The disclaimer (self-assessment only; not certification/compliance/legal advice)
   - Preset label + generated timestamp
   - Embedded radar chart image (not blank)
   - A domain scores table matching the selected assessment

## Verify: CSV export regression

1) Export CSV via the app’s `Export` modal (standard + audit pack).
2) Confirm:
   - File downloads successfully
   - Columns match `docs/reference/risk-csv-spec.md`
3) If you use server-side CSV export (`GET /api/exports/risks.csv`), confirm:
   - Filtering by `threatType` and `checklistStatus` still works
   - Large exports return 413 rather than timing out
