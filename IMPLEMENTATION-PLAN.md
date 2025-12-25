# Implementation Plan: Visual Charts & Dashboards

## Phase 0 — Foundations
- [x] Choose chart library (`Chart.js` + `react-chartjs-2`) and add dependencies
- [x] Define shared filter contract (single source of truth across list/matrix/charts/exports)
- [x] Add local-storage schemas + migrations/versioning:
  - [x] `RiskScoreSnapshot[]` (bounded retention)
  - [x] `MaturityAssessment[]` (multiple assessments + timestamps)
  - [x] Settings: history retention, history enabled, default trend mode, maturity enablement, framework preset

## Phase 1 — Heat Map Enhancements (P0)
- [x] Update matrix UI so severity isn’t color-only (legend + text/border cues)
- [x] Show cell counts and hover/focus summaries (keyboard accessible)
- [x] Implement click/tap cell → drill-down to risk list/table
- [x] Add consistent “filters applied” indicator and reset/clear actions

## Phase 2 — Score History & Trend Data (P1)
- [x] Capture score snapshot on risk create/update (timestamp, probability, impact, score)
- [x] Implement bounded retention (days or per-risk count) + Settings UI
- [x] Add “disable history tracking” setting + explain impact (no trend charts)

## Phase 3 — Dashboard Charts (P1)
- [x] Add dashboard tab/view + empty states (“no risks”, “no data for filters”)
- [x] Implement distribution charts (severity + stacked by category)
- [x] Implement trend chart (line) using snapshots
- [x] Add drill-down interactions from chart segments to risk list filters
- [x] Add accessible equivalents (toggleable data tables / summaries)

## Phase 4 — Exports (PDF + PNG)
- [x] Add “Export chart as PNG” for each chart (download + filename conventions)
- [x] Include charts in PDF export pipeline (dashboard report + legend/filters)
- [x] Ensure exports respect filters and clearly show “filters applied”

## Phase 5 — Maturity Radar (P2, Optional)
- [x] Add settings toggle to enable/disable maturity feature (default off)
- [x] Implement framework presets (both user-selectable):
  - [x] ACSC Essential Eight-inspired domains
  - [x] NIST CSF-inspired domains
- [x] Implement scoring UI (0–4) + notes (optional) + timestamps
- [x] Render radar chart + include in PDF and allow PNG export
- [x] Add “self-assessment only” labeling in UI + exports

## Phase 6 — Quality Gates
- [ ] Performance check with ~1000 risks + bounded history (no UI jank)
- [ ] Accessibility pass (WCAG 2.1 AA): keyboard, contrast, non-color cues, SR summaries
- [ ] Add unit tests for snapshot retention + filtering consistency (where tests exist)
- [ ] Update docs/help pages for dashboard/maturity/export usage

