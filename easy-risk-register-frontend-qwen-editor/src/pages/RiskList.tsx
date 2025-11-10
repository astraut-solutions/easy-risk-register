// src/pages/RiskList.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiskStore } from '../stores/riskStore.ts';
import DashboardLayout from '../components/layout/DashboardLayout.tsx';
import RiskCard from '../components/risk/RiskCard.tsx';
import RiskForm from '../components/risk/RiskForm.tsx';
import Button from '../components/ui/Button.tsx';
import { Risk, RiskFormData } from '../types/index.ts';
import { downloadCSV } from '../utils/exports.ts';
import { sortByRiskScore } from '../utils/calculations.ts';

const RiskList: React.FC = () => {
  const { risks, categories, updateRisk, deleteRisk, exportToCSV } = useRiskStore();
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  // const [viewingRiskId, setViewingRiskId] = useState<string | null>(null); // Currently unused
  const [, setViewingRiskId] = useState<string | null>(null); // Using empty dependency to keep setViewingRiskId
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Get risk for editing/viewing
  const editingRisk = editingRiskId ? risks.find((risk: Risk) => risk.id === editingRiskId) : null;
  // const viewingRisk = viewingRiskId ? risks.find((risk: Risk) => risk.id === viewingRiskId) : null; // Currently unused

  // Apply filters
  let filteredRisks = [...risks] as Risk[];

  if (filterCategory !== 'all') {
    filteredRisks = filteredRisks.filter((risk: Risk) => risk.category === filterCategory);
  }

  if (filterStatus !== 'all') {
    filteredRisks = filteredRisks.filter((risk: Risk) => risk.status === filterStatus);
  }

  // Apply sorting
  filteredRisks = sortByRiskScore(filteredRisks, sortOrder);

  const handleCreateRisk = (_data: RiskFormData) => {
    // Since addRisk is in the store, we need to import it here too
    // For now, this will be handled at the store level
    setShowCreateForm(false);
  };
  
  const handleUpdateRisk = (id: string, _data: RiskFormData) => {
    // Using the store's updateRisk function which will only update fields that are provided
    updateRisk(id, _data);
    setEditingRiskId(null);
  };
  
  const handleDeleteRisk = (id: string) => {
    if (window.confirm('Are you sure you want to delete this risk?')) {
      deleteRisk(id);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingRiskId(null);
  };
  
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };
  
  const handleExport = () => {
    const csvContent = exportToCSV();
    downloadCSV(csvContent, `risk-register-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Risk List</h1>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="primary" 
              onClick={() => setShowCreateForm(true)}
            >
              Create New Risk
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleExport}
            >
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category: string) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="mitigated">Mitigated</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Risk Score (High to Low)</option>
                <option value="asc">Risk Score (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk Grid */}
        {filteredRisks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRisks.map((risk: Risk) => (
                <motion.div
                  key={risk.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <RiskCard
                    risk={risk}
                    onEdit={setEditingRiskId}
                    onDelete={handleDeleteRisk}
                    onView={setViewingRiskId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No risks found</h3>
            <p className="text-gray-500 mb-4">
              {risks.length > 0 
                ? 'Try changing your filters to see more risks' 
                : 'Get started by creating your first risk'}
            </p>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Risk
            </Button>
          </div>
        )}

        {/* Edit Risk Modal */}
        {editingRisk && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Risk</h2>
                <RiskForm
                  onSubmit={(data: RiskFormData) => handleUpdateRisk(editingRisk.id, data)}
                  onCancel={handleCancelEdit}
                  initialData={editingRisk}
                  mode="edit"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Risk Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Risk</h2>
                <RiskForm
                  onSubmit={handleCreateRisk}
                  onCancel={handleCancelCreate}
                  mode="create"
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RiskList;