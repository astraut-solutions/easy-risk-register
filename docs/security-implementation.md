# Security Implementation

This document outlines the security measures implemented in the Easy Risk Register application to protect against common web vulnerabilities.

## Content Security Policy (CSP)

The application implements a Content Security Policy (CSP) to reduce the risk of XSS (Cross-Site Scripting) and other code injection attacks.

For production deployments, CSP is set via **HTTP response headers** at the hosting layer:
- **Vercel**: `vercel.json` adds a CSP header for all routes.
- **Docker (production)**: `easy-risk-register-frontend/server.mjs` serves the built app and sets a per-request nonce-based CSP header.

For local development, the Vite dev server adds a more permissive CSP header (see `easy-risk-register-frontend/vite.config.ts`) to support dev tooling.

Core directives:

- `default-src 'self'` - Restricts all resources to same-origin by default
- `script-src 'self'` (production) - Allows scripts from same origin (no `unsafe-inline` / `unsafe-eval`)
- `script-src 'self' 'unsafe-eval'` (development) - Allows eval used by some dev tooling (avoid in production)
- `script-src-attr 'none'` - Disallows inline event handler attributes
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

Note: the Docker production server sets a per-request script nonce in the CSP header to support nonce-based allowlisting without enabling `unsafe-inline`.

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

Length validation is applied and oversized fields are truncated as a fallback:

- `title`: 200 characters
- `description`: 5000 characters
- `mitigationPlan`: 5000 characters
- `category`: 100 characters

### CSV Import Security

CSV import is validated and sanitized:

- CSV content is validated to reduce spreadsheet formula injection (`=`, `+`, `-`, `@`)
- Imported values are trimmed and passed through the same sanitization pipeline as manual entries
- The UI shows a user-facing message when no risks are imported (for example when validation fails)

## Client-Side Security Architecture

As a client-side only application:

- All data is stored locally in browser storage with no server transmission by default
- No external API calls are required for core functionality
- Sanitization is applied before persistence to reduce the risk of storing malicious content

## Client-Side Encryption Limitations

The optional encrypted storage feature is a defense-in-depth measure for data at rest in browser storage, not a protection against active script execution:

- Client-side encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- The encryption key is stored in LocalStorage alongside encrypted data, so an attacker who can read LocalStorage can read both the ciphertext and the key material.

For full details, see `docs/architecture/secure-data-storage.md`.

## Security Testing

Security-relevant behaviors are covered by tests under `easy-risk-register-frontend/test/`, including sanitization and CSV validation utilities.
