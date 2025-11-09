// src/utils/exports.ts
import type { Risk } from '../types';

export const exportRisksToCSV = (risks: Risk[]): string => {
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
};

export const downloadCSV = (csvContent: string, filename: string = 'risk-register.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object to prevent memory leaks
  URL.revokeObjectURL(url);
};