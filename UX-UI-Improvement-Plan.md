---
title: UX/UI Improvement Plan (Risk Workspace)
description: Trackable checklist for improving the Risk Workspace UI and the "Create new risk" modal.
last-updated: 2025-12-22
status: draft
---

# UX/UI Improvement Plan (Risk Workspace)

## 1) Audit (baseline)
- [x] Capture current screenshots (desktop + tablet + mobile)
- [x] List top 10 UX issues (scrolling, hierarchy, copy, actions, accessibility)
- [x] Identify required fields + validation rules
- [x] Confirm target breakpoints (e.g., 375 / 768 / 1024 / 1280)
- [x] Define success metrics (time-to-create, scroll count, abandonment)

### Baseline artifacts
- Screenshots (overview + create modal): `docs/ux-baseline/baseline-2025-12-22/`

### Top 10 UX issues (baseline)
1. Modal has nested scrolling (overlay + modal body), increasing “where am I scrolling?” confusion.
2. No sticky modal footer; primary action lives at the end of a long form, increasing scroll-to-submit.
3. Create flow lacks an explicit in-form Cancel/Close near the action area (only header Close), adding travel on long scroll.
4. Required fields are not visually marked; users discover requirements only after submit errors.
5. Submit button is not gated by validity; errors are surfaced only on submit (react-hook-form default `onSubmit`).
6. Modal does not handle `Esc` to close (design docs expect ESC close); close affordance is click-only.
7. Mobile modal is not a true full-screen sheet (large padding + rounded corners), reducing usable space.
8. “Live score” communicates label but lacks semantic color and “why” explanation, so severity isn’t actionable.
9. Information architecture mixes essentials and optional sections; advanced “Responses/Evidence/Steps/Notes” aren’t clearly summarized when collapsed.
10. Destructive actions (Delete) are always one click away in list/table; no confirm step increases accidental deletion risk.

### Required fields + validation rules (current)
- Required (create/edit): `title`, `category`, `description`, `status`, `probability` (1–5), `impact` (1–5)
- Evidence (only when added): `evidence[i].url` required + must be valid `http(s)` URL
- Mitigation steps (only when added): `mitigationSteps[i].description` required
- CSV import: row must include `title` + `description` (others default/sanitized)
- Sanitization/limits (store-level): text fields are trimmed/sanitized and truncated (e.g., title 200, description 5000, notes 10000); URLs must be `http(s)`; CSV blocks spreadsheet injection patterns.

### Target breakpoints (confirmed)
- Mobile: 375px baseline (design system supports 320–767)
- Tablet: 768px
- Desktop: 1024px
- Wide desktop: 1280px (plus 1440px+ as “wide” per design docs)

### Success metrics (baseline -> post-change)
- Time-to-create: click `New risk` -> successful `Add risk` submit (median + p95)
- Scroll-to-submit: number of scroll gestures / total scroll distance within modal before submit
- Completion rate: `open modal` -> `submit` (%)
- Abandonment: `open modal` -> `close without submit` (%), plus time-to-abandon
- Validation friction: count of validation errors per attempt; most common failing fields

## 2) Information architecture (progressive disclosure)
- [x] Define "Essentials" fields (always visible)
- [x] Define "Details" fields (collapsed by default)
- [x] Decide if "Responses / Evidence / Steps / Notes" become tabs vs accordions
- [x] Write concise, consistent labels + helper text (1 sentence max)

### IA decisions (implemented)
- Essentials (always visible): Title*, Category*, Description*, Status*, Likelihood*, Impact*, Live score
- Details (collapsed by default): Mitigation plan, Accountability, Review cadence, Responses, Evidence, Mitigation steps, Notes
- Pattern choice: accordions (native `<details>`), grouped under a single "Details (optional)" disclosure

## 3) Modal layout (remove friction)
- [ ] Eliminate double scroll (background locked; single modal scroll container)
- [ ] Add sticky modal header (title, short subtitle, close icon, `Esc` hint)
- [ ] Add sticky modal footer (Primary: Add risk; Secondary: Save draft; Tertiary: Cancel)
- [ ] Ensure “Essentials” fit within common laptop height with minimal scrolling
- [ ] Define close behavior (confirm only when dirty)

## 4) Scoring UX (make severity actionable)
- [ ] Place Likelihood + Impact adjacent to Live score
- [ ] Live score card includes score + severity label + semantic color treatment
- [ ] Add one-line “why this severity” explanation
- [ ] Add contextual next-step nudge (e.g., “Assign an owner” for High/Critical)

## 5) Visual system consistency (modern + calm)
- [ ] Reduce card nesting (avoid "card-in-card-in-card")
- [ ] Standardize spacing scale (8 / 12 / 16 / 24 / 32)
- [ ] Typography hierarchy (title, section headers, labels, helper text)
- [ ] Consistent "Optional" treatment (badge or suffix; pick one)
- [ ] Consistent component states (default/hover/focus/disabled/error)
- [ ] Unify row/card actions (single "View/Edit" action; remove redundant "View")

## 6) Accessibility & form quality (must-have)
- [ ] Keyboard navigation: logical tab order; `Esc` closes; `Enter` submits when valid
- [ ] Visible focus styles on all interactive elements
- [ ] WCAG AA contrast for text, chips, slider track, disabled states
- [ ] Inline validation messages with specific fixes
- [ ] Screen reader labels and ARIA for accordions/tabs and sliders

## 7) Responsive behavior
- [ ] ≥1024px: two-column only where helpful; keep essentials grouped
- [ ] 768–1024px: stacked layout; keep score near sliders
- [ ] Mobile: full-screen sheet modal with sticky action bar
- [ ] Verify no horizontal overflow at any breakpoint

## 8) QA checklist (before shipping)
- [ ] No nested scrolling; footer/header remain sticky in long forms
- [ ] Add risk disabled until required fields valid; clear reason shown
- [ ] Save draft works with partial data (if supported)
- [ ] Close confirmation triggers only when dirty
- [ ] Risk list/table actions: only "View/Edit" (no separate "View"); opens correct modal
- [ ] Cross-browser check (Chrome, Edge, Firefox, Safari if applicable)

## 9) Release & measurement
- [ ] Add lightweight analytics events (open modal, submit, validation errors, abandon)
- [ ] Compare baseline metrics vs new design
- [ ] Gather stakeholder feedback (exec scanability + risk owner usability)

## Notes / Decisions Log
- [ ] Essentials fields:
- [ ] Details fields:
- [ ] Tabs vs accordions decision:
- [x] Breakpoints: 375 / 768 / 1024 / 1280 (+ 1440 wide)
- [x] Validation rules: required `title/category/description/status/probability/impact`; evidence URL must be valid http(s); mitigation step requires description
