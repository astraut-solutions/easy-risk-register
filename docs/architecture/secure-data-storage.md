# Secure Data Storage (Optional Local Encryption)

This document describes the optional **at-rest encryption** used to protect persisted risk data stored in the browser.

## Overview

Easy Risk Register stores its Zustand-persisted state in browser storage under the key `easy-risk-register-data`.

If a user enables encryption (`REQ-025`), that persisted payload is encrypted **at rest** using browser-provided crypto APIs (`NFR-021`):

- **KDF**: `PBKDF2` (`SHA-256`) with a random salt and configurable iterations
- **Cipher**: `AES-GCM` (256-bit key) with a random 12-byte IV per encryption
- **Key handling**: the derived key is kept **in memory for the session** (not stored)

If Web Crypto is unavailable (or the app is running in a non-browser context), encryption is unavailable and the app uses plain storage.

## Components

### 1) Crypto helpers

- `easy-risk-register-frontend/src/utils/passphraseCrypto.ts`
  - Passphrase → AES key derivation (`PBKDF2`)
  - AES-GCM encrypt/decrypt helpers
  - Base64 encode/decode helpers

### 2) Encryption manager

- `easy-risk-register-frontend/src/utils/encryptionManager.ts`
  - Stores encryption config under `easy-risk-register:encryption`
  - Holds the derived `CryptoKey` in memory for the current session
  - Implements enable/disable/rotate/unlock flows
  - Provides a legacy migration from earlier auto-key encryption

### 3) Zustand persistence adapter

- `easy-risk-register-frontend/src/utils/RiskRegisterPersistStorage.ts`
  - Implements Zustand’s `StateStorage` interface
  - Encrypts/decrypts only the persisted store key
  - Returns `null` while locked to avoid accidentally overwriting ciphertext

## Storage format

### Persisted store value (`easy-risk-register-data`)

When encryption is enabled, the persisted value is stored as a JSON string:

```json
{"v":1,"ivB64":"...","ctB64":"..."}
```

- `ivB64`: base64 IV (12 bytes)
- `ctB64`: base64 ciphertext (includes authentication tag)

### Encryption config (`easy-risk-register:encryption`)

The config includes:

- a KDF salt + iteration count
- an encrypted test value (used to validate passphrase without storing the key)

The passphrase itself is never stored.

## Unlocking and UX integration

If encryption is enabled but not unlocked:

- the app shows an **unlock modal** (`EncryptionUnlockGate`)
- after successful unlock, the app triggers `useRiskStore.persist.rehydrate()` to load decrypted state

If the passphrase is forgotten, the only recovery is to **delete local data** on that device (explicit “data loss” warning in the UI).

## Legacy migration

Earlier builds used an auto-generated AES key stored in LocalStorage (`easy-risk-register-key`) and stored ciphertext as base64 of `IV || ciphertext`.

On startup, if legacy encrypted data is detected and passphrase encryption is not enabled, the app attempts a **one-time migration** by decrypting the legacy payload back to plaintext and removing the legacy key.

## Security considerations

This feature is defense-in-depth for at-rest storage:

- It does **not** protect against attackers who can execute code in the same origin (for example via XSS).
- It does not protect against a fully compromised device/account.
- It primarily helps reduce exposure from casual/local inspection of browser storage (device loss, shared device profiles, etc.).

