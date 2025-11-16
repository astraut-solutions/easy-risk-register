# Easy Risk Register - Local Development Setup

This document describes how to set up and run the Easy Risk Register frontend application for local development.

## Prerequisites

- Node.js 20.x or higher
- npm 8.x or higher
- Docker Desktop (optional, for containerized development)
- Git

## Quick Start with Node.js

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

## Development with Docker

### Using Docker Compose (Recommended)

1. Ensure you're at the project root directory:
   ```bash
   cd easy-risk-register  # (project root)
   ```

2. Build and start the development environment:
   ```bash
   docker-compose --profile development up --build frontend-dev
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

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `development` for local development
- `VITE_PORT`: Port number for the development server (default: 5173)
- `VITE_POCKETBASE_URL`: URL for optional PocketBase cloud sync (future feature)
- `VITE_ENABLE_EXPORT`: Enable/disable CSV export functionality (default: true)
- `VITE_ENABLE_IMPORT`: Enable/disable CSV import functionality (default: true)
- `VITE_ENABLE_CLOUD_SYNC`: Enable/disable cloud sync feature (default: false)
- `VITE_ANALYTICS_ENABLED`: Enable/disable analytics (default: false)

Copy `.env.example` to `.env` to customize these values:

```bash
cp .env.example .env
```

## Available Scripts

In the `easy-risk-register-frontend` directory, you can run:

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run preview` - Locally preview the production build
- `npm run lint` - Lints the codebase

## Project Architecture

This application follows a client-side-only architecture with no server dependencies. All data is stored in browser LocalStorage/IndexedDB, emphasizing user privacy.

### Directory Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── stores/         # Zustand stores for state management
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── services/       # Business logic and service layer
```

### Tech Stack

- React 19.1.1 with TypeScript
- Vite 7.1.7 as the build tool
- Zustand for state management
- Tailwind CSS for styling
- React Hook Form for forms
- Framer Motion for animations

## Development Guidelines

### Component Development

Components should follow these patterns:
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Follow accessibility best practices
- Use Tailwind CSS for styling

### State Management

- Use Zustand stores for global state
- Keep state normalized and efficient
- Implement proper error handling
- Follow the store patterns defined in the architecture

### Data Persistence

- All data is stored in browser LocalStorage/IndexedDB
- Implement proper serialization/deserialization
- Handle data migration for schema changes
- Validate data integrity on load

## Testing

Run unit tests with Jest (once configured):
```bash
npm test
```

## Production Build

To create a production build:
```bash
npm run build
```

This will create an optimized build in the `dist` directory.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `vite.config.ts` or terminate the process using the port
2. **Dependency conflicts**: Run `npm install` to reinstall dependencies
3. **Hot reload not working**: Restart the development server
4. **TypeScript errors**: Run `npm run build` to identify type issues

### Performance Tips

- Use React.memo() for components that render frequently
- Implement proper key props for lists
- Use lazy loading for non-critical components
- Optimize images and assets