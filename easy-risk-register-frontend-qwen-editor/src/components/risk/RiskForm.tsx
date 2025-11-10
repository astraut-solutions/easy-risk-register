// src/components/risk/RiskForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Risk, RiskFormData } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { validateRiskForm } from '../../utils/validators';

interface RiskFormProps {
  onSubmit: (data: RiskFormData) => void;
  onCancel: () => void;
  initialData?: Risk;
  mode?: 'create' | 'edit';
}

const RiskForm: React.FC<RiskFormProps> = ({ onSubmit, onCancel, initialData, mode = 'create' }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
    // Note: reset is not being used but keeping it in case needed for future functionality
  } = useForm<RiskFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      probability: initialData?.probability || 1,
      impact: initialData?.impact || 1,
      category: initialData?.category || 'Operational',
      mitigationPlan: initialData?.mitigationPlan || '',
      status: initialData?.status || 'open'
    }
  });

  const [riskScore, setRiskScore] = useState<number>(initialData?.riskScore || 1);
  
  // Watch probability and impact to calculate risk score in real-time
  const probability = watch('probability');
  const impact = watch('impact');
  // const category = watch('category'); // Not currently used but kept for potential future use

  useEffect(() => {
    const newScore = probability * impact;
    setRiskScore(newScore);
  }, [probability, impact]);

  const probabilityOptions = [
    { value: '1', label: 'Very Low (1)' },
    { value: '2', label: 'Low (2)' },
    { value: '3', label: 'Medium (3)' },
    { value: '4', label: 'High (4)' },
    { value: '5', label: 'Very High (5)' }
  ];

  const impactOptions = [
    { value: '1', label: 'Very Low (1)' },
    { value: '2', label: 'Low (2)' },
    { value: '3', label: 'Medium (3)' },
    { value: '4', label: 'High (4)' },
    { value: '5', label: 'Very High (5)' }
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'mitigated', label: 'Mitigated' },
    { value: 'closed', label: 'Closed' }
  ];

  const categoryOptions = [
    { value: 'Operational', label: 'Operational' },
    { value: 'Financial', label: 'Financial' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'Security', label: 'Security' },
    { value: 'Strategic', label: 'Strategic' },
    { value: 'Reputational', label: 'Reputational' }
  ];

  const handleFormSubmit = (data: RiskFormData) => {
    const validationErrors = validateRiskForm(data);
    
    // If there are validation errors, register them with react-hook-form
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, _message]) => {
        // @ts-ignore - react-hook-form allows this
        setValue(field, data[field as keyof RiskFormData], { shouldValidate: true });
      });
      return;
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Risk Title"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
            helpText="Brief description of the risk"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Description
          </label>
          <textarea
            {...register('description')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Detailed description of the risk..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          <p className="mt-1 text-sm text-gray-500">Optional, max 1000 characters</p>
        </div>

        <Select
          label="Probability"
          options={probabilityOptions}
          {...register('probability', { 
            valueAsNumber: true,
            validate: (value) => {
              const numValue = Number(value);
              if (isNaN(numValue) || numValue < 1 || numValue > 5) return 'Probability must be between 1 and 5';
              return true;
            }
          })}
          error={errors.probability?.message}
          helpText="How likely is this risk to occur?"
        />

        <Select
          label="Impact"
          options={impactOptions}
          {...register('impact', { 
            valueAsNumber: true,
            validate: (value) => {
              const numValue = Number(value);
              if (isNaN(numValue) || numValue < 1 || numValue > 5) return 'Impact must be between 1 and 5';
              return true;
            }
          })}
          error={errors.impact?.message}
          helpText="How severe would the impact be?"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Score
          </label>
          <div className="flex items-center">
            <span className="text-2xl font-bold mr-2">{riskScore}</span>
            <span className="text-sm text-gray-500">
              ({probability} × {impact} = {riskScore})
            </span>
          </div>
        </div>

        <Select
          label="Category"
          options={categoryOptions}
          {...register('category', { required: 'Category is required' })}
          error={errors.category?.message}
        />

        <Select
          label="Status"
          options={statusOptions}
          {...register('status', { required: 'Status is required' })}
          error={errors.status?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mitigation Plan
        </label>
        <textarea
          {...register('mitigationPlan')}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.mitigationPlan ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={4}
          placeholder="How will this risk be addressed or mitigated?"
        />
        {errors.mitigationPlan && <p className="mt-1 text-sm text-red-600">{errors.mitigationPlan.message}</p>}
        <p className="mt-1 text-sm text-gray-500">Optional, max 2000 characters</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {mode === 'create' ? 'Create Risk' : 'Update Risk'}
        </Button>
      </div>
    </form>
  );
};

export default RiskForm;