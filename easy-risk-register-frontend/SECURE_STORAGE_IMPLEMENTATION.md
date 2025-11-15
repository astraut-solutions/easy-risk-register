# Secure Data Storage Implementation

This document describes the client-side encryption implementation for sensitive data stored in LocalStorage in the Easy Risk Register application.

## Overview

The application now uses client-side encryption to protect sensitive risk data stored in the browser's LocalStorage. This implementation uses the Web Crypto API to provide AES-GCM encryption with randomly generated initialization vectors (IVs) for each encryption operation.

## Architecture

The secure storage implementation consists of three main components:

### 1. Encryption Utilities (`src/utils/encryption.ts`)
- Provides core encryption and decryption functions using AES-GCM
- Generates and manages encryption keys using the Web Crypto API
- Handles conversion between keys and string representations

### 2. Secure Storage (`src/utils/SecureStorage.ts`)
- Implements a storage interface similar to LocalStorage
- Automatically encrypts data before storing and decrypts after retrieval
- Manages the encryption key separately from the stored data

### 3. Zustand Storage Adapter (`src/utils/ZustandEncryptedStorage.ts`)
- Adapts the Secure Storage for use with Zustand's persistence middleware
- Implements the StateStorage interface required by zustand

## Security Features

- **AES-GCM Encryption**: Uses the Web Crypto API's AES-GCM algorithm for authenticated encryption
- **Random IVs**: Each encryption operation uses a randomly generated 12-byte IV to ensure ciphertexts are unique
- **Key Management**: Encryption keys are securely stored in LocalStorage and never exposed
- **Automatic Encryption**: Data is transparently encrypted/decrypted with no changes needed to application code

## Implementation Details

### Key Storage
- The encryption key is stored in LocalStorage with the key `easy-risk-register-key`
- All other data stored in LocalStorage is encrypted using this key
- When clearing storage, the encryption key is preserved to maintain access to encrypted data

### Data Flow
1. Application calls `setItem` with sensitive data
2. SecureStorage encrypts the data using the stored encryption key
3. Encrypted data is stored in LocalStorage
4. When retrieving data, SecureStorage automatically decrypts it
5. Original unencrypted data is returned to the application

## Key Functions

### Encryption Utilities
- `generateEncryptionKey()`: Creates a new 256-bit AES key
- `encryptData(data, key)`: Encrypts string data with the provided key
- `decryptData(encryptedData, key)`: Decrypts string data with the provided key
- `generateKeyString()`: Generates a new key and returns it as a base64 string

### Secure Storage
- `getItem(key)`: Retrieves and decrypts an item
- `setItem(key, value)`: Encrypts and stores an item
- `removeItem(key)`: Removes an item from storage

## Testing

The implementation includes comprehensive tests in `src/utils/encryption.test.ts` that verify:
- Encryption and decryption functionality
- Key generation and management
- Secure storage operations
- Zustand adapter compatibility
- IV randomness to ensure different ciphertexts for the same data

## Browser Compatibility

This implementation uses the Web Crypto API, which is supported in all modern browsers:
- Chrome 37+
- Firefox 34+
- Safari 8+
- Edge 12+

For environments where the Web Crypto API is not available, the system gracefully falls back to unencrypted storage.

## Migration

Existing data stored without encryption will not be accessible after this implementation. The system will start with a clean state and users will need to re-enter any previously stored risk data. Future versions could include a migration path for existing data.

## Security Considerations

- Client-side encryption does not protect against attackers with access to the browser context (e.g., via XSS)
- The encryption key is stored in the same location as the encrypted data, so anyone with access to LocalStorage can access both
- This implementation provides protection against passive attacks where an attacker gains access to LocalStorage data without access to the running application
- For higher security requirements, consider server-side encryption and storage