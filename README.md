# Easy Risk Register

A lightweight, privacy-first risk management application for small and medium-sized businesses (SMBs). Easy Risk Register helps teams capture, prioritize, and report operational, cyber security, and compliance risks through an intuitive web interface backed by **Supabase (Postgres)** and **serverless APIs** (`/api/*`).

## Table of Contents
- [Overview](#overview)
- [Real-World Use Cases](#real-world-use-cases)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [User Journey Examples](#user-journey-examples)
- [Testing](#testing)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [Integrated Diagrams in Documentation](#integrated-diagrams-in-documentation)
- [License](#license)
- [Security Policy](#security-policy)
- [Project Status](#project-status)

## Overview

Easy Risk Register addresses a critical market gap where SMBs currently rely on outdated methods like Excel spreadsheets or informal processes for risk management, while enterprise-grade tools remain too complex and costly for their needs. The application offers:

- **Privacy-first approach**: Data is stored in your Supabase project (workspace-scoped with RLS); the browser stores only non-authoritative UI state plus the Supabase session token
- **Cross-industry applicability**: Universal solution suitable for various business types
- **Cost-effective**: Simple architecture (Vercel + Supabase) with minimal operational overhead
- **User-friendly**: Intuitive interface accessible to non-risk experts

## Real-World Use Cases

### Small Healthcare Practice
A medical practice with 15 staff members uses Easy Risk Register to track patient data security risks, equipment failure possibilities, and regulatory compliance issues. They can visualize risks on the probability-impact matrix to prioritize which threats require immediate attention, like potential HIPAA violations or medical device failures.

### Manufacturing Company
A small manufacturing company tracks risks related to supply chain disruptions, workplace safety incidents, and quality control failures. Using the risk scoring feature (probability x impact), they prioritize which risks could have the greatest effect on production and revenue.

### Financial Services Firm
A regional financial advisor firm manages risks including market volatility, cybersecurity threats, and regulatory changes. The CSV export feature allows them to share risk assessments with their compliance team and create reports for stakeholders.

## Features

- Supabase Auth sign-in/out and workspace-scoped access (default “Personal” workspace; no multi-workspace switcher UX yet)
- Risk CRUD via APIs (`/api/risks`, `/api/categories`) with validation and consistent error handling
- Automatic risk scoring (probability × impact) and probability-impact matrix + table views
- Filters and search (status/category/threat type/score)
- CSV export (standard + audit pack) with CSV/Excel formula injection protection
- PDF export via print-to-PDF (`report.html` viewer; popups must be allowed)
- Per-risk optional fields stored in `public.risks.data` (jsonb): templates, checklists, evidence, playbooks, structured mitigation steps
- Sanitization and a strict Content Security Policy (CSP)

UX notes:
- Clicking a risk title takes you directly to the **Edit risk** view (no intermediate "view-only" modal).
- Settings is accessible via the sidebar button and displays as a full-page view for better usability.
- Workspace navigation includes five main views: Executive Overview, Dashboard Charts, Maturity Radar, Risk Table, and New Risk form.

Wording note: Easy Risk Register **supports audit evidence preparation for ISO 27001 / SOC 2** but does not provide certification or guarantee compliance.

## Architecture

The application uses a Supabase-backed architecture:

- **Frontend**: Vite + React + TypeScript (`easy-risk-register-frontend/`)
- **Serverless APIs**: Vercel functions under `api/` (same-origin `/api/*`)
- **Auth**: Supabase Auth in the browser; APIs require an end-user Bearer token
- **Persistence**: Supabase Postgres with workspace scoping enforced via RLS
- **Local persistence**: non-authoritative UI state (filters/settings) plus the Supabase session token

Optional integrations (time-series, threat intel, etc.) are designed to keep secrets off the client:
- Never put API keys/tokens in `VITE_*` variables (anything prefixed with `VITE_` is bundled into the browser build).
- Use serverless APIs (Vercel functions under `api/`) for any calls that require credentials.

Server-side APIs live in the repo root `api/` folder (Vercel Serverless Functions). In local development, run the dev API server (Docker profile `development`) or point `VITE_API_BASE_URL` at a deployed environment.

Diagrams and a deeper breakdown are in [Architecture Documentation](docs/architecture/architecture-diagrams.md).

## Getting Started

### Prerequisites

- Option A (local): Node.js (v18 or higher) + npm or yarn
- Option B (containerized): Docker Desktop (or Docker Engine) + Docker Compose

### Installation

#### Local (Node/npm)

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd easy-risk-register-frontend
   ```
3. Create `easy-risk-register-frontend/.env` (see `easy-risk-register-frontend/.env.example`) and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (optional; set when pointing at a separate API host)
4. Install dependencies:
   ```bash
   npm install
   ```

Optional (recommended): enable local secret-scanning hooks (blocks commits/pushes that contain secrets).

From the repo root:

```bash
npm run install:hooks
```

This requires `gitleaks` installed locally: https://github.com/gitleaks/gitleaks#installation

5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:5173](http://localhost:5173) in your browser

Note: `npm run dev` runs the frontend only. For a full local stack (Supabase-compatible services + `/api/*`), use the Docker Compose `development` profile below.

#### Docker Compose (no local Node/npm)

From the repo root:

```bash
docker compose --profile development up --build frontend-dev
```

> If your system uses the legacy `docker-compose` binary, replace `docker compose` with `docker-compose`.

If you run the full dev profile (including the local Supabase-compatible services), create a root `.env` file first:
```bash
cp .env.example .env
```
Then set `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` in `.env` (do not commit `.env`).

Then open [http://localhost:5173](http://localhost:5173).

Troubleshooting:
- `502 Bad Gateway` from `/api/*` with `Supabase query failed: JWSError JWSInvalidSignature` or `role "" does not exist`: restart the dev stack and clear site data for `http://localhost:5173` (old tokens won't validate after JWT secret changes).
- `Port 5173 is already in use`: stop the existing Vite process/container, or change the port mapping for `frontend-dev` in `docker-compose.yml`.

To stop/remove containers:

```bash
docker compose --profile development down
```

### Docker Setup

For containerized workflows:

```bash
docker compose up --build frontend
```

Open [http://localhost:3001](http://localhost:3001).

To stop/remove containers:

```bash
docker compose down
```

## User Journey Examples

### Creating Your First Risk
1. Click the "Create New Risk" button on the dashboard
2. Fill in the risk details: title, description, probability (1-5 scale), impact (1-5 scale), and category
3. The system automatically calculates the risk score (probability x impact)
4. Add a mitigation plan if applicable
5. Save the risk to add it to your register

### Managing Existing Risks
1. View your risks in the list view or on the probability-impact matrix
2. Filter risks by category, status, or severity to focus on specific areas
3. Edit risks to update probability, impact, or mitigation plans as circumstances change
4. Use the risk score to prioritize which risks need immediate attention

### Exporting for Reports
1. Click the "Export" button on the dashboard or risk list
2. Download the CSV file containing all your risk data
3. Open in Excel or other spreadsheet applications for further analysis

### Importing from CSV
1. Click the "Import CSV" button on the dashboard
2. Select a CSV file exported from Easy Risk Register (or a compatible format)
3. Review the updated risk list and matrix after import completes

## Testing

### Running Tests (Vitest)

The project uses [Vitest](https://vitest.dev/) for testing. You can run tests using the following commands:

From `easy-risk-register-frontend/`:

#### Run all tests once:
```bash
npm run test:run
```

#### Run all tests in watch mode:
```bash
npm run test
```

#### Run specific test file:
```bash
npx vitest test/stores/riskStore.test.ts
```

### Available Test Scripts

- `npm run test` - Run Vitest in watch mode (for development)
- `npm run test:run` - Run all tests once (for CI/verification)

### Test Coverage

Aim for at least 80% test coverage for business logic, especially for:
- Risk calculations (probability x impact)
- Risk store operations (add, update, delete)
- Data import/export functionality
- Filtering and search functionality

For more details on testing, see [Testing Guide](docs/guides/dev/testing.md).

## Tech Stack

- **Frontend Framework**: React.js with Vite for fast builds
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Backend**: Vercel Serverless Functions (`api/`)
- **Database/Auth**: Supabase (Postgres + Auth)

## Documentation

This README serves as the **single source of truth** for the Easy Risk Register project documentation. All other documentation files are centralized and accessible through the links below:

### Complete Documentation Index

| Category | Documents | Description |
|----------|-----------|-------------|
| **Architecture** | [Architecture Documentation](docs/architecture/architecture-diagrams.md) | System architecture with integrated diagrams |
| | [System Architecture (Overview)](docs/architecture/architecture-output.md) | Implementation-aligned architecture summary |
| | [Secure Data Storage](docs/architecture/secure-data-storage.md) | What is stored locally vs. in Supabase; optional local encryption for persisted UI state |
| | [Technical Architecture](docs/technical-architecture.md) | Current implementation architecture (Supabase + serverless APIs) |
| **Guides** | [Setup Guide](docs/guides/dev/setup.md) | Complete setup instructions from quick start to advanced development |
| | [Testing Guide](docs/guides/dev/testing.md) | How to run and write tests |
| | [Development Workflow](docs/guides/dev/development-workflow.md) | Standard development process and commands |
| | [Code Style Guide](docs/guides/dev/code-style.md) | Coding standards and best practices |
| | [Audit-ready workflow](docs/guides/product/audit-ready-workflow.md) | Owners, reviews, evidence, and audit pack exports |
| | [PDF exports](docs/guides/product/pdf-exports.md) | Print-to-PDF reports + troubleshooting |
| | [Evidence guidance](docs/guides/product/evidence-guidance.md) | What counts as evidence and how to capture it |
| | [Privacy controls](docs/guides/security/privacy-controls.md) | Current privacy controls + encryption roadmap |
| | [Deploying to Vercel](docs/guides/deploy/deploy-vercel.md) | Required env vars + Vercel setup |
| | [Auth + workspace scoping baseline](docs/guides/security/auth-workspace-scoping-baseline.md) | How auth and workspace tenancy work |
| **Reference** | [System Diagrams](docs/reference/diagrams.md) | Visual representations of system architecture and data flows |
| | [High-level Overview](docs/reference/high-level.md) | Product overview + current implementation summary |
| | [Risk record schema](docs/reference/risk-record-schema.md) | Field definitions for risk records |
| | [Risk CSV specification](docs/reference/risk-csv-spec.md) | Versioned CSV columns + import/export behavior |
| **Design** | [Design System](docs/design/design-system/) | Style guide and component specifications |
| | [Features Documentation](docs/design/features/) | Feature-specific implementation guides |
| | [Accessibility Guidelines](docs/design/accessibility/) | Inclusive design standards |
| | [Design Assets](docs/design/assets/) | Design tokens and reference materials |
| | [Requirements Mapping](docs/design/requirements-mapping.md) | Mapping of requirements to design elements |
| **Product** | [Product Requirements](docs/product/product-requirements.md) | Complete feature specifications and requirements |
| | [Tech Stack Preferences](docs/product/tech-stack-pref.md) | Technology stack preferences and decisions |
| **Frameworks** | [ISO 27001 mapping guidance](docs/frameworks/iso-27001-mapping.md) | Evidence preparation mapping (avoid certification claims) |
| | [SOC 2 mapping guidance](docs/frameworks/soc2-mapping.md) | Practical evidence mapping + examples |
| **Security** | [Security Policy](docs/SECURITY.md) | Security policy and overview |
| | [Security Implementation](docs/security-implementation.md) | CSP directives, sanitization, and storage hardening |
| **Financial Risk** | [Financial Risk Quantification](docs/financial-risk-quantification.md) | Comprehensive guide to financial risk quantification features |
| **Advanced Risk Scoring** | [Advanced Risk Scoring](docs/advanced-risk-scoring.md) | Comprehensive guide to advanced risk scoring features including dynamic scoring, breach likelihood, scenario analysis, and posture measurement |

## Integrated Diagrams in Documentation

The Easy Risk Register documentation includes Mermaid diagrams directly within markdown files so they render on GitHub while remaining version-controlled with the codebase. You'll find:

- Architecture diagrams showing system components and data flows
- Component architecture with visual hierarchy
- User journey flows and workflows
- Data flow diagrams illustrating how information moves through the application
- Performance and security architecture visualizations

## License

This project is licensed under the MIT License - see the [LICENSE](docs/LICENSE) file for details.

## Security & Compliance Features

- **Authentication**: Supabase Auth (end-user JWTs)
- **Authorization**: Supabase RLS + workspace scoping (defense-in-depth in `/api/*`)
- **App hardening**: CSP via headers + input sanitization to reduce XSS risk
- **Export safety**: CSV/Excel formula injection protection on export/import

## Security Policy

We take security seriously. For information about our security measures, see our [security documentation](docs/SECURITY.md).
For details on how persisted client-side state is encrypted, see [Secure Data Storage](docs/architecture/secure-data-storage.md).

### Automated Security Scanning

The project includes automated secret scanning in the CI/CD pipeline using Gitleaks to prevent sensitive information from being committed to the repository. The scanning runs on every push and pull request to main branches and can be found in:
- `.github/workflows/gitleaks-scan.yml`
- `.github/workflows/security-scanning.yml`

---

## Contributing

We welcome contributions to the Easy Risk Register project! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code follows our [Code Style Guide](docs/guides/dev/code-style.md) and includes appropriate tests.

## Project Status
- **Last Updated**: November 2025
