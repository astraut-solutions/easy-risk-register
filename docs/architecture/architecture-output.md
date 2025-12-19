# System Architecture (Overview)

This document is a short, implementation-aligned overview. For the full set of diagrams and deeper technical details, use `docs/architecture/architecture-diagrams.md`.

## Summary

- **Runtime**: client-side only (no backend server required)
- **Data**: stored in the browser (LocalStorage via the Zustand store persistence layer)
- **Security**: input/output sanitization + optional client-side encryption utilities

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

See `docs/architecture/architecture-diagrams.md` for PlantUML and Mermaid diagrams, including data flow and state management.

