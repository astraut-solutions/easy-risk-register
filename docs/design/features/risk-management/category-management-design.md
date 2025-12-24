---
title: Easy Risk Register - Custom Categories (Design Notes)
description: UX/UI spec for adding and persisting user-defined risk categories.
last-updated: 2025-12-22
status: draft
---

# Custom Categories (Design Notes)

## Problem
Default categories rarely match how teams actually talk about risk. Users need to add categories that reflect their operating model (e.g. “Third-party”, “Privacy”, “Fraud”, “Data quality”).

## Goals
- Let users create categories **in the moment** while capturing a risk.
- Prevent duplicates and keep the list tidy.
- Persist categories locally (privacy-first) without extra setup.

## Primary flow (Create/Edit Risk)
- The Category select remains the primary control.
- Provide an **Add category** affordance adjacent to the select.
- Clicking **Add category** reveals an inline input:
  - Field: “New category”
  - Actions: “Add” and “Cancel”

## Validation + error states
- Empty value → error: “Category name is required.”
- Duplicate (case-insensitive) → error: “Category already exists.”

## Persistence
- Newly added categories appear immediately in:
  - the Category select in the form
  - the dashboard filters (category filter dropdown)
- Categories persist via LocalStorage (no server).

## Accessibility
- The inline “Add category” panel must be keyboard reachable.
- Error messages must be announced (use existing input error patterns).

