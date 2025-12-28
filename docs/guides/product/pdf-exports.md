# PDF exports (Print to PDF)

Easy Risk Register generates PDF exports by opening a **print-friendly report view** and relying on your browser's built-in **Print / Save as PDF** flow. The PDF rendering itself is client-side (no server-side PDF generation), but the report content is sourced from the current dataset (fetched via `/api/*`).

## Available PDF reports

- **Risk register report**: current view (filters + matrix selection) or all risks, includes generated time, applied filters, and a severity legend.
- **Privacy incident / checklist report**: per-risk checklist summary with completion timestamps (requires the privacy incident checklist to be attached to that risk).

## How to export

1. Click `Export PDF` in the header.
2. Choose a report type and click export.
3. A new `report.html` tab opens.
4. Click `Print / Save as PDF` and choose **Save as PDF** in the print dialog.

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

