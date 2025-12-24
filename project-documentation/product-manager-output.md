# Product Manager Output: Visual Charts & Dashboards

## Confirm Understanding (and Open Questions)

### Restatement
Add visual charts to Easy Risk Register to make cyber risk data more intuitive and actionable for Australian SMEs, starting with an enhanced risk heat map and expanding into a simple dashboard (distribution + trends) and an optional maturity radar for compliance reporting.

### Assumptions
- The app remains fully client-side (offline-first) and stores all data in local storage (with optional encryption).
- Charts are for decision support and reporting; they are not meant to be “advanced analytics” or a SOC dashboard.
- Users have basic tech skills and limited time; the UI must avoid clutter and use progressive disclosure.

### Clarifying Questions (non-blocking)
1. Which framework(s) should be first-class for maturity radar presets: `ACSC Essential Eight`, `NIST CSF`, or both? **Decision**: Both; user-selectable.
2. For trends, do you prefer “overall exposure” (sum/average across risks) as the default, or “risks changed recently”? **Decision**: User-selectable default in settings.
3. Should chart exports include a standalone image export (PNG) in addition to PDF inclusion? **Decision**: Both; support PNG export and PDF inclusion.

## Executive Summary
- **Elevator Pitch**: Turn your risk list into clear charts so you can see what matters and explain it quickly.
- **Problem Statement**: SMEs struggle to interpret risk registers and communicate priorities; spreadsheets and lists make it hard to see hotspots, trends, and compliance gaps.
- **Target Audience**: Australian SME owners, operations/compliance leads, and IT generalists (5–200 employees), especially in regulated or data-heavy industries.
- **Unique Selling Proposition**: Privacy-first, offline dashboards tailored to cyber risk and Australia-focused reporting, without enterprise GRC complexity.
- **Success Metrics**:
  - Increased use of visualization views (heat map + dashboard) per active user
  - Reduced time-to-prioritize (time from opening app to identifying top risks)
  - Higher PDF export adoption (board/audit reporting)
  - Self-reported “confidence in prioritization” via in-app feedback prompt

## Feature Specifications

### Feature: Enhanced Risk Heat Map (Matrix)
- **User Story**: As an SME owner, I want a color-coded heat map so that I can spot the highest priority risks at a glance.
- **Acceptance Criteria**:
  - Given I have risks, when I open the matrix view, then I see a 5x5 grid with severity coloring and a legend
  - Given I select a cell, when it contains risks, then the risk list filters to show only those risks
  - Edge case: If color perception is limited, then severity is still understandable via labels/legend and non-color cues
- **Priority**: P0 (builds on existing matrix; immediate usability gain)
- **Dependencies**: Filtering consistency across views
- **Technical Constraints**: Offline-first; no external data calls
- **UX Considerations**: Plain-language axis labels; clear drill-down affordances; avoid dense clutter inside cells

### Feature: Dashboard Charts (Distribution + Trends)
- **User Story**: As a manager, I want a dashboard so that I can understand distribution and trends and present it to leadership.
- **Acceptance Criteria**:
  - Given I open the dashboard, when risks exist, then I see at least one distribution chart (bar/stacked bar) and one trend chart (line)
  - Given I apply filters, when viewing charts, then charts reflect filters and show “filters applied” state
  - Given I use exports, when I export charts, then I can export as PNG and include charts in PDF reports
  - Edge case: With 1000 risks and bounded history, charts still render responsively
- **Priority**: P1 (high perceived value; supports board reporting)
- **Dependencies**: Score history snapshots; PDF export
- **Technical Constraints**: Lightweight chart library (e.g., Chart.js); avoid heavy deps
- **UX Considerations**: Progressive disclosure; sensible defaults; drill-down interactions are consistent with matrix/list

### Feature: Compliance Maturity Radar (Optional)
- **User Story**: As a compliance lead, I want a maturity radar so that I can show gaps against a known framework without building my own spreadsheet.
- **Acceptance Criteria**:
  - Given I choose a framework preset, when I score domains, then a radar chart updates immediately
  - Given presets are available, when I start a maturity assessment, then I can choose ACSC Essential Eight-inspired or NIST CSF-inspired presets
  - Given I export a PDF, when maturity is enabled, then the radar is included with a clear “self-assessment” label
  - Edge case: If a user does not need maturity tracking, then the feature remains optional/hidden by default
- **Priority**: P2 (useful for some; avoid overwhelming the core audience)
- **Dependencies**: Charting infrastructure; export pipeline
- **Technical Constraints**: Keep domain list small; editable; no compliance guarantees implied
- **UX Considerations**: Plain-language domain descriptions; tooltips; timestamps to show improvement over time

## Requirements Documentation Structure

### Functional Requirements
- Chart views: heat map drill-down, dashboard distribution/trends, optional maturity scoring
- State management: filters are shared across list/matrix/charts; user settings control history retention and maturity enablement
- Data validation: maturity scores constrained to a small range; history snapshots bounded
- Integration points: chart library for standard charts; existing matrix remains custom UI

### Non-Functional Requirements
- Performance: responsive rendering up to 1000 risks with bounded history enabled
- Security: no network calls for core functionality; sanitize inputs; use browser crypto if encryption enabled
- Accessibility: WCAG 2.1 AA; charts have text alternatives and do not rely on color alone

### User Experience Requirements
- Information architecture: dashboard tab with limited default chart set; deeper views behind progressive disclosure
- Error prevention: clear empty states and “no data for current filters” messaging
- Feedback patterns: drill-down and filter chips; clear “filters applied” indicator across views

## Critical Questions Checklist
- [x] Are there existing solutions we're improving upon? (Spreadsheets, static matrices)
- [x] What's the minimum viable version? (Enhanced heat map + 2-chart dashboard)
- [x] Potential risks? (Overwhelming users; misleading visuals; accessibility gaps)
- [x] Platform-specific requirements? (Offline-first; browser storage constraints)
- [ ] What gaps need clarity? (Framework preset choice; default trend definition; export format expectations)
