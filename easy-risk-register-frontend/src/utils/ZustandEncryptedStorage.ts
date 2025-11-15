/**
 * Encrypted storage adapter for zustand persistence middleware
 * Wraps the SecureStorage class to provide the interface expected by zustand
 */

import type { StateStorage } from 'zustand/middleware';
import SecureStorage from './SecureStorage';

class ZustandEncryptedStorage implements StateStorage {
  private secureStorage: SecureStorage;

  constructor() {
    this.secureStorage = new SecureStorage();
  }

  getItem: StateStorage['getItem'] = async (name: string): Promise<string | null> => {
    return await this.secureStorage.getItem(name);
  };

  setItem: StateStorage['setItem'] = async (name: string, value: string): Promise<void> => {
    await this.secureStorage.setItem(name, value);
  };

  removeItem: StateStorage['removeItem'] = (name: string): void => {
    this.secureStorage.removeItem(name);
  };

  /**
   * Check if secure storage is available
   */
  static isAvailable(): boolean {
    return SecureStorage.isAvailable();
  }
}

export default ZustandEncryptedStorage;