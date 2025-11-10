// src/utils/validators.ts
import { RiskFormData } from '../types/index.ts';

export const validateRiskForm = (data: RiskFormData) => {
  const errors: Partial<Record<keyof RiskFormData, string>> = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less';
  }

  if (data.probability < 1 || data.probability > 5 || !Number.isInteger(data.probability)) {
    errors.probability = 'Probability must be an integer between 1 and 5';
  }

  if (data.impact < 1 || data.impact > 5 || !Number.isInteger(data.impact)) {
    errors.impact = 'Impact must be an integer between 1 and 5';
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.category = 'Category is required';
  }

  if (data.mitigationPlan && data.mitigationPlan.length > 2000) {
    errors.mitigationPlan = 'Mitigation plan must be 2000 characters or less';
  }

  return errors;
};