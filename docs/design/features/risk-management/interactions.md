---
title: Easy Risk Register - Risk Management Interactions
description: Interaction patterns for the risk management feature
last-updated: 2025-12-19
version: 1.0.0
status: draft
---

# Risk Management Interactions

This doc captures interaction patterns used across the risk management feature.

## Core Interactions

- Create: open modal, validate fields, save, close modal, update list/matrix
- Edit: open prefilled modal, save updates, recalc score if needed, update UI
- Delete: confirm intent, delete, update all views
- Filter/sort: immediate feedback, preserve filter state, show empty states

## Feedback Patterns

- Validation: inline errors + summary where appropriate
- Success: subtle confirmation (toast/snackbar) without blocking workflow
- Empty states: guidance + primary action

