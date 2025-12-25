import React, { useState } from 'react';

import { Button, Input, Select } from '../../design-system';

interface CostModelItem {
  id: string;
  name: string;
  cost: number;
  category: string;
  description: string;
}

interface InteractiveCostModelingProps {
  onCostModelUpdated: (totalCost: number, items: CostModelItem[]) => void;
}

export const InteractiveCostModeling: React.FC<InteractiveCostModelingProps> = ({ onCostModelUpdated }) => {
  const [items, setItems] = useState<CostModelItem[]>([]);
  const [itemName, setItemName] = useState<string>('');
  const [itemCost, setItemCost] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<string>('security');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number>(0);

  const categories = [
    { value: 'security', label: 'Security Controls' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'training', label: 'Training & Awareness' },
    { value: 'tools', label: 'Security Tools' },
    { value: 'personnel', label: 'Personnel' },
    { value: 'consulting', label: 'Consulting Services' },
    { value: 'insurance', label: 'Cyber Insurance' },
    { value: 'recovery', label: 'Incident Recovery' },
  ];

  const handleAddItem = () => {
    if (!itemName.trim()) {
      alert('Please enter a name for the cost item');
      return;
    }

    const cost = parseFloat(itemCost);
    if (isNaN(cost) || cost <= 0) {
      alert('Please enter a valid cost greater than zero');
      return;
    }

    const newItem: CostModelItem = {
      id: `cost-${Date.now()}`,
      name: itemName,
      cost: cost,
      category: itemCategory,
      description: itemDescription,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);

    // Calculate total cost
    const newTotal = updatedItems.reduce((sum, item) => sum + item.cost, 0);
    setTotalCost(newTotal);

    // Notify parent component
    onCostModelUpdated(newTotal, updatedItems);

    // Reset form
    setItemName('');
    setItemCost('');
    setItemDescription('');
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);

    // Calculate new total cost
    const newTotal = updatedItems.reduce((sum, item) => sum + item.cost, 0);
    setTotalCost(newTotal);

    // Notify parent component
    onCostModelUpdated(newTotal, updatedItems);
  };

  const handleReset = () => {
    setItems([]);
    setItemName('');
    setItemCost('');
    setItemDescription('');
    setTotalCost(0);
    onCostModelUpdated(0, []);
  };

  return (
    <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-high">Interactive Cost Modeling</h3>
        <p className="mt-1 text-sm text-text-low">
          Model and track costs associated with risk mitigation and security investments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-medium mb-2">
            Cost Item Name
          </label>
          <Input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Firewall upgrade"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Cost ($)
          </label>
          <Input
            type="number"
            value={itemCost}
            onChange={(e) => setItemCost(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Category
          </label>
          <Select
            options={categories}
            value={itemCategory}
            onChange={setItemCategory}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-medium mb-2">
          Description
        </label>
        <Input
          type="text"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Brief description of the cost item"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleAddItem} variant="primary">
          Add Cost Item
        </Button>
        <Button onClick={handleReset} variant="secondary">
          Reset Model
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-text-high">Cost Model Summary</h4>
            <div className="text-xl font-bold text-brand-primary">
              Total: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-secondary/40">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">Cost</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-faint">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-tertiary/20">
                    <td className="py-3 px-4 text-text-high font-medium">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-secondary border border-border-faint">
                        {categories.find(cat => cat.value === item.category)?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-high">
                      ${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-text-medium max-w-xs truncate" title={item.description}>
                      {item.description || 'No description'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        onClick={() => handleRemoveItem(item.id)} 
                        variant="ghost" 
                        size="sm"
                        className="text-status-danger hover:text-status-danger/80"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-surface-secondary/20 border border-border-faint">
            <h5 className="font-semibold text-text-high mb-2">Cost Breakdown by Category</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(category => {
                const categoryItems = items.filter(item => item.category === category.value);
                if (categoryItems.length === 0) return null;
                
                const categoryTotal = categoryItems.reduce((sum, item) => sum + item.cost, 0);
                const percentage = totalCost > 0 ? (categoryTotal / totalCost) * 100 : 0;
                
                return (
                  <div key={category.value} className="p-3 rounded-lg border border-border-faint bg-surface-secondary/10">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-text-medium">{category.label}</span>
                      <span className="font-semibold text-text-high">
                        ${categoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-surface-tertiary rounded-full h-2">
                      <div 
                        className="bg-brand-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-text-low">
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="mt-6 p-6 text-center rounded-xl bg-surface-secondary/10 border border-border-faint">
          <p className="text-text-low">No cost items added yet. Add items to build your financial model.</p>
        </div>
      )}
    </div>
  );
};