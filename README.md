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

## Architecture

The application follows a client-side-only architecture with no server dependencies:
- All data is stored in browser local storage
- Built with React, TypeScript, Vite, and Tailwind CSS
- Zustand for state management
- Framer Motion for animations
- Chart.js for risk matrices and visualizations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

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

For detailed information about the design system, features, and implementation guidelines, see:

### Core Documentation
- [Product Requirements](docs/product/product-requirements.md) - Complete feature specifications and requirements
- [Technical Architecture](docs/architecture/architecture-output.md) - System architecture and implementation details
- [System Diagrams](docs/architecture/DIAGRAMS.md) - Visual representations of system architecture and data flows

### Design Documentation
- [Design Documentation Overview](docs/design/) - Complete design system and feature specifications
  - [Design System](docs/design/design-system/) - Style guide and component specifications
  - [Features Documentation](docs/design/features/) - Feature-specific implementation guides
  - [Accessibility Guidelines](docs/design/accessibility/) - Inclusive design standards

### Getting Started
- [Setup Instructions](docs/getting-started/SETUP.md) - Environment setup and configuration guide
- [High Level Overview](docs/architecture/high-level-current.txt) - Current implementation summary

To view the diagrams properly, use a Markdown editor or viewer that supports Mermaid syntax (such as GitHub, GitLab, or specialized Mermaid editors).

## Contributing

We welcome contributions to the Easy Risk Register project. Please read our contributing guidelines for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.