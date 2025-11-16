import { describe, it, expect, beforeEach } from 'vitest';
import { generateEncryptionKey, encryptData, decryptData, generateKeyString, exportKey, importKey } from './encryption';
import SecureStorage from './SecureStorage';
import ZustandEncryptedStorage from './ZustandEncryptedStorage';

const globalWithWindow = globalThis as typeof globalThis & {
  window?: typeof globalThis & { crypto?: Crypto; localStorage?: Storage };
};
const mockWindow = (globalWithWindow.window ??= globalWithWindow);

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Mock the window.crypto API
const mockSubtleCrypto = {
  generateKey: async (algorithm: any) => {
    // Create a mock key
    const key = {
      type: 'secret',
      extractable: true,
      algorithm: algorithm,
      usages: ['encrypt', 'decrypt']
    };
    return key;
  },
  exportKey: async (_format: string, _key: any) => {
    // Return a mock key buffer
    return new Uint8Array(32).buffer; // 256-bit key
  },
  importKey: async (_format: string, _keyData: any, algorithm: any, extractable: boolean, keyUsages: string[]) => {
    const key = {
      type: 'secret',
      extractable: extractable,
      algorithm: algorithm,
      usages: keyUsages
    };
    return key;
  },
  encrypt: async (_algorithm: any, _key: any, data: ArrayBuffer) => {
    // Simulate encryption by returning the data unchanged but as an ArrayBuffer
    return data;
  },
  decrypt: async (_algorithm: any, _key: any, data: ArrayBuffer) => {
    // Simulate decryption by returning the data unchanged
    return data;
  }
};

// Mock getRandomValues
const mockGetRandomValues = (array: Uint8Array) => {
  // Fill the array with mock random values
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 255);
  }
  return array;
};

Object.defineProperty(mockWindow, 'crypto', {
  value: {
    subtle: mockSubtleCrypto,
    getRandomValues: mockGetRandomValues
  },
  writable: true
});

Object.defineProperty(mockWindow, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Encryption Utilities', () => {
  it('should generate an encryption key', async () => {
    const key = await generateEncryptionKey();
    expect(key).toBeDefined();
    expect(key.type).toBe('secret'); // Mock implementation returns 'secret'
  });

  it('should encrypt and decrypt data successfully', async () => {
    const testData = 'Hello, encrypted world!';
    const key = await generateEncryptionKey();

    const encrypted = await encryptData(testData, key);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(testData); // Should be different after encryption

    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toBe(testData);
  });

  it('should encrypt the same data to different ciphertexts due to random IV', async () => {
    const testData = 'consistent data';
    const key = await generateEncryptionKey();

    const encrypted1 = await encryptData(testData, key);
    const encrypted2 = await encryptData(testData, key);

    expect(encrypted1).not.toBe(encrypted2); // Different due to random IV
    expect(encrypted1).toBeDefined();
    expect(encrypted2).toBeDefined();

    // But both should decrypt to the same original data
    expect(await decryptData(encrypted1, key)).toBe(testData);
    expect(await decryptData(encrypted2, key)).toBe(testData);
  });

  it('should generate a key string', async () => {
    const keyString = await generateKeyString();
    expect(keyString).toBeDefined();
    expect(typeof keyString).toBe('string');
    expect(keyString.length).toBeGreaterThan(0);
  });

  it('should export and import keys', async () => {
    const originalKey = await generateEncryptionKey();
    const keyString = await exportKey(originalKey);
    expect(keyString).toBeDefined();

    const importedKey = await importKey(keyString);
    expect(importedKey).toBeDefined();
  });
});

describe('SecureStorage', () => {
  let secureStorage: SecureStorage;
  
  beforeEach(() => {
    secureStorage = new SecureStorage();
    localStorage.clear();
  });

  it('should store and retrieve encrypted data', async () => {
    const testKey = 'test-item';
    const testValue = 'my-sensitive-data';
    
    await secureStorage.setItem(testKey, testValue);
    const retrievedValue = await secureStorage.getItem(testKey);
    
    expect(retrievedValue).toBe(testValue);
  });

  it('should return null for non-existent items', async () => {
    const retrievedValue = await secureStorage.getItem('non-existent-key');
    expect(retrievedValue).toBeNull();
  });

  it('should remove items', async () => {
    const testKey = 'test-remove';
    const testValue = 'to-be-removed';
    
    await secureStorage.setItem(testKey, testValue);
    expect(await secureStorage.getItem(testKey)).toBe(testValue);
    
    secureStorage.removeItem(testKey);
    expect(await secureStorage.getItem(testKey)).toBeNull();
  });

  it('should clear all items except encryption key', () => {
    localStorage.setItem('temp-item', 'temp-value');
    localStorage.setItem('easy-risk-register-key', 'some-key');
    
    secureStorage.clear();
    
    // Encryption key should still be there
    expect(localStorage.getItem('easy-risk-register-key')).toBe('some-key');
    // Other items should be gone
    expect(localStorage.getItem('temp-item')).toBeNull();
  });
});

describe('ZustandEncryptedStorage', () => {
  let zustandStorage: ZustandEncryptedStorage;
  
  beforeEach(() => {
    zustandStorage = new ZustandEncryptedStorage();
    localStorage.clear();
  });

  it('should implement StateStorage interface', async () => {
    const testKey = 'zustand-test';
    const testValue = '{"test": "data"}';
    
    await zustandStorage.setItem(testKey, testValue);
    const retrievedValue = await zustandStorage.getItem(testKey);
    
    expect(retrievedValue).toBe(testValue);
  });

  it('should remove items', async () => {
    const testKey = 'zustand-remove-test';
    const testValue = 'to-be-removed';
    
    await zustandStorage.setItem(testKey, testValue);
    expect(await zustandStorage.getItem(testKey)).toBe(testValue);
    
    zustandStorage.removeItem(testKey);
    expect(await zustandStorage.getItem(testKey)).toBeNull();
  });

  it('should check if available', () => {
    expect(ZustandEncryptedStorage.isAvailable()).toBe(true);
  });
});
