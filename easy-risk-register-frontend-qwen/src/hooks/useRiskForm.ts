// src/hooks/useRiskForm.ts
import { useState, useEffect } from 'react';
import type { RiskFormData } from '../types';
import { validateRiskInput } from '../services/riskService';

interface UseRiskFormProps {
  initialData?: RiskFormData;
  onSubmit: (data: RiskFormData) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

export const useRiskForm = ({ initialData, onSubmit, onCancel, mode = 'create' }: UseRiskFormProps) => {
  const [formData, setFormData] = useState<RiskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    probability: initialData?.probability || 1,
    impact: initialData?.impact || 1,
    category: initialData?.category || 'Operational',
    mitigationPlan: initialData?.mitigationPlan || '',
    status: initialData?.status || 'open',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate risk score in real-time
  const riskScore = formData.probability * formData.impact;

  // Validate form on change
  useEffect(() => {
    const { errors } = validateRiskInput(formData);
    setErrors(errors);
  }, [formData]);

  const handleChange = (field: keyof RiskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { isValid, errors } = validateRiskInput(formData);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Could set submission error here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: initialData?.title || '',
      description: initialData?.description || '',
      probability: initialData?.probability || 1,
      impact: initialData?.impact || 1,
      category: initialData?.category || 'Operational',
      mitigationPlan: initialData?.mitigationPlan || '',
      status: initialData?.status || 'open',
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    riskScore,
    handleChange,
    handleSubmit,
    handleReset,
    onCancel,
    mode,
    isValid: Object.keys(errors).length === 0
  };
};

export default useRiskForm;