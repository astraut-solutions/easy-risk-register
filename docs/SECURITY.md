# Security Policy

## Overview

Easy Risk Register is a privacy-focused risk management application that prioritizes security and data protection. Core risk register data is stored in **Supabase (Postgres)** and accessed via **serverless APIs** (`/api/*`). Workspace scoping is enforced by Supabase **Row Level Security (RLS)**.

## Security Measures

### Content Security Policy (CSP)

The application implements a Content Security Policy to reduce the risk of XSS (Cross-Site Scripting) and other code injection attacks. For production deployments, CSP is set via **HTTP response headers** at the hosting layer (header-based CSP is harder to bypass than a meta-based CSP in some threat models).

Current hosting-layer CSP implementations:
- **Vercel**: `vercel.json` sets a strict header for all routes (no `unsafe-inline` / `unsafe-eval`).
- **Docker (production)**: `easy-risk-register-frontend/server.mjs` serves the built app and sets a per-request **nonce-based** CSP header.
- **Local development**: `easy-risk-register-frontend/vite.config.ts` sets a dev CSP header (includes `unsafe-eval` to support Vite dev tooling).

The CSP directives include:
- `default-src 'self'`
- `script-src 'self'` (production) / `script-src 'self' 'unsafe-eval'` (development)
- `style-src 'self' 'unsafe-inline'` (to support inline styles used by some UI libraries)
- `img-src 'self' data: https:`
- `font-src 'self' data:`
- `connect-src 'self' http: https:`
- `media-src 'self'`
- `object-src 'none'`
- `frame-src 'self'`
- `frame-ancestors 'none'`
- `base-uri 'self'`
- `form-action 'self'`

For more detail, see `docs/security-implementation.md`.

### Input Sanitization

The application implements comprehensive input sanitization to prevent XSS attacks:
- User-provided text is sanitized using `isomorphic-dompurify` (`easy-risk-register-frontend/src/utils/sanitization.ts`)
- A small allowlist of safe formatting tags is permitted (for example `<p>`, `<strong>`, `<em>`, lists, headings, `<pre>`, `<code>`)
- Attributes are stripped by default and dangerous tags/attributes are explicitly forbidden
- Risk inputs are sanitized before persistence and oversized fields are truncated as a fallback

Search/filter logic uses simple string matching (not dynamically-constructed regular expressions) to avoid regex-related injection risks.

### Data Encryption

The app includes optional passphrase-based encryption for the **local persisted UI state** (optional, user-enabled):
- Uses browser crypto APIs (no custom crypto): PBKDF2 (SHA-256) to derive an AES-GCM key from a user passphrase
- AES-GCM uses a randomly generated 12-byte initialization vector (IV) per encryption
- Encrypted values are stored as a JSON payload (`{ v: 1, ivB64, ctB64 }`) under the persisted store key
- The derived key is kept **in memory for the current session** (the passphrase/key material is not stored)
- If the passphrase is forgotten, there is no recovery; the user must delete local data on that device
- When Web Crypto is unavailable, encryption is unavailable and the app falls back to unencrypted LocalStorage (and uses in-memory storage during SSR)

Limitations / threat model notes:
- Client-side encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- It primarily protects against casual/local inspection of browser storage at rest; it does not protect a compromised browser profile or device.

For details, see `docs/architecture/secure-data-storage.md`.

### CSV Import/Export Security

The CSV import functionality includes security measures:
- Uses the `papaparse` library for secure CSV parsing instead of regex-based splitting
- Validates against CSV injection patterns that start with `=`, `+`, `-`, or `@`
- All imported data is processed through the same sanitization as manual entries

The CSV export functionality also includes security measures:
- Uses PapaParse CSV generation with `escapeFormulae` enabled to prevent spreadsheet formula injection on exported cells

### Why SQL injection is not applicable

This repo does use a database (Supabase Postgres), but the API layer does not construct raw SQL strings. The more relevant risks in practice are authorization/RLS mistakes, XSS, and CSV/spreadsheet injection.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes (Current)   |

## Security Best Practices for Users

### Data Protection
- Use strong, unique passwords for any accounts associated with your risk register
- Regularly backup your risk data to prevent loss
- Be cautious about sharing exported CSV files containing sensitive risk information

### Browser Security
- Keep your browser updated to the latest version
- Use browsers that support modern security features
- Clear browser data periodically if sharing devices
- Be aware that browser storage may be accessible to other applications running on the same device

## Compliance

The Easy Risk Register application has been designed to:
- Protect sensitive business risk data with optional client-side encryption (when supported by the browser)
- Minimize data exposure by storing information locally
- Implement web security best practices to prevent common vulnerabilities
- Support accessibility standards while maintaining security

## Security Updates

Security updates are released as part of regular application updates. Users should:
- Keep the application updated to the latest version
- Review release notes for security-related changes
- Follow best practices for browser security
