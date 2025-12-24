# Secure Data Storage (Client-Side Encryption)

This document describes the client-side encryption implementation used to protect persisted risk data stored in the browser.

## Overview

When the Web Crypto API is available, Easy Risk Register encrypts the Zustand-persisted state before writing it to LocalStorage. The implementation uses AES-GCM with a unique, randomly generated initialization vector (IV) per encryption operation.

If Web Crypto is unavailable (or the app is running in a non-browser context), the app falls back to unencrypted storage.

## Architecture

The secure storage implementation consists of three main components:

### 1. Encryption Utilities (`easy-risk-register-frontend/src/utils/encryption.ts`)

- Core encryption and decryption functions using AES-GCM
- Key generation and import/export helpers
- Base64 conversion helpers for storage

### 2. Secure Storage (`easy-risk-register-frontend/src/utils/SecureStorage.ts`)

- A LocalStorage-like interface (`getItem`, `setItem`, `removeItem`, `clear`, `key`, `length`)
- Encrypts data before storing and decrypts after retrieval
- Lazily generates and persists an encryption key on first use

### 3. Zustand Storage Adapter (`easy-risk-register-frontend/src/utils/ZustandEncryptedStorage.ts`)

- Adapts `SecureStorage` to Zustand’s `StateStorage` interface
- Used by `easy-risk-register-frontend/src/stores/riskStore.ts` when available

## Security Features

- **AES-GCM encryption**: Authenticated encryption via Web Crypto API AES-GCM.
- **Random IVs**: A random 12-byte IV is generated for each encryption call.
- **Transparent usage**: Zustand persistence uses the encrypted adapter without changing state shape.

## Implementation Details

### Key Storage

- The key is stored in LocalStorage under `easy-risk-register-key`.
- The stored value is a base64 string of the raw 256-bit key material.
- The imported `CryptoKey` used for encryption/decryption is created with `extractable: false`, but the raw key material remains readable from LocalStorage.

### Encrypted Value Format

`encryptData()` stores the encrypted payload as base64 of:

- 12 bytes IV (`window.crypto.getRandomValues(new Uint8Array(12))`)
- followed by the AES-GCM ciphertext (which includes the authentication tag)

### Availability and Fallback

- `SecureStorage.isAvailable()` requires `window.crypto.subtle` and `localStorage`.
- `easy-risk-register-frontend/src/stores/riskStore.ts` selects encrypted storage only when `ZustandEncryptedStorage.isAvailable()` returns `true`; otherwise it uses plain `window.localStorage`.
- During SSR, the store uses an in-memory storage implementation.

## Testing

Tests live in `easy-risk-register-frontend/test/utils/encryption.test.ts` and cover:

- Encryption/decryption round trips
- Key import/export and key string generation
- Secure storage operations (including `clear()` preserving the key)
- Zustand adapter behavior
- IV randomness (same plaintext encrypts to different ciphertexts)

## Browser Compatibility

This implementation relies on the Web Crypto API:

- Requires modern browsers with `crypto.subtle`
- Requires a secure context for Web Crypto in many environments (HTTPS or `localhost`)

## Migration Notes

If previously persisted state was stored unencrypted under the same LocalStorage key, it will not decrypt successfully. In that case, reads will fail and the app will rehydrate with defaults (effectively a clean state). A future migration could attempt to detect legacy plaintext and re-encrypt it.

## Security Considerations

- Client-side encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- The encryption key is stored in LocalStorage alongside encrypted data, so an attacker who can read LocalStorage can read both the ciphertext and the key material.
- This feature primarily protects against casual/passive inspection of LocalStorage at rest (for example, screenshots, shoulder surfing, or accidental disclosure).

