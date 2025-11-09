// src/components/risk/RiskForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRiskStore } from '../../stores/riskStore';
import type { RiskFormData } from '../../types';

interface RiskFormProps {
  onSubmit: (data: RiskFormData) => void;
  onCancel: () => void;
  initialData?: RiskFormData;
  mode?: 'create' | 'edit';
}

const RiskForm: React.FC<RiskFormProps> = ({ onSubmit, onCancel, initialData, mode = 'create' }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<RiskFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      probability: initialData?.probability || 1,
      impact: initialData?.impact || 1,
      category: initialData?.category || 'Operational',
      mitigationPlan: initialData?.mitigationPlan || '',
      status: initialData?.status || 'open',
    }
  });

  const [riskScore, setRiskScore] = useState<number>(0);
  const categories = useRiskStore(state => state.categories);
  const addCategory = useRiskStore(state => state.addCategory);

  // Calculate risk score when probability or impact changes
  const probability = watch('probability');
  const impact = watch('impact');

  useEffect(() => {
    const score = probability * impact;
    setRiskScore(score);
  }, [probability, impact]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>, fieldOnChange: (value: string) => void) => {
    const value = e.target.value;
    if (value === 'add-new') {
      const newCategory = prompt('Enter new category:');
      if (newCategory && newCategory.trim()) {
        addCategory(newCategory.trim());
        fieldOnChange(newCategory.trim());
      }
    } else {
      fieldOnChange(value);
    }
  };

  const handleFormSubmit = (data: RiskFormData) => {
    onSubmit(data);
    reset(); // Reset form after successful submission
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {mode === 'create' ? 'Create New Risk' : 'Edit Risk'}
      </h2>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Title *
            </label>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Risk title is required', maxLength: { value: 200, message: 'Title must be 200 characters or less' } }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter risk title"
                />
              )}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ maxLength: { value: 1000, message: 'Description must be 1000 characters or less' } }}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Describe the risk"
                />
              )}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Probability (1-5)
            </label>
            <Controller
              name="probability"
              control={control}
              rules={{ required: 'Probability is required', min: { value: 1, message: 'Probability must be between 1 and 5' }, max: { value: 5, message: 'Probability must be between 1 and 5' } }}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.probability ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              )}
            />
            {errors.probability && <p className="text-red-500 text-sm mt-1">{errors.probability.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impact (1-5)
            </label>
            <Controller
              name="impact"
              control={control}
              rules={{ required: 'Impact is required', min: { value: 1, message: 'Impact must be between 1 and 5' }, max: { value: 5, message: 'Impact must be between 1 and 5' } }}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.impact ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              )}
            />
            {errors.impact && <p className="text-red-500 text-sm mt-1">{errors.impact.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <select
                  {...field}
                  value={value}
                  onChange={(e) => handleCategoryChange(e, onChange)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="add-new">+ Add New Category</option>
                </select>
              )}
            />
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="open">Open</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="closed">Closed</option>
                </select>
              )}
            />
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation Plan
            </label>
            <Controller
              name="mitigationPlan"
              control={control}
              rules={{ maxLength: { value: 2000, message: 'Mitigation plan must be 2000 characters or less' } }}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.mitigationPlan ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="How will this risk be addressed?"
                />
              )}
            />
            {errors.mitigationPlan && <p className="text-red-500 text-sm mt-1">{errors.mitigationPlan.message}</p>}
          </div>

          <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-700">Calculated Risk Score</h3>
                <p className="text-4xl font-bold mt-1">
                  <span className={
                    riskScore <= 3 ? 'text-green-600' : 
                    riskScore <= 6 ? 'text-yellow-600' : 
                    'text-red-600'
                  }>
                    {riskScore}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Probability ({probability}) × Impact ({impact}) = {riskScore}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Risk Level:</div>
                <div className={`text-lg font-semibold ${
                  riskScore <= 3 ? 'text-green-600' : 
                  riskScore <= 6 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {riskScore <= 3 ? 'Low' : 
                   riskScore <= 6 ? 'Medium' : 
                   'High'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mode === 'create' ? 'Create Risk' : 'Update Risk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RiskForm;