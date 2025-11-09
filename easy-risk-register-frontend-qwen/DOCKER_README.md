# Easy Risk Register - Frontend Docker Setup

This document describes how to containerize and run the Easy Risk Register frontend using Docker.

## Overview

The Easy Risk Register frontend is a React application built with Vite and TypeScript. The application operates entirely client-side with data stored in browser LocalStorage/IndexedDB, emphasizing user privacy.

## Docker Files

- `Dockerfile`: Production build that creates an optimized static build served by a simple server
- `Dockerfile.dev`: Development build with hot reloading for faster development cycles

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- At least 2GB free disk space
- 4GB RAM recommended for optimal build performance

## Development Setup with Docker

### Using Docker Compose (Recommended)

1. Navigate to the project root directory
2. Build and start the development environment:
   ```bash
   docker-compose up --build
   ```
3. Access the application at `http://localhost:5173`
4. The application will automatically reload when you make code changes

### Using Docker directly

1. Navigate to the frontend directory:
   ```bash
   cd easy-risk-register-frontend
   ```
2. Build the development image:
   ```bash
   docker build -f Dockerfile.dev -t easy-risk-register-frontend-dev .
   ```
3. Run the development container:
   ```bash
   docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules easy-risk-register-frontend-dev
   ```

## Production Build with Docker

### Using the Production Dockerfile

1. Navigate to the frontend directory:
   ```bash
   cd easy-risk-register-frontend
   ```
2. Build the production image:
   ```bash
   docker build -t easy-risk-register-frontend .
   ```
3. Run the production container:
   ```bash
   docker run -p 8080:8080 easy-risk-register-frontend
   ```
4. Access the application at `http://localhost:8080`

## Architecture Notes

Based on the system architecture:
- The frontend is a privacy-focused client-side application
- All data is stored in browser LocalStorage/IndexedDB
- No server dependencies for basic functionality
- Optional cloud sync available via PocketBase (future feature)

## Technology Stack

- React 19.1.1 with TypeScript
- Vite 7.1.7 as the build tool
- Zustand for state management
- Tailwind CSS for styling
- React Router for navigation
- Framer Motion for animations

## Vite Configuration

The application uses Vite's build system as specified in `vite.config.ts`:
- Plugin: React
- Optimized for client-side application
- Static site generation for production builds

## Security Considerations

- Content Security Policy implemented to prevent XSS
- Input sanitization for all user-entered data
- Client-side only data storage by default
- No external API calls in basic mode (privacy-focused)

## Performance Optimization

- Bundle splitting as configured in vite.config.ts
- Static asset optimization
- Lazy loading for components
- Memoization for expensive calculations