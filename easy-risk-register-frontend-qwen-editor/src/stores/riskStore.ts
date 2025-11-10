// src/stores/riskStore.ts
import { create } from 'zustand';
import { Risk, RiskStore } from '../types/index.ts';

interface StoredData {
  risks: Risk[];
  categories: string[];
  version: string;
}

const RISK_DATA_KEY = 'easy-risk-register-data';
const VERSION = '1.0.0';

// Load data from localStorage
const loadStoredData = (): StoredData => {
  try {
    const stored = localStorage.getItem(RISK_DATA_KEY);
    if (stored) {
      const parsed: StoredData = JSON.parse(stored);
      if (parsed.version === VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
  
  return {
    risks: [],
    categories: [
      'Operational',
      'Financial',
      'Compliance',
      'Security',
      'Strategic',
      'Reputational'
    ],
    version: VERSION
  };
};

// Save data to localStorage
const saveStoredData = (data: StoredData) => {
  try {
    localStorage.setItem(RISK_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

const initialData = loadStoredData();

export const useRiskStore = create<RiskStore>((set: (partial: Partial<RiskStore>) => void, get: () => RiskStore) => ({
  risks: initialData.risks,
  categories: initialData.categories,
  
  addRisk: (riskData: Omit<Risk, 'id' | 'riskScore' | 'creationDate' | 'lastModified'>) => {
    const newRisk: Risk = {
      ...riskData,
      id: crypto.randomUUID(),
      riskScore: riskData.probability * riskData.impact,
      creationDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    const updatedRisks = [...get().risks, newRisk];
    const updatedCategories = get().categories.includes(riskData.category)
      ? get().categories
      : [...get().categories, riskData.category];
    
    const updatedData = {
      risks: updatedRisks,
      categories: updatedCategories,
      version: VERSION
    };
    
    saveStoredData(updatedData);
    
    set({ 
      risks: updatedRisks,
      categories: updatedCategories
    });
  },
  
  updateRisk: (id: string, updates: Partial<Risk>) => {
    const updatedRisks = get().risks.map((risk: Risk) => {
      if (risk.id === id) {
        const updatedRisk: Risk = {
          ...risk,
          ...updates,
          lastModified: new Date().toISOString(),
        };
        
        // Recalculate risk score if probability or impact changed
        if (updates.probability !== undefined || updates.impact !== undefined) {
          updatedRisk.riskScore = (updates.probability ?? risk.probability) * (updates.impact ?? risk.impact);
        }
        
        return updatedRisk;
      }
      return risk;
    });
    
    const updatedData = {
      risks: updatedRisks,
      categories: get().categories,
      version: VERSION
    };
    
    saveStoredData(updatedData);
    
    set({ risks: updatedRisks });
  },
  
  deleteRisk: (id: string) => {
    const updatedRisks = get().risks.filter((risk: Risk) => risk.id !== id);
    const updatedData = {
      risks: updatedRisks,
      categories: get().categories,
      version: VERSION
    };
    
    saveStoredData(updatedData);
    
    set({ risks: updatedRisks });
  },
  
  exportToCSV: () => {
    const risks = get().risks;
    
    if (risks.length === 0) {
      return 'ID,Title,Description,Probability,Impact,Risk Score,Category,Status,Mitigation Plan,Created Date,Last Modified\n';
    }
    
    const csvContent = [
      'ID,Title,Description,Probability,Impact,Risk Score,Category,Status,Mitigation Plan,Created Date,Last Modified',
      ...risks.map((risk: Risk) => [
        `"${risk.id}"`,
        `"${risk.title}"`,
        `"${risk.description}"`,
        risk.probability,
        risk.impact,
        risk.riskScore,
        `"${risk.category}"`,
        risk.status,
        `"${risk.mitigationPlan}"`,
        risk.creationDate,
        risk.lastModified
      ].join(','))
    ].join('\n');
    
    return csvContent;
  },
  
  importFromCSV: (csv: string) => {
    // Simple CSV parsing - in a real app, use a more robust parser
    const lines = csv.split('\n');
    if (lines.length < 2) return; // No data to import

    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    const risks: Risk[] = [];
    const categories = new Set<string>();

    for (const line of dataLines) {
      const values = line.split(',').map(v => v.trim());

      if (values.length >= 11) {
        const risk: Risk = {
          id: values[0].replace(/"/g, ''),
          title: values[1].replace(/"/g, ''),
          description: values[2].replace(/"/g, ''),
          probability: parseInt(values[3]),
          impact: parseInt(values[4]),
          riskScore: parseInt(values[5]),
          category: values[6].replace(/"/g, ''),
          status: values[7] as 'open' | 'mitigated' | 'closed',
          mitigationPlan: values[8].replace(/"/g, ''),
          creationDate: values[9],
          lastModified: values[10]
        };

        risks.push(risk);
        categories.add(risk.category);
      }
    }

    const updatedData = {
      risks: [...get().risks, ...risks],
      categories: Array.from(new Set([...get().categories, ...Array.from(categories)])),
      version: VERSION
    };

    saveStoredData(updatedData);

    set({
      risks: updatedData.risks,
      categories: updatedData.categories
    });
  },
  
  calculateRiskScore: (probability: number, impact: number) => {
    return probability * impact;
  }
}));