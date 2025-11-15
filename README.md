# Easy Risk Register

A lightweight, privacy-focused risk management application for small and medium-sized businesses (SMBs). The application provides effective tools to manage operational, security, and compliance risks through an intuitive web interface that operates entirely in the browser.

## Overview

Easy Risk Register addresses a critical market gap where SMBs currently rely on outdated methods like Excel spreadsheets or informal processes for risk management, while enterprise-grade tools remain too complex and costly for their needs. The application offers:

- **Privacy-first approach**: All data stored locally in browser storage, no server required
- **Cross-industry applicability**: Universal solution suitable for various business types
- **Cost-effective**: Free to use with no infrastructure costs
- **User-friendly**: Intuitive interface accessible to non-risk experts

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
- Chart.js for risk matrices and visualizations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Operational Scripts

Helper scripts for common operations are located in the `scripts/` directory:

- `build-docker.bat` / `build-docker.sh` - Build Docker images for Windows and Linux/Mac
- `setup-dev.bat` / `setup-dev.sh` - Setup development environment for Windows and Linux/Mac
- `install.sh` - Installation script for Linux/Mac

### Installation

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

## Tech Stack

- **Frontend Framework**: React.js with Vite for fast builds
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Data Visualization**: Built-in charting components

## Documentation

This section provides a comprehensive index of all project documentation organized by category:

| Documentation Cluster | Documents |
|----------------------|-----------|
| **Guides** | [Setup Guide](docs/guides/setup.md) - Complete setup instructions from quick start to advanced development<br>[Testing Guide](docs/guides/testing.md) - How to run and write tests<br>[Contributing Guide](docs/guides/contributing.md) - Guidelines for contributing to the project<br>[Development Workflow](docs/guides/development-workflow.md) - Standard development process and commands<br>[Code Style Guide](docs/guides/code-style.md) - Coding standards and best practices |
| **Architecture** | [Architecture Documentation](docs/architecture/architecture-output.md) - System architecture and implementation details |
| **Reference** | [System Diagrams](docs/reference/DIAGRAMS.md) - Visual representations of system architecture and data flows<br>[High-level Overview](docs/reference/high-level.txt) - High level architecture overview<br>[Current Implementation](docs/reference/high-level-current.txt) - Current implementation summary |
| **Design** | [Design System](docs/design/design-system/) - Style guide and component specifications<br>[Features Documentation](docs/design/features/) - Feature-specific implementation guides<br>[Accessibility Guidelines](docs/design/accessibility/) - Inclusive design standards<br>[Design Assets](docs/design/assets/) - Design tokens and reference materials<br>[Requirements Mapping](docs/design/requirements-mapping.md) - Mapping of requirements to design elements |
| **Product** | [Product Requirements](docs/product/product-requirements.md) - Complete feature specifications and requirements<br>[Tech Stack Preferences](docs/product/tech-stack-pref.md) - Technology stack preferences and decisions |
| **Reports** | [Project Report](docs/report/report.pdf) - Project report<br>[Deployment Report](docs/report/report_Host it publicly.pdf) - Hosting and deployment report<br>[Compliance Report](COMPLIANCE_REPORT.md) - 100% compliance achievement with minor documentation clarifications |

This README serves as the canonical index for all project documentation, preserving the "single source" promise by providing centralized access to all resources.

## Contributing

We welcome contributions to the Easy Risk Register project. Please read our contributing guidelines for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.