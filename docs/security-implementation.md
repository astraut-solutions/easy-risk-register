# Security Implementation

This document outlines the security measures implemented in the Easy Risk Register application to protect against common web vulnerabilities.

## Content Security Policy (CSP)

The application implements a Content Security Policy (CSP) to reduce the risk of XSS (Cross-Site Scripting) and other code injection attacks. The CSP is implemented via a meta tag in `easy-risk-register-frontend/index.html` with the following directives:

- `default-src 'self'` - Restricts all resources to same-origin by default
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Allows scripts from same origin and inline/eval scripts (needed for React/Vite tooling)
- `style-src 'self' 'unsafe-inline'` - Allows stylesheets from same-origin and inline styles
- `img-src 'self' data: https:` - Allows images from same origin, data URLs, and HTTPS sources
- `font-src 'self' data:` - Allows fonts from same-origin and data URLs
- `connect-src 'self' http: https:` - Allows fetch/XHR/WebSocket connections to same origin and HTTP/HTTPS
- `media-src 'self'` - Restricts media to same origin
- `object-src 'none'` - Blocks plugins like Flash
- `frame-src 'self'` - Allows frames from same origin
- `frame-ancestors 'none'` - Prevents the page from being framed (clickjacking protection)
- `base-uri 'self'` - Restricts the base URI
- `form-action 'self'` - Restricts form submissions to same origin

Note: the current CSP includes `unsafe-inline` and `unsafe-eval`. For stricter production hardening, consider migrating to nonce/hash-based CSP.

## Input Sanitization

The application sanitizes user-provided input to reduce the risk of XSS and other injection vulnerabilities.

### HTML Sanitization Library

Sanitization is implemented with `isomorphic-dompurify` in `easy-risk-register-frontend/src/utils/sanitization.ts`.

The DOMPurify configuration:

- Allows a small set of safe formatting elements (for example `p`, `strong`, `em`, lists, headings, `pre`, `code`)
- Strips all attributes by default (`ALLOWED_ATTR: []`)
- Explicitly forbids dangerous tags (for example `script`, `iframe`, `form`) and attributes (for example `src`, `href`, `on*`)

### Sanitized Input Fields

Risk text fields are sanitized before being persisted:

- `title`
- `description`
- `mitigationPlan`
- `category`

Length validation is applied and oversized fields are truncated as a fallback.

### CSV Import Security

CSV import is validated and sanitized:

- CSV content is validated to reduce spreadsheet formula injection (`=`, `+`, `-`, `@`)
- Imported values are trimmed and passed through the same sanitization pipeline as manual entries

## Client-Side Security Architecture

As a client-side only application:

- All data is stored locally in browser storage with no server transmission by default
- No external API calls are required for core functionality
- Sanitization is applied before persistence to reduce the risk of storing malicious content

## Security Testing

Security-relevant behaviors are covered by tests under `easy-risk-register-frontend/test/`, including sanitization and CSV validation utilities.

