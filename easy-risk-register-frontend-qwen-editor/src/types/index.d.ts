export interface Risk {
    id: string;
    title: string;
    description: string;
    probability: number;
    impact: number;
    riskScore: number;
    category: string;
    status: 'open' | 'mitigated' | 'closed';
    mitigationPlan: string;
    creationDate: string;
    lastModified: string;
}
export interface RiskStore {
    risks: Risk[];
    categories: string[];
    addRisk: (risk: Omit<Risk, 'id' | 'riskScore' | 'creationDate' | 'lastModified'>) => void;
    updateRisk: (id: string, updates: Partial<Risk>) => void;
    deleteRisk: (id: string) => void;
    exportToCSV: () => string;
    importFromCSV: (csv: string) => void;
    calculateRiskScore: (probability: number, impact: number) => number;
}
export interface RiskFormData {
    title: string;
    description: string;
    probability: number;
    impact: number;
    category: string;
    mitigationPlan: string;
    status: 'open' | 'mitigated' | 'closed';
}
//# sourceMappingURL=index.d.ts.map