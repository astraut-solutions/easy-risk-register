---
title: Easy Risk Register - Accessibility Testing Procedures
description: Automated and manual accessibility testing procedures for the Easy Risk Register application
last-updated: 2025-12-19
version: 1.0.0
status: draft
---

# Accessibility Testing Procedures

GitHub renders Mermaid diagrams but does not run accessibility tooling. This doc focuses on repeatable checks developers can perform locally.

## Automated Checks

- Run the app and verify the in-app accessibility tester (if enabled): `easy-risk-register-frontend/src/components/AccessibilityTester.tsx`
- Run unit/integration tests: `cd easy-risk-register-frontend && npm run test:run`

## Manual Checks (Minimum)

- Keyboard navigation: tab order, focus visibility, no keyboard traps (except intentional modal focus trap)
- Modals: focus is trapped, Escape closes, focus returns to the trigger
- Forms: labels, errors announced (aria-describedby / role=alert where appropriate)
- Screen readers: smoke test with NVDA/JAWS (Windows) or VoiceOver (macOS)
- Color contrast: verify text and key UI states meet WCAG 2.1 AA

## Definition of Done

- All new UI has keyboard support and visible focus.
- All form inputs have programmatic labels and clear error messaging.
- No critical Axe issues on primary flows (create/edit/delete risk, export/import).

