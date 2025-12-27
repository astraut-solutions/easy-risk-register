# Easy Risk Register

A lightweight, privacy-focused risk management application for small and medium-sized businesses (SMBs). Easy Risk Register helps teams capture, prioritize, and report operational, cyber security, and compliance risks through an intuitive web interface that operates entirely in the browser.

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

- **Privacy-first approach**: All data stored locally in browser storage, no server required
- **Cross-industry applicability**: Universal solution suitable for various business types
- **Cost-effective**: Free to use with no infrastructure costs
- **User-friendly**: Intuitive interface accessible to non-risk experts

## Real-World Use Cases

### Small Healthcare Practice
A medical practice with 15 staff members uses Easy Risk Register to track patient data security risks, equipment failure possibilities, and regulatory compliance issues. They can visualize risks on the probability-impact matrix to prioritize which threats require immediate attention, like potential HIPAA violations or medical device failures.

### Manufacturing Company
A small manufacturing company tracks risks related to supply chain disruptions, workplace safety incidents, and quality control failures. Using the risk scoring feature (probability x impact), they prioritize which risks could have the greatest effect on production and revenue.

### Financial Services Firm
A regional financial advisor firm manages risks including market volatility, cybersecurity threats, and regulatory changes. The CSV export feature allows them to share risk assessments with their compliance team and create reports for stakeholders.

## Features

- Create, edit, and delete risk records with comprehensive details
- Automatic risk scoring using probability x impact calculations
- Interactive probability-impact matrix visualization
- Dashboard view with charts and analytics
- Spreadsheet-style risk table for detailed management
- Maturity self-assessment radar for capability tracking
- Settings page for customization and preferences
- Responsive design that works across devices
- Cyber risk templates (phishing, ransomware, BEC) with one-click prefill for fast onboarding
- Cyber threat type classification + filtering
- Ownership + accountability fields (owner/team, due/review dates, review cadence, risk response)
- Evidence tracking (URLs + descriptions) and structured mitigation steps
- Compliance checklists (privacy incident / NDB assist) with timestamps and status filtering
- Incident response playbooks per risk (template-based, editable)
- Risk acceptance status support (`accepted`)
- CSV import/export functionality for reporting and backups (backward-compatible across versions)
- "Audit pack" CSV export variant for audit evidence preparation (includes evidence URL columns + review/acceptance metadata)
- CSV/Excel formula injection protection on export (cells starting with `=`, `+`, `-`, `@` are escaped)
- PDF exports (risk register + privacy checklist) via print-to-PDF (opens a `report.html` tab; popups must be allowed)
- Real-time updates for risk scores and visualizations
- Optional local encryption for stored data (passphrase-based, using browser crypto APIs)
- Maturity self-assessment with numbered domain badges and 2-column layout for efficient space usage
- Settings panel (full-page view, not modal) for account and visualization preferences
- WCAG 2.1 AA compliant accessibility features
- Content Security Policy (CSP) implementation for enhanced security
- 100% compliance with product requirements
- **Financial Risk Quantification features:**
  - Estimated Financial Impact (EFI) calculator with range-based estimates
  - Financial Risk Trend visualization showing potential impact over time
  - Return on Security Investment (ROSI) calculator for security control ROI analysis
  - Interactive Cost Modeling for tracking mitigation investments
  - Range-based impact visualization with upper/lower bounds and expected mean
- **Advanced Risk Scoring features:**
  - Dynamic Risk Score system (like SAFE Score) with multiple risk factors and time-based adjustments
  - Breach Likelihood probability calculations considering threat level, vulnerability, and controls effectiveness
  - Scenario-based scoring for specific threats (ransomware, data compromise, insider threats, supply chain)
  - Real-time risk posture measurement with trend analysis and risk capacity monitoring
- **UI/UX Improvements:**
  - Executive-focused dashboard with key metrics and visualizations
  - Clear information hierarchy with progressive disclosure using React hooks
  - Color-coded risk levels with consistent visual design using Tailwind CSS
  - Mobile-responsive design optimized for all screen sizes
  - Enhanced accessibility features with ARIA compliance
  - Intuitive navigation system for improved user experience
- **Technical Architecture features:**
  - Real-time processing engine for continuous risk updates (using Socket.io)
  - Time-series database integration for historical trend analysis (InfluxDB)
  - Graph database for modeling risk relationships and dependencies
  - Integration capabilities with vulnerability scanners (OpenVAS, ZAP, Nikto)
  - SIEM system integration (Wazuh, ELK Stack, Security Onion)
  - Asset management/CMDB system integration (DataGerry, CMDBuild, Snipe-IT)
  - API framework for third-party integrations (REST/GraphQL support)
  - Microservices architecture design for scalability (NestJS/Express on Vercel)
- **Differentiating Features:**
  - Financial risk translation for business stakeholders with natural language generation
  - Scenario modeling and what-if analysis capabilities using Monte Carlo simulation
  - Board-ready PDF reporting tools with professional formatting and visualizations
  - Executive communication tools with pre-built email templates and sharing capabilities
  - ROI measurement for security investments with cost-benefit analysis and prioritization

UX notes:
- Clicking a risk title takes you directly to the **Edit risk** view (no intermediate "view-only" modal).
- Settings is accessible via the sidebar button and displays as a full-page view for better usability.
- Workspace navigation includes five main views: Executive Overview, Dashboard Charts, Maturity Radar, Risk Table, and New Risk form.

Wording note: Easy Risk Register **supports audit evidence preparation for ISO 27001 / SOC 2** but does not provide certification or guarantee compliance.

## Architecture

The application follows a client-side-only architecture with no server dependencies:
- All data is stored in browser local storage with robust input sanitization to prevent XSS attacks
- Content Security Policy (CSP) implementation to prevent code injection attacks
- Built with React, TypeScript, Vite, and Tailwind CSS
- Zustand for state management
- Framer Motion for animations

Optional integrations (time-series, threat intel, etc.) are designed to keep secrets off the client:
- Never put API keys/tokens in `VITE_*` variables (anything prefixed with `VITE_` is bundled into the browser build).
- Use serverless APIs (Vercel functions under `api/`) for any calls that require credentials.

Server-side APIs live in the repo root `api/` folder (Vercel Serverless Functions). There is no separate backend server to run when deploying on Vercel.

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
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser

#### Docker Compose (no local Node/npm)

From the repo root:

```bash
docker compose --profile development up --build frontend-dev
```

> If your system uses the legacy `docker-compose` binary, replace `docker compose` with `docker-compose`.

Then open [http://localhost:5173](http://localhost:5173).

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

## Documentation

This README serves as the **single source of truth** for the Easy Risk Register project documentation. All other documentation files are centralized and accessible through the links below:

### Complete Documentation Index

| Category | Documents | Description |
|----------|-----------|-------------|
| **Architecture** | [Architecture Documentation](docs/architecture/architecture-diagrams.md) | System architecture with integrated diagrams |
| | [System Architecture (Overview)](docs/architecture/architecture-output.md) | Implementation-aligned architecture summary |
| | [Secure Data Storage](docs/architecture/secure-data-storage.md) | Client-side encryption for persisted LocalStorage data |
| | [Technical Architecture](docs/technical-architecture.md) | Detailed documentation on real-time processing, time-series DB, graph DB, vulnerability scanner integration, SIEM integration, and microservices architecture |
| **Guides** | [Setup Guide](docs/guides/dev/setup.md) | Complete setup instructions from quick start to advanced development |
| | [Testing Guide](docs/guides/dev/testing.md) | How to run and write tests |
| | [Development Workflow](docs/guides/dev/development-workflow.md) | Standard development process and commands |
| | [Code Style Guide](docs/guides/dev/code-style.md) | Coding standards and best practices |
| | [Audit-ready workflow](docs/guides/product/audit-ready-workflow.md) | Owners, reviews, evidence, and audit pack exports |
| | [PDF exports](docs/guides/product/pdf-exports.md) | Print-to-PDF reports + troubleshooting |
| | [Evidence guidance](docs/guides/product/evidence-guidance.md) | What counts as evidence and how to capture it |
| | [Privacy controls](docs/guides/security/privacy-controls.md) | Local encryption + incident playbooks |
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

- **Role-Based Access Control (RBAC)**: Implemented using JWT with jsonwebtoken for secure user authentication and authorization
- **Audit Logging**: Comprehensive audit logging for risk modifications using Winston logger with file transports
- **Data Encryption**: Client-side and server-side encryption for sensitive information using Crypto.js and Node crypto
- **Compliance Reporting**: NIST framework-aligned compliance reporting with template-based PDF generation using jsPDF
- **API Security**: Secure API endpoints with authentication middleware and role-based access control
- **Frontend Security**: React context-based security management with protected routes and role checking

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
