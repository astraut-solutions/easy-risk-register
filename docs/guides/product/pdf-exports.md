# PDF exports

Easy Risk Register supports two PDF export paths:

1) **Server-side PDF endpoints** (`/api/exports/*.pdf`) for direct downloads.
2) **Print to PDF** via a print-friendly report view in the browser.

## Available PDF reports

- **Risk register report**: current view (filters + matrix selection) or all risks, includes generated time, applied filters, and a severity legend.
- **Privacy incident / checklist report**: per-risk checklist summary with completion timestamps (requires the privacy incident checklist to be attached to that risk).

## Server-side endpoints (direct download)

When deployed on Vercel, serverless endpoints are available under `/api/*` and return `application/pdf` downloads.

- Risk register (filtered): `GET /api/exports/risks.pdf`
  - Uses the same filters as `GET /api/risks` (for example `status`, `category`, `q`, `threatType`, `checklistStatus`, `probability`, `impact`, `minScore`, `maxScore`).
- Privacy incident / checklist report: `GET /api/exports/privacy-incident.pdf?riskId=<uuid>`
  - Optional: `checklistTemplateId` (defaults to `checklist_privacy_incident_ndb_v1`).

Both endpoints require `Authorization: Bearer <supabase-jwt>` and are workspace-scoped (`x-workspace-id` header or personal-workspace fallback).

## How to export

1. Click `Export PDF` in the header.
2. For **Risk register** and **Privacy incident / checklist**, choose:
   - `Download ... PDF` (server-generated, direct download), or
   - `Open print view` (opens a report tab you can Print / Save as PDF).
3. For **Dashboard charts**, choose `Export dashboard PDF` (opens a print-friendly report with embedded chart images).

## Limits (server-side PDFs)

To keep serverless execution bounded, server-side PDF exports enforce limits:

- `GET /api/exports/risks.pdf`: capped at **2000** rows (returns `413 PAYLOAD_TOO_LARGE` when exceeded).
- `GET /api/exports/privacy-incident.pdf`: bounded by the checklist/playbook size on that risk.

If you hit limits, narrow the export using filters (category/status/threat type/checklist status, matrix selection, or severity).

## Troubleshooting

- **Popup blocked**: allow popups for the site (the export opens a new tab).
- **"Report unavailable / payload not found"**:
  - Ensure the app and the report page are on the same origin (same `http(s)://host:port`).
  - Disable strict privacy settings/extensions that block `localStorage`, `BroadcastChannel`, or cross-tab messaging for the site.
  - Export again after a hard refresh.

## Security note (CSP)

The application enforces a strict Content Security Policy (`script-src 'self'` and `script-src-attr 'none'`). For this reason, reports avoid inline scripts and instead use:

- `public/report.html` as a viewer shell
- `public/report.js` as the script entry for printing

