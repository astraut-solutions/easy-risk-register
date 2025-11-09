// src/utils/storage.ts
import type { StoredData } from '../types';

const STORAGE_KEY = 'easy-risk-register-data';

export const loadStoredData = (): StoredData => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      return {
        risks: parsedData.risks || [],
        categories: parsedData.categories || [],
        settings: parsedData.settings || {
          theme: 'light',
          defaultProbabilityOptions: [1, 2, 3, 4, 5],
          defaultImpactOptions: [1, 2, 3, 4, 5],
        },
        version: parsedData.version || '1.0.0',
      };
    }
  } catch (error) {
    console.error('Error loading data from storage:', error);
  }
  
  // Return default data if no stored data or error occurred
  return {
    risks: [],
    categories: ['Operational', 'Security', 'Compliance', 'Financial', 'Strategic'],
    settings: {
      theme: 'light',
      defaultProbabilityOptions: [1, 2, 3, 4, 5],
      defaultImpactOptions: [1, 2, 3, 4, 5],
    },
    version: '1.0.0',
  };
};

export const saveStoredData = (data: StoredData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data to storage:', error);
    return false;
  }
};

export const clearStoredData = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data from storage:', error);
    return false;
  }
};

// Check if local storage is available
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};