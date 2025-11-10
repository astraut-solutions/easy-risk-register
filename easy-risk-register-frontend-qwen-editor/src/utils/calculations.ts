// src/utils/calculations.ts
import { Risk } from '../types/index.ts';

export const calculateRiskScore = (probability: number, impact: number): number => {
  return probability * impact;
};

export const getRiskColor = (score: number): string => {
  if (score <= 3) return 'green'; // Low risk
  if (score <= 6) return 'yellow'; // Medium risk
  return 'red'; // High risk
};

export const getRiskSeverity = (score: number): string => {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const sortByRiskScore = (risks: Risk[], order: 'asc' | 'desc' = 'desc'): Risk[] => {
  return [...risks].sort((a: Risk, b: Risk) => {
    if (order === 'desc') {
      return b.riskScore - a.riskScore;
    } else {
      return a.riskScore - b.riskScore;
    }
  });
};