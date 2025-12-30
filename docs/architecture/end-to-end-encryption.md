# End-to-end encryption (selected fields)

Easy Risk Register supports optional end-to-end encryption (E2EE) for a small set of **high-sensitivity fields**.

## Crypto posture (client-side only)

- **KDF**: PBKDF2 (SHA-256) to derive an encryption key from a user-provided passphrase.
- **Cipher**: AES-GCM.
- **No server-side recovery**: the backend/database never receives, stores, or can derive plaintext for E2EE-protected fields.

The server treats encrypted values as **opaque ciphertext + metadata** and does not attempt to encrypt/decrypt them.

## Sensitive fields (Phase 4: initial scope)

When E2EE is enabled in the client, the following risk fields are encrypted:

- `risks.description`
- `risks.mitigation_plan` (API name: `mitigationPlan`)

All other fields required for normal list/filter UX remain plaintext (e.g., `title`, `category`, `status`, `probability`, `impact`).

## Storage format

- Ciphertext + metadata is stored in `public.risks.encrypted_fields` (JSONB).
- Plaintext for encrypted fields should be omitted/empty in API requests when `encryptedFields` is present.

## Backend handling

- `/api/risks` and `/api/risks/:id` accept and return `encryptedFields` and treat it as opaque.
- Request bodies are size-limited to reduce DoS risk; encrypted payloads are additionally bounded at the `encryptedFields` level.

