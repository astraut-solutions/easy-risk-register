# Security Policy

## Overview

Easy Risk Register is a privacy-focused risk management application that prioritizes security and data protection. As a client-side application, all data is stored locally in the user's browser with no server transmission by default, providing inherent security benefits.

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

### Data Encryption

Persisted risk data can be encrypted in browser local storage:
- Uses AES-GCM encryption with 256-bit keys via the Web Crypto API (when available)
- Each encryption operation uses a randomly generated 12-byte initialization vector (IV)
- Encrypted values are stored as base64 of `IV || ciphertext`
- The encryption key is stored in LocalStorage under `easy-risk-register-key` (base64-encoded raw key material)
- When Web Crypto is unavailable, the app falls back to unencrypted LocalStorage (and uses in-memory storage during SSR)

Limitations / threat model notes:
- Client-side encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- The encryption key is stored in LocalStorage alongside encrypted data, so an attacker who can read LocalStorage can read both the ciphertext and the key material.

For details, see `docs/architecture/secure-data-storage.md`.

### CSV Import Security

The CSV import functionality includes security measures:
- Uses the `papaparse` library for secure CSV parsing instead of regex-based splitting
- Validates against CSV injection patterns that start with `=`, `+`, `-`, or `@`
- All imported data is processed through the same sanitization as manual entries

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
