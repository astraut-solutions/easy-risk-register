// vitest.setup.ts
// Setup file for Vitest

// For React 19 compatibility with testing-library
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

// Ensure jsdom is reset between tests to prevent cross-test bleed
afterEach(() => {
  cleanup()
})

// React 19 compatibility fix - ensure act is available
import React from 'react'

// Add React to the global scope to ensure act is available
// @ts-ignore - adding React for compatibility
globalThis.React = React

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage if needed
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => {}),
    removeItem: vi.fn(() => {}),
    clear: vi.fn(() => {}),
  },
  writable: true,
})

// Mock sessionStorage if needed
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => {}),
    removeItem: vi.fn(() => {}),
    clear: vi.fn(() => {}),
  },
  writable: true,
})

// jsdom's requestSubmit is missing/unimplemented; force a polyfill so form submissions behave in tests.
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  configurable: true,
  value: function requestSubmit(this: HTMLFormElement) {
    this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  },
})
