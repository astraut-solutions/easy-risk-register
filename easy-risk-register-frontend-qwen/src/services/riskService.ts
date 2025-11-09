// src/services/riskService.ts
import type { Risk, RiskFormData } from '../types';
import { loadStoredData, saveStoredData } from '../utils/storage';

// Risk calculation service functions
export const calculateRiskScore = (probability: number, impact: number): number => {
  if (probability >= 1 && probability <= 5 && impact >= 1 && impact <= 5) {
    return probability * impact;
  }
  return 0; // Default to 0 if values are outside expected range
};

// Risk formatting service functions
export const getRiskColor = (score: number): string => {
  if (score <= 3) return 'green'; // Low
  if (score <= 6) return 'yellow'; // Medium
  return 'red'; // High
};

export const getRiskLevel = (score: number): string => {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
};

export const formatRiskDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Risk validation service functions
export const validateRiskInput = (risk: RiskFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!risk.title || risk.title.trim().length === 0) {
    errors.title = 'Risk title is required';
  } else if (risk.title.length > 200) {
    errors.title = 'Risk title must be 200 characters or less';
  }

  if (risk.description && risk.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less';
  }

  if (risk.probability < 1 || risk.probability > 5) {
    errors.probability = 'Probability must be between 1 and 5';
  }

  if (risk.impact < 1 || risk.impact > 5) {
    errors.impact = 'Impact must be between 1 and 5';
  }

  if (risk.mitigationPlan && risk.mitigationPlan.length > 2000) {
    errors.mitigationPlan = 'Mitigation plan must be 2000 characters or less';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Risk transformation service functions
export const riskToFormData = (risk: Risk): RiskFormData => {
  return {
    title: risk.title,
    description: risk.description,
    probability: risk.probability,
    impact: risk.impact,
    category: risk.category,
    mitigationPlan: risk.mitigationPlan,
    status: risk.status,
  };
};

export const formDataToRisk = (formData: RiskFormData, id?: string): Omit<Risk, 'riskScore' | 'creationDate' | 'lastModified'> => {
  return {
    id: id || generateId(),
    title: formData.title,
    description: formData.description,
    probability: formData.probability,
    impact: formData.impact,
    category: formData.category,
    status: formData.status || 'open',
    mitigationPlan: formData.mitigationPlan,
  };
};

// Utility function
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Risk search and filter service functions
export const searchRisks = (risks: Risk[], searchTerm: string): Risk[] => {
  if (!searchTerm) return risks;

  const term = searchTerm.toLowerCase();
  return risks.filter(risk =>
    risk.title.toLowerCase().includes(term) ||
    risk.description.toLowerCase().includes(term) ||
    risk.category.toLowerCase().includes(term)
  );
};

export const filterRisksByCategory = (risks: Risk[], category: string): Risk[] => {
  if (category === 'all') return risks;
  return risks.filter(risk => risk.category === category);
};

export const filterRisksByStatus = (risks: Risk[], status: string): Risk[] => {
  if (status === 'all') return risks;
  return risks.filter(risk => risk.status === status);
};

export const sortRisks = (risks: Risk[], sortBy: keyof Risk, direction: 'asc' | 'desc' = 'asc'): Risk[] => {
  return [...risks].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return direction === 'asc' ? -1 : 1;
    }
    if (a[sortBy] > b[sortBy]) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Risk analytics service functions
export const getRiskStatistics = (risks: Risk[]) => {
  return {
    total: risks.length,
    high: risks.filter(risk => risk.riskScore >= 7).length,
    medium: risks.filter(risk => risk.riskScore >= 4 && risk.riskScore <= 6).length,
    low: risks.filter(risk => risk.riskScore <= 3).length,
    open: risks.filter(risk => risk.status === 'open').length,
    mitigated: risks.filter(risk => risk.status === 'mitigated').length,
    closed: risks.filter(risk => risk.status === 'closed').length,
    byCategory: risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

export const getRiskTrend = (risks: Risk[]): { createdThisWeek: number; createdLastWeek: number } => {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);
  
  const createdThisWeek = risks.filter(risk => 
    new Date(risk.creationDate) >= oneWeekAgo
  ).length;
  
  const createdLastWeek = risks.filter(risk => {
    const riskDate = new Date(risk.creationDate);
    return riskDate < oneWeekAgo && riskDate >= twoWeeksAgo;
  }).length;

  return { createdThisWeek, createdLastWeek };
};

// Risk export service functions
export const formatForExport = (risks: Risk[]) => {
  return risks.map(risk => ({
    id: risk.id,
    title: risk.title,
    description: risk.description,
    probability: risk.probability,
    impact: risk.impact,
    riskScore: risk.riskScore,
    category: risk.category,
    status: risk.status,
    mitigationPlan: risk.mitigationPlan,
    creationDate: risk.creationDate,
    lastModified: risk.lastModified
  }));
};

export default {
  calculateRiskScore,
  getRiskColor,
  getRiskLevel,
  formatRiskDate,
  validateRiskInput,
  riskToFormData,
  formDataToRisk,
  searchRisks,
  filterRisksByCategory,
  filterRisksByStatus,
  sortRisks,
  getRiskStatistics,
  getRiskTrend,
  formatForExport
};