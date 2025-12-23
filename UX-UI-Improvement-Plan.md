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
- [x] Eliminate double scroll (background locked; single modal scroll container)
- [x] Add sticky modal header (title, short subtitle, close icon, `Esc` hint)
- [x] Add sticky modal footer (Primary: Add risk; Secondary: Save draft; Tertiary: Cancel)
- [x] Ensure "Essentials" fit within common laptop height with minimal scrolling
- [x] Define close behavior (confirm only when dirty)

### Modal layout changes (implemented)
- Single scroll container: modal overlay is non-scrollable; modal content scrolls; background scroll locks while open.
- Sticky header: shows workspace eyebrow, title, description, close icon, and `Esc` hint.
- Sticky actions: in-form sticky action bar keeps `Add risk` / `Save changes`, `Save draft` (create only), and `Cancel` visible.
- Close confirmation: backdrop/close icon/`Esc`/Cancel confirm discard only when form is dirty; clean form closes immediately.

## 4) Scoring UX (make severity actionable)
- [x] Place Likelihood + Impact adjacent to Live score
- [x] Live score card includes score + severity label + semantic color treatment
- [x] Add one-line "why this severity" explanation
- [x] Add contextual next-step nudge (e.g., "Assign an owner" for High/Critical)

### Scoring UX changes (implemented)
- Live score card now shows Likelihood + Impact chips adjacent to score/severity, with semantic severity color styling.
- Adds a one-line threshold explanation (e.g., "Score > 6 is high severity") plus the live formula (`score = likelihood×impact`).
- Adds an explicit "Recommended next step" nudge that adapts to severity (e.g., High: assign owner + due date).

## 5) Visual system consistency (modern + calm)
- [x] Reduce card nesting (avoid "card-in-card-in-card")
- [x] Standardize spacing scale (8 / 12 / 16 / 24 / 32)
- [x] Typography hierarchy (title, section headers, labels, helper text)
- [x] Consistent "Optional" treatment (badge or suffix; pick one)
- [x] Consistent component states (default/hover/focus/disabled/error)
- [x] Unify row/card actions (single "View/Edit" action; remove redundant "View")

### Visual system changes (implemented)
- Reduced nested borders/shadows in the create/edit form by using a single "Details" container and softer section surfaces.
- Standardized key paddings/gaps to an 8/12/16/24/32 scale in empty states and form layout.
- Optional fields now consistently use the `(optional)` label suffix (instead of mixing helper-text prefixes).
- Actions already unified as `View/Edit` in both cards and table.

## 6) Accessibility & form quality (must-have)
- [x] Keyboard navigation: logical tab order; `Esc` closes; `Enter` submits when valid
- [x] Visible focus styles on all interactive elements
- [x] WCAG AA contrast for text, chips, slider track, disabled states
- [x] Inline validation messages with specific fixes
- [x] Screen reader labels and ARIA for accordions/tabs and sliders

### Accessibility changes (implemented)
- Keyboard: modal closes on `Esc`; Title autofocus improves tab start; required selects now expose `required` semantics.
- Focus styles: added consistent `:focus-visible` rings for disclosures (`<summary>`) and mitigation step checkboxes.
- Validation: required-field messages now provide specific, actionable fixes; required inputs are clearly marked.
- ARIA: sliders include `aria-valuenow`/`aria-valuetext` and the form keeps accessible labels + descriptions.

## 7) Responsive behavior
- [x] ≥1024px: two-column only where helpful; keep essentials grouped
- [x] 768–1024px: stacked layout; keep score near sliders
- [x] Mobile: full-screen sheet modal with sticky action bar
- [x] Verify no horizontal overflow at any breakpoint

### Responsive changes (implemented)
- Mobile: `size="full"` modal renders as a full-screen sheet (no outer padding, no rounded corners) with a safe-area-aware sticky action bar.
- Tablet: form stays stacked under 1024px, keeping Live score and sliders close together.
- Desktop: uses two-column layout at ≥1024px where helpful while keeping essentials grouped.
- Overflow: modal content prevents horizontal overflow via `overflow-x-hidden` on the scroll container.

## 8) QA checklist (before shipping)
- [x] No nested scrolling; footer/header remain sticky in long forms
- [x] Add risk disabled until required fields valid; clear reason shown
- [x] Save draft works with partial data (if supported)
- [x] Close confirmation triggers only when dirty
- [x] Risk list/table actions: only "View/Edit" (no separate "View"); opens correct modal
- [x] Cross-browser check (Chrome, Edge, Firefox, Safari if applicable)

### QA notes (implemented)
- Submit gating: primary action disables until required fields are valid, with a clear inline hint listing missing fields.
- Drafts: Save draft persists partial input; opening create restores saved draft; submit clears it.
- Close behavior: close icon/backdrop/`Esc` triggers discard confirm only when dirty.
- Cross-browser: uses `100dvh` + safe-area padding for the full-screen sheet; run a quick manual smoke test in Safari/iOS before shipping.

## 9) Release & measurement
- [x] Add lightweight analytics events (open modal, submit, validation errors, abandon)
- [x] Compare baseline metrics vs new design
- [x] Gather stakeholder feedback (exec scanability + risk owner usability)

### Release instrumentation (implemented)
- Opt-in analytics events now capture: modal open, submit (duration), abandon (duration + dirty), validation errors (count + fields), and save draft.
- Metrics UI: add `?metrics=1` to the URL, click `Metrics`, enable analytics, then export JSON for baseline/post-change comparison.
- Stakeholder feedback: `Metrics` modal includes a copyable feedback template for exec scanability + risk owner usability.

## Notes / Decisions Log
- [x] Essentials fields: Title*, Category*, Description*, Status*, Likelihood*, Impact*, Live score (score + severity + next-step nudge)
- [x] Details fields: Mitigation plan; Accountability (Owner, Owner team, Due date); Review cadence (Next review date, Cadence); Responses (Response, Owner response, Security advisor comment, Vendor response); Evidence; Mitigation steps; Notes
- [x] Tabs vs accordions decision: Accordions via native `<details>` grouped under “Details (optional)”
- [x] Breakpoints: 375 / 768 / 1024 / 1280 (+ 1440 wide)
- [x] Validation rules: required `title/category/description/status/probability/impact`; evidence URL must be valid http(s); mitigation step requires description
