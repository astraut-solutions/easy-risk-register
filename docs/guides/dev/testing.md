# Testing Guide

This document explains how to run and write tests for the Easy Risk Register project.

## Running Tests

The project uses [Vitest](https://vitest.dev/). For the current commands and dev/CI workflows, see the `## Testing` section in `README.md`.

## Test Structure

Tests live in `easy-risk-register-frontend/test/`, grouped by area:

- `test/stores/` - State management tests (Zustand stores)
- `test/utils/` - Utility unit tests (e.g., calculations, sanitization)
- `test/services/` - Service-layer tests
- `test/components/` - Component tests (React)
- `test/integration/` - End-to-end-ish integration coverage

## Writing Tests

When adding new features, please follow these testing guidelines:

1. Write unit tests for store logic and utility functions
2. Use descriptive test names that explain the expected behavior
3. Follow the AAA pattern: Arrange, Act, Assert
4. Mock external dependencies when necessary
5. Test both positive and negative scenarios

## Test Coverage

Coverage expectations and focus areas are documented in `README.md`.
