# Easy Risk Register

A lightweight, privacy-focused risk management application for small and medium-sized businesses (SMBs). The application provides effective tools to manage operational, security, and compliance risks through an intuitive web interface that operates entirely in the browser.

## 📋 Table of Contents
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
- [Support](#support)

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
A small manufacturing company tracks risks related to supply chain disruptions, workplace safety incidents, and quality control failures. Using the risk scoring feature (probability × impact), they prioritize which risks could have the greatest effect on production and revenue.

### Financial Services Firm
A regional financial advisor firm manages risks including market volatility, cybersecurity threats, and regulatory changes. The CSV export feature allows them to share risk assessments with their compliance team and create reports for stakeholders.

## Features

- Create, edit, and delete risk records with comprehensive details
- Automatic risk scoring using probability × impact calculations
- Interactive probability-impact matrix visualization
- Responsive design that works across devices
- CSV export functionality for reporting
- Real-time updates for risk scores and visualizations
- WCAG 2.1 AA compliant accessibility features
- Content Security Policy (CSP) implementation for enhanced security
- 100% compliance with product requirements

## Architecture

The application follows a client-side-only architecture with no server dependencies:
- All data is stored in browser local storage with robust input sanitization to prevent XSS attacks
- Content Security Policy (CSP) implementation to prevent code injection attacks
- Built with React, TypeScript, Vite, and Tailwind CSS
- Zustand for state management
- Framer Motion for animations

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
3. The system automatically calculates the risk score (probability × impact)
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
- Risk calculations (probability × impact)
- Risk store operations (add, update, delete)
- Data import/export functionality
- Filtering and search functionality

For more details on testing, see [Testing Guide](docs/guides/testing.md).

## Tech Stack

- **Frontend Framework**: React.js with Vite for fast builds
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Animations**: Framer Motion

## Documentation

This README serves as the **single source of truth** for the Easy Risk Register project documentation. All other documentation files are centralized and accessible through the links below:

### 📚 Complete Documentation Index

| Category | Documents | Description |
|----------|-----------|-------------|
| **Architecture** | [Architecture Documentation](docs/architecture/architecture-diagrams.md) | System architecture with integrated diagrams |
| | [System Architecture (Overview)](docs/architecture/architecture-output.md) | Implementation-aligned architecture summary |
| **Guides** | [Setup Guide](docs/guides/setup.md) | Complete setup instructions from quick start to advanced development |
| | [Testing Guide](docs/guides/testing.md) | How to run and write tests |
| | [Development Workflow](docs/guides/development-workflow.md) | Standard development process and commands |
| | [Code Style Guide](docs/guides/code-style.md) | Coding standards and best practices |
| **Reference** | [System Diagrams](docs/reference/diagrams.md) | Visual representations of system architecture and data flows |
| | [High-level Overview](docs/reference/high-level.txt) | High level architecture overview |
| | [Current Implementation](docs/reference/high-level-current.txt) | Current implementation summary |
| **Design** | [Design System](docs/design/design-system/) | Style guide and component specifications |
| | [Features Documentation](docs/design/features/) | Feature-specific implementation guides |
| | [Accessibility Guidelines](docs/design/accessibility/) | Inclusive design standards |
| | [Design Assets](docs/design/assets/) | Design tokens and reference materials |
| | [Requirements Mapping](docs/design/requirements-mapping.md) | Mapping of requirements to design elements |
| **Product** | [Product Requirements](docs/product/product-requirements.md) | Complete feature specifications and requirements |
| | [Tech Stack Preferences](docs/product/tech-stack-pref.md) | Technology stack preferences and decisions |
| **Reports & Analysis** | [Project Report](docs/report/report.pdf) | Project report |
| | [Deployment Report](docs/report/report-host-it-publicly.pdf) | Hosting and deployment report |
| | [Compliance Report](docs/report/compliance-report.md) | 100% compliance achievement with minor documentation clarifications |
| | [Security Analysis Summary](docs/report/security-analysis-summary.md) | Comprehensive security assessment and implementation |
| | [Accessibility Implementation Summary](docs/report/accessibility-implementation-summary.md) | WCAG 2.1 AA compliance implementation details |

## Integrated Diagrams in Documentation

The Easy Risk Register documentation includes Mermaid diagrams directly within markdown files so they render on GitHub while remaining version-controlled with the codebase. You'll find:

- Architecture diagrams showing system components and data flows
- Component architecture with visual hierarchy
- User journey flows and workflows
- Data flow diagrams illustrating how information moves through the application
- Performance and security architecture visualizations

## License

This project is licensed under the MIT License - see the [LICENSE](docs/LICENSE) file for details.

## Security Policy

We take security seriously. For information about our security measures, see our [security documentation](docs/SECURITY.md).

### Automated Security Scanning

The project includes automated secret scanning in the CI/CD pipeline using Gitleaks to prevent sensitive information from being committed to the repository. The scanning runs on every push and pull request to main branches and can be found in:
- `.github/workflows/gitleaks-scan.yml`
- `.github/workflows/security-scanning.yml`

---

## 🏷️ Project Status
- **Last Updated**: November 2025
