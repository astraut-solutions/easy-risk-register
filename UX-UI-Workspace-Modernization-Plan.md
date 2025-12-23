---
title: UX/UI Modernization Plan (Easy Risk Register)
description: Implementation-ready UX/UI plan to modernize the Risk Workspace (dashboard + risk table) and the in-workspace Create/Update Risk experience (no separate modal) using progressive disclosure and a calm, modern visual system.
last-updated: 2025-12-23
status: draft
related-files:
  - UX-UI-Improvement-Plan.md
---

# UX/UI Modernization Plan (Easy Risk Register)

## Objectives
- Make “create/update risk” fast and low-friction (minimal scrolling, clear actions).
- Improve scanability of the Risk Workspace (dashboard KPIs + filters + table/cards).
- Increase clarity of severity scoring (what it means + what to do next).
- Ensure accessible, consistent component behavior and visual hierarchy.

## Current Issues (from the provided screens)
- Create/Update flow shows nested scrolling / long vertical flow; primary action can be far from key inputs.
- Two-column form creates dead space and forces zig-zag reading.
- Accordions (Responses/Evidence/Steps/Notes) surface too early vs essentials.
- Visual density is uneven: heavy containers + repeated card chrome compete with content.
- Actions redundancy: separate "View" + "Edit" increases choice friction (now consolidated to "View/Edit").

## Target User Journey (preferred)
1. Land on **Risk workspace** (overview or table).
2. Search/filter quickly; open a risk via **View/Edit**.
3. Update essentials (Likelihood/Impact/Status) and immediately see score/severity.
4. Expand details only when needed; save or draft without losing context.

---

# Delivery Plan (checkbox tracker)

## Phase 1 — Navigation & Workspace polish
- [x] Make header actions consistent: primary **New risk**, secondary **Export CSV**, tertiary **Import CSV** (or unify under an “Export/Import” menu).
- [x] Align KPI cards to a consistent grid and height; reduce shadow intensity for a calmer feel.
- [x] Move “Updated …” timestamp to a subtle caption aligned with KPIs (right side) and ensure it doesn’t fight the cards.
- [x] Filters: convert to a compact “Filters bar” with chips showing active filters; keep “Reset” aligned to the right.
- [x] Table/Card actions: ensure only **View/Edit** + **Delete** are exposed (avoid redundant “View”).

description: Implementation-ready UX/UI plan to modernize the Risk Workspace (dashboard + risk table) and an in-workspace Create/Update Risk editor (panel or page) using progressive disclosure and a calm, modern visual system.
@@
## Phase 2 - Create/Update Risk in-workspace (core UX fix)
### Container & navigation (embedded editor)
- [ ] Decision: do not use a modal dialog for create/update; use a split-view panel on desktop and a dedicated route on small screens if needed.
- [ ] Use a unified surface for **New risk** and **View/Edit** (same component and layout).
- [ ] Prefer a **right-side details panel (split view)** or a **dedicated route** (e.g., `/risks/new`, `/risks/:id`) so the workspace context remains visible without an overlay dialog.
- [ ] Ensure back/close behavior is consistent:
  - [ ] Close returns to the workspace with prior filters/scroll preserved
  - [ ] Dirty-state confirmation when leaving with unsaved changes

### Layout & scrolling
- [ ] Single scroll container for the form (no nested `overflow` regions).
- [ ] Add **sticky header** (eyebrow, title, short description, close/back).
- [ ] Add **sticky footer** with actions:
  - [ ] Primary: **Add risk** / **Update risk**
  - [ ] Secondary: **Save draft** (if supported)
  - [ ] Tertiary: **Cancel**
- [ ] Ensure essentials fit in one viewport on common laptop heights (with minimal scrolling).

### Information architecture (progressive disclosure)
- [x] Essentials (always visible):
  - [x] Title (required)
  - [x] Category (required)
  - [x] Description (required by current data model)
  - [x] Status (default Open)
  - [x] Likelihood + Impact (1-5)
  - [x] Live score card (score + severity)
- [x] Details (collapsed by default):
  - [x] Mitigation plan
  - [x] Accountability (Owner, Team, Due date)
  - [x] Review cadence
  - [x] Supporting details: Responses / Evidence / Mitigation steps / Notes (consolidate into tabs or a single accordion with sub-sections)

### Scoring clarity (actionable, not decorative)
- [ ] Place Likelihood + Impact adjacent to the Live score card.
- [ ] Live score card includes:
  - [ ] Big score + severity label (Low/Medium/High/Critical)
  - [ ] Subtle semantic color (tint + border, not heavy fills)
  - [ ] One-line “what this means”
  - [ ] “Suggested next step” CTA text (non-blocking, e.g., “Add an owner”)

## Phase 3 - Visual system consistency (modern + calm)
- [ ] Reduce "card-in-card" nesting; use fewer containers and clearer headings.
- [ ] Standardize spacing scale (8 / 12 / 16 / 24 / 32) and apply consistently.
- [ ] Typography hierarchy:
  - [ ] Panel/page title 20-24px semibold
  - [ ] Section headers 14-16px semibold
  - [ ] Labels 13-14px medium
  - [ ] Helper text 12-13px regular with sufficient contrast
- [ ] Form controls:
  - [ ] Standardize input height, padding, and border radius across controls
  - [ ] Optional fields use a consistent “Optional” badge (no mixed patterns)
- [ ] Buttons:
  - [ ] Primary/secondary/ghost/destructive states consistent across table, cards, create/update surface
  - [ ] Use "View/Edit" label consistently where it opens details/edit flow

## Phase 4 - Accessibility, states, and quality
- [ ] Keyboard navigation: logical tab order; `Enter` submits when valid; close/back is reachable and predictable.
- [ ] Visible focus ring on every interactive element (buttons, sliders, chips, accordions).
- [ ] WCAG AA contrast audit (helper text, chips, slider track, disabled states).
- [ ] Inline validation with actionable messages (e.g., "Title is required").
- [ ] Dirty-state close confirmation (only when changes exist).
- [ ] Empty/loading states for expandable sections (Evidence/Notes/etc.) with helpful guidance.

## Phase 5 - QA & measurement
- [ ] Verify "View/Edit" opens the intended detail/edit experience in table and card views.
- [ ] Cross-browser check (Chrome/Edge/Firefox; Safari if targeted).
- [ ] Track basic events (optional): editor open, submit success, validation error, abandon.
- [ ] Compare before/after: time-to-create, scroll depth, completion rate.

---

# Implementation Notes (handoff-ready)
- The Create/Update container should own scrolling; avoid nested `overflow` regions where possible.
- Sticky header/footer should live inside the panel/page and remain visible during scroll.
- If "Details" contains heavy content, load it lazily when expanded to keep the editor responsive.
- Prefer clear, consistent microcopy: one helper sentence per field; avoid repeated explanatory paragraphs.
