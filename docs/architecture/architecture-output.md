# System Architecture (Overview)

This document is a short, implementation-aligned overview. For the full set of diagrams and deeper technical details, use `docs/architecture/architecture-diagrams.md`.

## Summary

- **Runtime**: browser frontend + serverless APIs (`/api/*`)
- **Data**: stored in Supabase Postgres (workspace-scoped with RLS); the browser stores only non-authoritative UI state and auth tokens
- **Security**: CSP + input sanitization + RLS-driven authorization; optional local encryption for persisted UI state

## Current Technology Stack

- **App**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form
- **Animation**: Framer Motion
- **Testing**: Vitest

## Code Layout (Implementation)

Implementation lives under `easy-risk-register-frontend/`:

- `easy-risk-register-frontend/src/components/` - feature UI (risk list/matrix/forms)
- `easy-risk-register-frontend/src/design-system/` - reusable UI components/tokens
- `easy-risk-register-frontend/src/stores/` - Zustand stores (state + persistence)
- `easy-risk-register-frontend/src/services/` - service layer (risk operations)
- `easy-risk-register-frontend/src/utils/` - sanitization, calculations, optional encryption helpers
- `easy-risk-register-frontend/test/` - Vitest test suites by area

## Diagrams

See `docs/architecture/architecture-diagrams.md` for Mermaid diagrams, including data flow and state management.
