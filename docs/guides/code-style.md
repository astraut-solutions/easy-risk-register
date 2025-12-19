# Code Style Guidelines

This document outlines the coding standards and best practices for the Easy Risk Register project.

## TypeScript/JavaScript Style

### General Guidelines
- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Use functional React components with hooks
- Keep components small and focused (single responsibility principle)
- Use meaningful variable and function names
- Prefer const over let when possible
- Use strict equality (===) and inequality (!==) checks

### Naming Conventions
- Use camelCase for variables and functions: `riskScore`, `calculateProbability`
- Use PascalCase for components and types: `RiskCard`, `RiskInput`
- Use UPPER_SNAKE_CASE for constants: `MAX_RISK_SCORE`
- Use descriptive names that clearly indicate purpose
- Boolean variables should use is, has, or can prefixes: `isVisible`, `hasError`

### File Structure
- Organize files by feature/functionality
- Keep related files together in the same directory
- Use index.ts files to control exports from directories
- Separate types into dedicated files when they're reused across modules

## React Component Patterns

### Functional Components
- Use functional components with hooks
- Keep components focused on a single responsibility
- Use React.memo for components that render frequently with the same props
- Extract complex logic into custom hooks

### State Management
- Use Zustand for global state management
- Use React hooks (useState, useEffect, etc.) for component-local state
- Keep state structure simple and normalized
- Use selectors to derive computed values from state

## Testing Style

### Test Structure
- Follow the AAA pattern: Arrange, Act, Assert
- Use descriptive test names that explain the expected behavior
- Group related tests using describe blocks
- Keep test data organized and reusable
- Test both positive and negative scenarios

### Test Organization
- Keep tests under `easy-risk-register-frontend/test/` and group by area (components, stores, utils, services, integration)
- Use .test.ts or .test.tsx extensions for test files
- Mock external dependencies when necessary
- Test business logic thoroughly, especially risk calculations

## Accessibility Standards

### General Principles
- Follow WCAG 2.1 AA standards
- Ensure proper semantic HTML structure
- Include appropriate ARIA attributes when needed
- Use proper heading hierarchy (h1, h2, h3, etc.)
- Ensure sufficient color contrast ratios

### Component Implementation
- All interactive elements should be keyboard accessible
- Provide meaningful labels for form inputs
- Use landmark roles (main, nav, aside) appropriately
- Include focus indicators for keyboard navigation

## Performance Considerations

### React Performance
- Use React.memo for components that render frequently with same props
- Implement proper key props for list items
- Use React.lazy and Suspense for code splitting when appropriate
- Optimize expensive calculations with useMemo and useCallback

### Bundle Size
- Import only the functions you need from large libraries
- Consider tree-shaking implications when adding new dependencies
- Keep component bundle size reasonable

## Error Handling

### General Approach
- Handle errors gracefully with appropriate user feedback
- Log errors appropriately for debugging
- Use error boundaries for catching component errors
- Provide meaningful error messages to users

## Documentation Standards

### Code Comments
- Add JSDoc comments for exported functions and components
- Comment complex or non-obvious logic
- Keep comments updated when code changes
- Use comments to explain "why" not "what" when code is self-explanatory

### Component Documentation
- Include prop types and descriptions
- Document default values for optional props
- Provide usage examples for complex components
