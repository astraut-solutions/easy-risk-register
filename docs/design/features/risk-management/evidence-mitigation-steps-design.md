---
title: Easy Risk Register - Evidence & Mitigation Steps (Design Notes)
description: UX/UI spec for managing evidence entries and mitigation steps inside a risk record.
last-updated: 2025-12-22
status: draft
---

# Evidence & Mitigation Steps (Design Notes)

## Design goals
- Keep risk entry fast; make advanced tracking optional (progressive disclosure).
- Provide “audit-pack ready” structure: links to tickets/docs, and a clear action trail.
- Ensure accessibility: keyboard-first, clear focus, readable error states.

## Evidence entries

### UI placement
- A collapsible **Evidence** section in the create/edit form.
- In list/table views, show a simple **evidence count** (e.g. “3 evidence”).

### Add flow
- “Add evidence” button appends a new row.
- Default new evidence fields:
  - Type: `link`
  - URL: empty (required before saving)
  - Description: empty (optional)

### Edit/remove
- Inline editing for URL + description.
- Remove uses a destructive icon/button with clear label; no modal required for MVP.

### Validation
- URL must be `http`/`https`.
- Clear errors inline and announce to screen readers via existing input error patterns.

## Mitigation steps

### UI placement
- A collapsible **Mitigation steps** section in the create/edit form.
- Keep `mitigationPlan` as a short summary field for quick context.

### Step model (UI expectations)
Each step supports:
- Description (required)
- Status toggle (open/done)
- Optional owner
- Optional due date
- Optional reordering

### Add flow
- “Add step” appends a new step row (focus moves to description).

### Complete flow
- Checking “done” sets the step status to `done` and records completion timestamp (no need to display timestamp in MVP).

### Reorder flow
- Up/Down controls per step (disabled at top/bottom).

## Risk detail view
- Show mitigation steps as a simple list with status indicators.
- Show evidence as a list of links with type chips and optional descriptions.

