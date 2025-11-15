/**
 * Client-side encryption utilities for secure data storage in LocalStorage
 * Uses the Web Crypto API for AES-GCM encryption
 */

/**
 * Generates a random encryption key
 * @returns A CryptoKey object for encryption/decryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 * @param data The string data to encrypt
 * @param key The encryption key
 * @returns Encrypted data as a base64 string
 */
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  
  // Generate a random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );
  
  // Concatenate IV and encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64 string for storage
  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypts data using AES-GCM
 * @param encryptedData The base64 encrypted string
 * @param key The decryption key
 * @returns Decrypted string data
 */
export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes for GCM)
  const iv = data.slice(0, 12);
  // Extract the actual encrypted content
  const encryptedContent = data.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedContent
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Converts a key string to a CryptoKey object
 * @param keyString The key string to import
 * @returns CryptoKey object
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false, // Not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to a string representation
 * @param key The CryptoKey to export
 * @returns Base64 string representation of the key
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  const keyArray = new Uint8Array(keyBuffer);
  return btoa(String.fromCharCode(...keyArray));
}

/**
 * Generates an encryption key and returns it as a string
 * @returns Base64 string representation of the generated key
 */
export async function generateKeyString(): Promise<string> {
  const key = await generateEncryptionKey();
  return await exportKey(key);
}