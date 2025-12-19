# Easy Risk Register Setup Guide

This guide covers all setup options for the Easy Risk Register application, from quick frontend setup to comprehensive development environment configuration.

## Prerequisites

- Node.js 18.x or higher
- npm (or yarn)
- Git
- Docker Desktop (optional, for containerized development)

## Quick Frontend Setup

For a quick start with the frontend application:

1. Navigate to the frontend directory:
   ```bash
   cd easy-risk-register-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Comprehensive Development Setup

### Option 1: Direct Node.js Development (Recommended for quick setup)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd easy-risk-register
   ```

2. Run the setup script:
   ```bash
   # On Windows
   ./scripts/setup-dev.bat

   # On Linux/Mac
   ./scripts/setup-dev.sh
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Or directly:
   ```bash
   cd easy-risk-register-frontend
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Option 2: Docker Development (Recommended for consistent environment)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd easy-risk-register
   ```

2. Build and start the development environment:
   ```bash
   docker compose --profile development up --build frontend-dev
   ```
   > If your system uses the legacy `docker-compose` binary, replace `docker compose` with `docker-compose`.

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

- `easy-risk-register-frontend/` - Main React application built with Vite + TypeScript
- `docs/` - Documentation organized by category
- `scripts/` - Helper scripts for common operations
- `docker-compose.yml` - Docker configuration with services for both development and production
- `.env` - Environment variables for local development

## Environment Configuration

The application includes environment configuration files:

- `easy-risk-register-frontend/.env.example` - Template with available environment variables
- `easy-risk-register-frontend/.env` - Your local environment configuration (git-ignored)

The setup process automatically creates a `.env` file from the example if one doesn't exist.

## Available Scripts

From the project root:

- `npm run setup` - Install dependencies and prepare development environment
- `npm run dev` - Start the development server
- `npm run dev:docker` - Start development environment with Docker
- `npm run build` - Create a production build of the frontend
- `npm run install` - Install frontend dependencies

## Architecture Overview

The Easy Risk Register follows a client-side architecture:

- **Frontend**: React + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Data Storage**: Browser LocalStorage (no server dependencies)
- **Build Tool**: Vite

For detailed architecture information, see [Architecture Diagrams](../architecture/architecture-diagrams.md).

## Production Build

To create a production-ready build:

```bash
npm run build
```

This creates an optimized build in `easy-risk-register-frontend/dist` that can be deployed to any static hosting service.

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 5173 is unavailable, update `vite.config.ts` or terminate the conflicting process
2. **Dependency conflicts**: Clean install with `npm ci` in the frontend directory
3. **Hot reload not working**: Restart the development server or check file permissions
4. **TypeScript errors**: Run `npm run build` in the frontend to identify type issues

### Performance Tips

- Use React.memo() for components that render frequently
- Implement proper key props for lists and dynamic content
- Use lazy loading for non-critical components
- Optimize images and assets
- Implement proper cleanup for effects and event listeners
