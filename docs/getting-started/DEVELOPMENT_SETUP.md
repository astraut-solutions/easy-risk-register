# Easy Risk Register - Development Environment Setup

This project provides a complete setup for local development of the Easy Risk Register application. The architecture follows a client-side-only approach using React, TypeScript, and modern web technologies while prioritizing user privacy.

## Prerequisites

- Node.js 20.x or higher
- npm 8.x or higher
- Docker Desktop (optional, for containerized development)
- Git

## Quick Start

### Option 1: Direct Node.js Development (Recommended for quick setup)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd easy-risk-register
   ```

2. Run the setup script:
   ```bash
   # On Windows
   ./setup-dev.bat
   
   # On Linux/Mac
   ./setup-dev.sh
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
   npm run dev:docker
   ```
   Or directly:
   ```bash
   docker-compose --profile development up --build frontend-dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

- `easy-risk-register-frontend/` - Main React application built with Vite + TypeScript
- `project-documentation/` - Architecture and design documentation
- `design-documentation/` - UI/UX design documentation
- `docker-compose.yml` - Docker configuration with services for both development and production
- `.env` - Environment variables for local development
- `DEVELOPMENT.md` - Detailed development guidelines in the frontend directory

## Environment Configuration

The application includes environment configuration files:

- `.env.example` - Template with all available environment variables
- `.env` - Your local environment configuration (git-ignored)

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

- **Frontend**: React 19.1.1 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Data Storage**: Browser LocalStorage/IndexedDB (no server dependencies)
- **Build Tool**: Vite

For detailed architecture information, see: `project-documentation/architecture-output.md`

## Development Guidelines

### Component Development
- Use TypeScript interfaces for all component props
- Follow accessibility best practices (WCAG 2.1 AA)
- Use Tailwind CSS utility classes for styling
- Implement proper error boundaries
- Ensure responsive design for all screen sizes

### State Management
- Use Zustand stores for global application state
- Keep state normalized and efficient
- Implement optimistic updates where appropriate
- Handle data loading and error states properly

### Data Handling
- All data stored in browser LocalStorage/IndexedDB by default
- Implement proper serialization/deserialization
- Include data validation and sanitization
- Plan for potential cloud sync (PocketBase integration)

## Testing

The application includes unit testing capabilities:

1. Run tests:
   ```bash
   cd easy-risk-register-frontend
   npm test
   ```

2. Run tests in watch mode:
   ```bash
   cd easy-risk-register-frontend
   npm test -- --watch
   ```

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

## DevOps & Deployment

### Local Development to Production

1. **Development**: Use `npm run dev` for rapid iteration
2. **Testing**: Run tests and linting before committing
3. **Staging**: Build and test the production bundle locally
4. **Production**: Deploy the built `dist` folder to your hosting service

### Docker Production Deployment

For production deployment using Docker:

```bash
docker-compose up --build
```

This uses the production Dockerfile and serves the application via a static file server.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run build` to ensure code quality
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Security Notes

- All data remains on the user's device by default
- Input sanitization is implemented for all user entries
- Content Security Policy prevents XSS attacks
- The application has no external dependencies by default for privacy

## Getting Help

- Check the `DEVELOPMENT.md` file in the frontend directory for detailed development guidelines
- Review the architecture documentation in `project-documentation/`
- Open an issue in the repository for bugs or feature requests

---

For more information about the application features and functionality, please see the main README.md file.