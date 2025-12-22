# Security Improvements Checklist

This checklist maps the “Security Improvements Report” items to the current Easy Risk Register implementation.

## Done (Implemented)

### CSP hardening
- [x] Replace `script-src 'unsafe-inline' 'unsafe-eval'` with a nonce/hash-based CSP for production deployments.
- [x] Prefer setting CSP via HTTP response headers at the hosting layer (meta-based CSP is easier to bypass in some threat models).

### Input sanitization hardening
- [x] Sanitize user-provided text with `isomorphic-dompurify` (`easy-risk-register-frontend/src/utils/sanitization.ts`).
- [x] Allowlist safe HTML tags and strip all attributes by default.
- [x] Forbid dangerous tags including `form`, `input`, `button`, `select`, `textarea`, `iframe`, `script`, `meta`, `base`.
- [x] Forbid dangerous attributes including `src`, `href`, `on*`, `data*`, `form*`, `action`, `method`, `enctype`, `autocomplete`.
- [x] Enforce field-specific max lengths (with truncation fallback):
  - [x] `title`: 200
  - [x] `description`: 5000
  - [x] `mitigationPlan`: 5000
  - [x] `category`: 100

### CSV injection protection + feedback
- [x] Validate imported CSV content for formula-injection patterns (`validateCSVContent()`).
- [x] Block import when validation fails (`easy-risk-register-frontend/src/stores/riskStore.ts`).
- [x] Provide user-facing feedback when nothing is imported (alert in `easy-risk-register-frontend/src/App.tsx`).

### Error handling / diagnostics
- [x] Console warnings when truncating oversized fields (`easy-risk-register-frontend/src/utils/sanitization.ts`).
- [x] Console error when CSV validation fails (`easy-risk-register-frontend/src/stores/riskStore.ts`).

### Storage protection (optional encryption)
- [x] AES-GCM encryption for persisted state when Web Crypto is available.
- [x] Fallback to unencrypted LocalStorage if Web Crypto is unavailable, and in-memory storage during SSR.
- [x] Tests exist for sanitization, CSV validation, and encryption utilities (`easy-risk-register-frontend/test/utils/`).

## To do (Recommended hardening)

### CSV UX and robustness
- [ ] Replace `alert()` with an in-app notification/toast pattern for better UX.
- [ ] Consider returning structured import results (e.g., `{ imported, reason }`) so the UI can distinguish "invalid CSV" from "valid but empty/mismatched CSV".

### Threat model
- [ ] Document limitations clearly: client-side encryption does not protect against XSS / same-origin code execution, and the key material is stored alongside ciphertext in LocalStorage.
