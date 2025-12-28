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

### PDF export viewer and CSP

The PDF export flow uses a dedicated report viewer page:

- `easy-risk-register-frontend/public/report.html`
- `easy-risk-register-frontend/public/report.js`

This design exists because CSP includes `script-src-attr 'none'` (inline event handler attributes are blocked) and production CSP does not allow `unsafe-inline` scripts. The report viewer loads the generated report HTML into an iframe and calls `print()` from a same-origin script file, keeping the export workflow CSP-compliant.

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

CSV export also includes spreadsheet injection protection:

- Exported cells are generated via PapaParse with `escapeFormulae` enabled, which escapes values that begin with `=`, `+`, `-`, or `@`

## Server-backed security architecture

Easy Risk Register is an online-first app:

- Core risk data is stored in Supabase Postgres and accessed via `/api/*` serverless functions.
- The browser authenticates with Supabase Auth and sends an end-user Bearer token to `/api/*`.
- Serverless APIs verify the end-user token and call Supabase using the **anon key + the user's JWT**, so **RLS policies** remain the primary enforcement mechanism.

See `docs/guides/security/auth-workspace-scoping-baseline.md` for the end-to-end flow.

### Search/filter safety (no dynamic regex)

Search and filtering are implemented using simple string comparisons (`.includes()` on lowercased text) rather than dynamically-constructed regular expressions. This avoids regex-injection risks and reduces the likelihood of catastrophic backtracking from user-provided input.

### SQL injection vs. practical risks in this repo

This repo does use a database (Supabase Postgres), but the API layer does not construct raw SQL strings. The more relevant risks to manage are:

- **Authorization/RLS mistakes** (incorrect workspace scoping or bypassing RLS).
- **XSS** in any web UI (mitigated via sanitization + CSP).
- **CSV/spreadsheet injection** during export/import (mitigated via validation + export escaping).

## Client-Side Encryption Limitations

The optional encrypted storage feature is a defense-in-depth measure for data at rest in browser storage (currently: locally persisted UI state), not a protection against active script execution:

- Client-side encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- The encryption key is derived from a user passphrase and kept in memory for the session; it primarily protects against casual/local inspection of storage at rest.
- If the passphrase is forgotten, there is no recovery; the user must delete local data on that device.

For full details, see `docs/architecture/secure-data-storage.md`.

## Security Testing

Security-relevant behaviors are covered by tests under `easy-risk-register-frontend/test/`, including sanitization and CSV validation utilities.
