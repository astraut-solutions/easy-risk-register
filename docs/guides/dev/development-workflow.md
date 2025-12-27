# Development Workflow

This document outlines the standard development workflow for the Easy Risk Register project.

## Standard Development Process

### 1. Setting up the Development Environment
- Follow the instructions in the [Setup Guide](setup.md) to get your local development environment running
- Make sure you can run the application successfully before starting development

### 2. Working on Features
- Create a new branch for each feature or bug fix
- Follow the coding standards described in the [Code Style Guidelines](code-style.md)
- Write code that follows the existing patterns in the codebase
- Add tests for new functionality

### 3. Code Quality
- Run the TypeScript compiler to check for type errors: `npm run build`
- Run linting: `cd easy-risk-register-frontend && npm run lint`
- Run tests: `cd easy-risk-register-frontend && npm run test:run`
- Test your changes manually in the browser

### 4. Commit and Push
- Write clear, descriptive commit messages
- Follow conventional commits format when possible
- Push your changes to your fork/branch

### 5. Pull Request Process
- Open a pull request to the main repository
- Fill out the pull request template with details about your changes
- Link any related issues
- Wait for code review and address feedback

## Development Commands

### From the project root

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the frontend dev server |
| `npm run build` | Build the frontend for production |
| `npm run dev:docker` | Start the dev container (Compose profile `development`) |
| `npm run prod:docker` | Start the production container |

### From `easy-risk-register-frontend/`

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck + build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run tests (watch) |
| `npm run test:run` | Run tests once |
| `npm run lint` | Run the linter |

## Code Review Process

All pull requests must be reviewed by at least one other contributor before merging. Code reviews focus on:
- Correctness of the implementation
- Adherence to coding standards
- Performance considerations
- Test coverage
- Documentation updates
- Code maintainability

## Continuous Integration

The project uses automated testing to ensure code quality. All tests must pass before a pull request can be merged.
