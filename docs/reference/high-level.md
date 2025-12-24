# Easy Risk Register (High-level Overview)

## Concept

A lightweight, privacy-first web app that empowers small and medium-sized organizations to identify, assess, and visualize operational, cyber security, and compliance risks - delivering enterprise-level insights without the bloat, complexity, or high costs of traditional systems.

## Problem

Many small and medium businesses (SMBs) rely on outdated methods like Excel spreadsheets or simply overlook risk management due to limited resources. Enterprise-grade tools such as Archer or ServiceNow demand steep learning curves, hefty subscriptions, and IT overhead, making them inaccessible for teams that need straightforward, actionable risk tracking.

## Solution

Easy Risk Register is a minimalist, fully client-side web app that runs entirely in the browser, using local storage for data security and zero server dependencies. It enables users to:

- Quickly add, edit, or delete risks with intuitive forms.
- Assign probability (on a 1–5 scale), impact levels (1–5 scale), and custom mitigation plans.
- Automatically compute a risk score based on probability × impact formulas.
- Visualize risks in a dynamic probability-impact matrix (e.g., a color-coded grid for quick prioritization).
- Start from cyber templates (phishing, ransomware, BEC) to prefill common scenarios and controls.
- Classify risks by cyber threat type and filter by threat type and compliance checklist status.
- Export data to CSV for audits, meetings, or stakeholders.
- Export print-ready PDF reports (risk register + privacy incident checklist) via the browser print dialog.

## Why It Works

- Universal appeal across industries (e.g., tech, finance, healthcare, manufacturing) where risk management is essential but often neglected.
- Instant setup: no installations, accounts, or backend — deployable for free on platforms like GitHub Pages or Vercel.
- Privacy-focused: all data stays local to the user's device, reducing compliance worries.
- Scalable: core features are simple, but expandable via plugins for domain-specific risks (e.g., cybersecurity threats, financial audits, or project delays).
- User-friendly: clean, responsive UI with real-time updates, making it accessible for non-experts.

## Current Implementation

The application is built with the following tech stack:

- React (via Vite) for the frontend framework
- TypeScript for type safety
- Zustand for state management
- Tailwind CSS for styling
- Framer Motion for animations
- Local storage for data persistence

### Key Features Implemented

1. Executive overview dashboard with risk summary cards
2. Interactive risk probability-impact matrix visualization
3. Risk table with spreadsheet-style view
4. Risk creation and editing forms with validation
5. Filtering and sorting capabilities
6. CSV import/export functionality
7. Mobile-responsive design
8. Demo data seeding for quick start

### Code Layout (Implementation)

- `easy-risk-register-frontend/src/components/` - UI components (layout, risk, common)
- `easy-risk-register-frontend/src/services/` - Business logic and service layer
- `easy-risk-register-frontend/src/stores/` - Zustand stores for state management
- `easy-risk-register-frontend/src/types/` - TypeScript type definitions
- `easy-risk-register-frontend/src/utils/` - Utility functions

## MVP Flow (Conceptual)

1. User can access the app directly with no registration required.
2. After loading the app, users can immediately start using the application.
3. A simple navigation bar at the top or side shows:
   1. Risk Dashboard (home view)
      - Overview matrix visualizing all active risks by probability and impact.
      - Quick filters for sorting by score, category, or status (e.g., open/mitigated).
      - Users can click a risk title to jump directly into the edit view, update details, add notes, or mark as resolved.
      - Real-time risk score updates as changes are made.
   2. Add New Risk (prominent button, e.g., symbolized by a "+" icon)
      - Launches a guided form: input risk description, select probability/impact sliders, outline mitigation steps.
      - Save locally and auto-refresh the dashboard.
   3. Reports & Exports
      - View history of all risks (active/archived).
      - Generate exports: select format (CSV), and download/share.
   4. Settings
      - Customize matrix (e.g., adjust scoring scales, color themes).
      - Data management: backup/restore local data, clear history.

## Intended Audience

SMB owners, managers, and compliance officers who handle risks informally but need a structured tool to stay proactive, without investing in heavy enterprise software. It targets the intersection of growing businesses that value efficiency and those in regulated sectors requiring basic documentation for audits or insurance.

