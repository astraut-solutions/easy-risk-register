# Testing Guide

This document explains how to run and write tests for the Easy Risk Register project.

## Running Tests

The project uses [Vitest](https://vitest.dev/) for testing. You can run tests using the following commands:

### Run all tests once:
```bash
npm run test:run
```

### Run all tests in watch mode:
```bash
npm run test
```

### Run specific test file:
```bash
npx vitest riskStore.test.ts
```

## Available Test Scripts

- `npm run test` - Run Vitest in watch mode (for development)
- `npm run test:run` - Run all tests once (for CI/verification)

## Test Structure

Tests are located alongside the code they test or in a dedicated test file. The project currently has:

- `riskStore.test.ts` - Tests for the risk store functionality (Zustand store)

## Writing Tests

When adding new features, please follow these testing guidelines:

1. Write unit tests for store logic and utility functions
2. Use descriptive test names that explain the expected behavior
3. Follow the AAA pattern: Arrange, Act, Assert
4. Mock external dependencies when necessary
5. Test both positive and negative scenarios

## Test Coverage

Aim for at least 80% test coverage for business logic, especially for:
- Risk calculations (probability × impact)
- Risk store operations (add, update, delete)
- Data import/export functionality
- Filtering and search functionality