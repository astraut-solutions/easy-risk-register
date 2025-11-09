// src/stores/riskStore.ts
import { create } from 'zustand';
import type { Risk, RiskStore } from '../types';
import { loadStoredData, saveStoredData } from '../utils/storage';

// Utility functions
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const calculateRiskScore = (probability: number, impact: number): number => {
  if (probability >= 1 && probability <= 5 && impact >= 1 && impact <= 5) {
    return probability * impact;
  }
  return 0; // Default to 0 if values are outside expected range
};

// Initialize store with data from localStorage or defaults
const initializeStore = () => {
  const storedData = loadStoredData();
  return {
    risks: storedData.risks,
    categories: storedData.categories,
  };
};

export const useRiskStore = create<RiskStore>((set, get) => ({
  risks: initializeStore().risks,
  categories: initializeStore().categories,

  addRisk: (riskData) => {
    const newRisk: Risk = {
      id: generateId(),
      ...riskData,
      riskScore: calculateRiskScore(riskData.probability, riskData.impact),
      creationDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    set((state) => ({ risks: [...state.risks, newRisk] }));
    
    // Persist to localStorage
    const currentData = loadStoredData();
    saveStoredData({
      ...currentData,
      risks: [...currentData.risks, newRisk]
    });
  },

  updateRisk: (id, updates) => {
    set((state) => ({
      risks: state.risks.map((risk) =>
        risk.id === id
          ? {
              ...risk,
              ...updates,
              riskScore: updates.probability !== undefined || updates.impact !== undefined
                ? calculateRiskScore(
                    updates.probability ?? risk.probability,
                    updates.impact ?? risk.impact
                  )
                : risk.riskScore,
              lastModified: new Date().toISOString(),
            }
          : risk
      ),
    }));
    
    // Persist to localStorage
    const currentData = loadStoredData();
    saveStoredData({
      ...currentData,
      risks: currentData.risks.map((risk) =>
        risk.id === id
          ? {
              ...risk,
              ...updates,
              riskScore: updates.probability !== undefined || updates.impact !== undefined
                ? calculateRiskScore(
                    updates.probability ?? risk.probability,
                    updates.impact ?? risk.impact
                  )
                : risk.riskScore,
              lastModified: new Date().toISOString(),
            }
          : risk
      ),
    });
  },

  deleteRisk: (id) => {
    set((state) => ({
      risks: state.risks.filter((risk) => risk.id !== id),
    }));
    
    // Persist to localStorage
    const currentData = loadStoredData();
    saveStoredData({
      ...currentData,
      risks: currentData.risks.filter((risk) => risk.id !== id)
    });
  },

  getRiskById: (id) => {
    return get().risks.find((risk) => risk.id === id);
  },

  addCategory: (category) => {
    set((state) => {
      if (!state.categories.includes(category)) {
        const newCategories = [...state.categories, category];
        // Persist to localStorage
        const currentData = loadStoredData();
        saveStoredData({
          ...currentData,
          categories: newCategories
        });
        return { categories: newCategories };
      }
      return state;
    });
  },

  exportToCSV: () => {
    const { risks } = get();
    if (!risks.length) return '';
    
    const headers = [
      'ID',
      'Title', 
      'Description', 
      'Probability', 
      'Impact', 
      'Risk Score', 
      'Category', 
      'Status', 
      'Mitigation Plan', 
      'Creation Date', 
      'Last Modified'
    ];
    
    const csvContent = [
      headers.join(','),
      ...risks.map(risk => [
        `"${risk.id}"`,
        `"${risk.title.replace(/"/g, '""')}"`,
        `"${risk.description.replace(/"/g, '""')}"`,
        risk.probability,
        risk.impact,
        risk.riskScore,
        `"${risk.category}"`,
        `"${risk.status}"`,
        `"${risk.mitigationPlan.replace(/"/g, '""')}"`,
        `"${risk.creationDate}"`,
        `"${risk.lastModified}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  },

  importFromCSV: (csv) => {
    const lines = csv.split('\n');
    if (lines.length <= 1) return; // No data to import
    
    const risks: Risk[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(val => val.trim().replace(/^"|"$/g, ''));
      if (values.length >= 7) { // Ensure we have minimum required values
        const risk: Risk = {
          id: generateId(), // Generate new ID to avoid conflicts
          title: values[1] || 'Imported Risk',
          description: values[2] || '',
          probability: parseInt(values[3]) || 1,
          impact: parseInt(values[4]) || 1,
          riskScore: parseInt(values[5]) || 0,
          category: values[6] || 'Operational',
          status: (values[7] as 'open' | 'mitigated' | 'closed') || 'open',
          mitigationPlan: values[8] || '',
          creationDate: values[9] || new Date().toISOString(),
          lastModified: values[10] || new Date().toISOString(),
        };
        risks.push(risk);
      }
    }
    
    set((state) => ({ risks: [...state.risks, ...risks] }));
    
    // Persist to localStorage
    const currentData = loadStoredData();
    saveStoredData({
      ...currentData,
      risks: [...currentData.risks, ...risks]
    });
  },

  calculateRiskScore: (probability, impact) => {
    return calculateRiskScore(probability, impact);
  },

  getRisksByCategory: (category) => {
    return get().risks.filter(risk => risk.category === category);
  },

  getRisksByStatus: (status) => {
    return get().risks.filter(risk => risk.status === status);
  },
}));