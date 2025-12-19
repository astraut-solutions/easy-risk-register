---
title: Easy Risk Register - Risk Management Accessibility
description: Accessibility requirements and patterns for the risk management feature
last-updated: 2025-12-19
version: 1.0.0
status: draft
---

# Risk Management Accessibility

This doc lists feature-specific accessibility requirements for risk management.

## Forms (Create/Edit)

- Every input has a visible label and a programmatic label.
- Error text is associated to inputs (`aria-describedby`) and announced on submit.
- Probability/impact controls are keyboard accessible and have clear states.

## Lists/Tables

- Row actions are reachable by keyboard and have accessible names.
- Sorting/filtering controls have clear labels and state.

## Matrix

- Matrix is usable without a mouse (or provides an alternative view).
- Selected risk state is communicated via text, not color alone.

## Modals

- Focus trap + Escape to close + restore focus to trigger.

