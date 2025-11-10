# Easy Risk Register Frontend

This is the frontend for the Easy Risk Register application, built with React, TypeScript, and Tailwind CSS. It provides a privacy-focused, client-side risk management solution.

## Features

- **Risk Management**: Create, view, edit, and track risks with probability-impact scoring
- **Visualizations**: Risk matrix visualization for better risk prioritization
- **Data Export**: Export risk data to CSV for reporting purposes
- **Privacy-First**: All data stored locally in the browser
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend Framework**: React 18
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to this frontend directory
3. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

### Build

To build the application for production:

```bash
npm run build
```

## Architecture

The application follows a component-based architecture with the following main directories:

- `components/` - Reusable UI components organized by type
- `pages/` - Page-level components
- `stores/` - Application state management with Zustand
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

## Data Management

All data is stored in the browser's localStorage following a privacy-first approach. The application does not require a backend server for basic functionality, though optional cloud sync features could be added in the future.

## Contributing

We welcome contributions to the Easy Risk Register project. Please read our contributing guidelines for more information.