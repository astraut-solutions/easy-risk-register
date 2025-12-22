---
title: Easy Risk Register - Accountability & Evidence (Design Notes)
description: UX/UI notes for ownership, review cadence, mitigation steps, and evidence capture fields.
last-updated: 2025-12-22
status: draft
---

# Accountability & Evidence (Design Notes)

These notes define how the new accountability + evidence fields should feel in the UI. The goal is to add audit-ready structure without making the app feel “enterprise-bloated”.

## Design goals
- Make accountability obvious at a glance (owner, next review, response).
- Keep data entry fast (progressive disclosure; optional sections collapsed by default).
- Preserve the existing “probability × impact” workflow as the center of gravity.
- Support audit prep with evidence links and step tracking, without implying certification/compliance.

## Information architecture

### Risk create/edit form
Recommended section order (top → bottom):
1. **Basics**: title, category, description
2. **Scoring**: probability, impact, computed score/severity
3. **Status**: open/accepted/mitigated/closed
4. **Accountability** (collapsible): owner, team, due date
5. **Review** (collapsible): review date, cadence
6. **Response** (collapsible): risk response + short text responses (owner/security advisor/vendor)
7. **Mitigation**: keep `mitigationPlan` as summary; add `mitigationSteps` as the primary step tracker (add/reorder/mark done)
8. **Evidence** (collapsible): add evidence items (type + URL + optional description)
9. **Notes** (collapsible): long-form notes

## Interaction patterns
- **Progressive disclosure**: show Basics/Scoring/Status by default; collapse everything else into small panels with “Add owner”, “Add review cadence”, “Add evidence”, etc.
- **Evidence entry**: validate URL on blur; show a clear error state; allow remove with confirmation.
- **Mitigation steps**: quick-add row, inline completion toggle, optional owner/due date per step.
- **Accepted status**: when user selects “Accepted”, show subtle helper text explaining it means “accepted/tolerated as-is for now” (microcopy only; no judgement).

## Microcopy guidelines
- Use plain language: “Likelihood” can be shown as the label even if the field name is probability.
- Avoid framework claims: use “audit prep” and “evidence” language, not “ISO compliant” or “SOC 2 ready”.

## Accessibility notes
- All collapsible sections must be keyboard accessible with visible focus states.
- Evidence list should be screen-reader friendly (announce add/remove).

