# E2EE verification: threat model + recovery flows

This document validates the **end-to-end encryption (selected fields)** feature from `TASK_PLAN.md`.

## Scope

- E2EE covers selected risk fields only: `description` and `mitigationPlan`.
- Encryption is **client-side only**; the backend stores ciphertext + metadata and cannot recover plaintext.
- This document is about security expectations and operational recovery flows (passphrase loss/rotation), not UI polish.

## Threat model (high-level)

### Assets

- Plaintext values for encrypted fields (`description`, `mitigationPlan`).
- E2EE passphrase (entered by the user).
- Derived encryption key (kept in memory only for the session).

### Trust boundaries

- Browser: trusted only while the origin is uncompromised.
- Server/database: untrusted for plaintext of encrypted fields (stores only ciphertext/metadata).
- Logs/telemetry: must be treated as potentially accessible by operators; must not contain plaintext.

### Key threats and mitigations

- **Database compromise**: attacker reads ciphertext only (no server-side recovery). Mitigation: PBKDF2 + AES-GCM; no plaintext stored server-side for protected fields.
- **Server logs leak plaintext**: mitigate by never logging request bodies; treat `encryptedFields` as opaque; keep error logging metadata-only.
- **Client telemetry leak plaintext**: mitigate by redacting sensitive props before storing/logging analytics events.
- **XSS / same-origin script execution**: E2EE does not protect against an attacker who can execute JS in the origin (they can read plaintext after decrypt). Mitigate via CSP + sanitization; treat E2EE as “at rest in DB” protection, not runtime protection.
- **Lost passphrase**: no recovery. Mitigate via UI warnings and a destructive “disable/wipe” UX.

## Recovery-flow validation (manual)

Prerequisites:

- Signed-in user with a workspace.
- At least one risk record with non-empty `description` and `mitigationPlan`.

### 1) Enable E2EE and verify ciphertext-at-rest behavior

1. In Settings, enable E2EE and set a passphrase.
2. Wait for the migration/encryption process to complete.
3. Refresh the page.
4. Confirm:
   - The app prompts to unlock (or shows locked placeholders).
   - After unlocking, descriptions and mitigation plans display normally.

Expected:

- Without unlocking, E2EE fields are not visible (placeholders).
- With unlocking, plaintext renders from client-side decrypt.

### 2) Passphrase loss (no recovery)

1. Enable E2EE and ensure at least one encrypted risk exists.
2. On the same device, clear only the E2EE config (or use a new device/browser profile).
3. Attempt to unlock with an incorrect passphrase.

Expected:

- Unlock fails; encrypted fields remain inaccessible.
- No UI offers a “recover” path; only options are “unlock with correct passphrase” or “disable (decrypt) if unlocked elsewhere”.

### 3) Rotation (happy path)

1. Unlock E2EE.
2. Rotate passphrase.
3. Confirm re-encryption completes.
4. Refresh the page.
5. Confirm the old passphrase no longer unlocks; the new passphrase unlocks.

Expected:

- Encrypted fields remain accessible after unlocking with the new passphrase.
- No plaintext is stored in server logs or telemetry during rotation.

### 4) Disable (decrypt back to plaintext)

1. Unlock E2EE.
2. Disable E2EE.
3. Confirm the disable flow completes and E2EE config is removed from the device.
4. Refresh the page.

Expected:

- Encrypted fields are now stored as plaintext on the server (intended when disabling).
- App no longer requires E2EE unlock.

## Log/telemetry checks

- Ensure no code paths log `description`, `mitigationPlan`, `encryptedFields`, or passphrases.
- For client-side analytics, verify sensitive props are redacted before storage/logging.

