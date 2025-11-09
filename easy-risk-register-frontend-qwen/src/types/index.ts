// Risk data model and TypeScript interfaces for Easy Risk Register

export interface Risk {
  id: string;
  title: string;
  description: string;
  probability: number; // 1-5 scale
  impact: number;      // 1-5 scale
  riskScore: number;   // probability * impact
  category: string;
  status: 'open' | 'mitigated' | 'closed';
  mitigationPlan: string;
  creationDate: string; // ISO string format
  lastModified: string; // ISO string format
}

export interface RiskFormData {
  title: string;
  description: string;
  probability: number;
  impact: number;
  category: string;
  mitigationPlan: string;
  status?: 'open' | 'mitigated' | 'closed';
}

export interface RiskStore {
  risks: Risk[];
  categories: string[];
  addRisk: (risk: Omit<Risk, 'id' | 'riskScore' | 'creationDate' | 'lastModified'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  getRiskById: (id: string) => Risk | undefined;
  addCategory: (category: string) => void;
  exportToCSV: () => string;
  importFromCSV: (csv: string) => void;
  calculateRiskScore: (probability: number, impact: number) => number;
  getRisksByCategory: (category: string) => Risk[];
  getRisksByStatus: (status: string) => Risk[];
}

export interface StoredData {
  risks: Risk[];
  categories: string[];
  settings: {
    theme: 'light' | 'dark';
    defaultProbabilityOptions: number[];
    defaultImpactOptions: number[];
  };
  version: string;
}