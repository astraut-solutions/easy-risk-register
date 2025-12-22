---
title: UX/UI Improvement Plan (Risk Workspace)
description: Trackable checklist for improving the Risk Workspace UI and the "Create new risk" modal.
last-updated: 2025-12-22
status: draft
---

# UX/UI Improvement Plan (Risk Workspace)

## 1) Audit (baseline)
- [ ] Capture current screenshots (desktop + tablet + mobile)
- [ ] List top 10 UX issues (scrolling, hierarchy, copy, actions, accessibility)
- [ ] Identify required fields + validation rules
- [ ] Confirm target breakpoints (e.g., 375 / 768 / 1024 / 1280)
- [ ] Define success metrics (time-to-create, scroll count, abandonment)

## 2) Information architecture (progressive disclosure)
- [ ] Define “Essentials” fields (always visible)
- [ ] Define “Details” fields (collapsed by default)
- [ ] Decide if “Responses / Evidence / Steps / Notes” become tabs vs accordions
- [ ] Write concise, consistent labels + helper text (1 sentence max)

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
- [ ] Breakpoints:
- [ ] Validation rules:
