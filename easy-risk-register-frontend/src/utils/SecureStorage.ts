/**
 * Secure encrypted storage implementation using Web Crypto API
 * Provides encrypted storage and retrieval of data using AES-GCM encryption
 */

import { encryptData, decryptData, generateKeyString, importKey } from './encryption';

// Key storage key - this will be used to store the encryption key itself
const ENCRYPTION_KEY_STORAGE_KEY = 'easy-risk-register-key';

/**
 * Secure storage interface that implements the same API as localStorage
 * but with client-side encryption
 */
class SecureStorage {
  private _key: CryptoKey | null = null;
  
  /**
   * Get the encryption key, generating a new one if needed
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this._key) {
      return this._key;
    }
    
    // Try to get existing key from storage
    const storedKeyString = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    
    if (storedKeyString) {
      // Import the existing key
      this._key = await importKey(storedKeyString);
    } else {
      // Generate a new key and store it
      const newKeyString = await generateKeyString();
      localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, newKeyString);
      this._key = await importKey(newKeyString);
    }
    
    return this._key;
  }
  
  /**
   * Get an item from encrypted storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = localStorage.getItem(key);
      
      if (!encryptedValue) {
        return null;
      }
      
      const cryptoKey = await this.getEncryptionKey();
      const decryptedValue = await decryptData(encryptedValue, cryptoKey);
      
      return decryptedValue;
    } catch (error) {
      console.error('Error decrypting item from secure storage:', error);
      return null;
    }
  }
  
  /**
   * Set an item in encrypted storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const cryptoKey = await this.getEncryptionKey();
      const encryptedValue = await encryptData(value, cryptoKey);
      
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error encrypting item to secure storage:', error);
      throw error;
    }
  }
  
  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  }
  
  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      // Only clear the data keys, not the encryption key
      const encryptionKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
      localStorage.clear();
      
      // Restore the encryption key after clearing
      if (encryptionKey) {
        localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, encryptionKey);
      }
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }
  
  /**
   * Get the number of items in storage
   */
  get length(): number {
    // Return the number of non-encryption-key items
    return Object.keys(localStorage).filter(key => 
      key !== ENCRYPTION_KEY_STORAGE_KEY
    ).length;
  }
  
  /**
   * Get the key at the given index
   */
  key(index: number): string | null {
    const keys = Object.keys(localStorage).filter(key => 
      key !== ENCRYPTION_KEY_STORAGE_KEY
    );
    
    return keys[index] || null;
  }
  
  /**
   * Check if secure storage is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.crypto !== 'undefined' && 
           typeof window.crypto.subtle !== 'undefined' &&
           typeof localStorage !== 'undefined';
  }
}

export default SecureStorage;