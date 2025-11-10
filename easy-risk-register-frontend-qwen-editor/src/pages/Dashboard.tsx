// src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRiskStore } from '../stores/riskStore.ts';
import DashboardLayout from '../components/layout/DashboardLayout.tsx';
import RiskMatrix from '../components/risk/RiskMatrix.tsx';
import RiskForm from '../components/risk/RiskForm.tsx';
import Button from '../components/ui/Button.tsx';
import { Risk, RiskFormData } from '../types/index.ts';
import { sortByRiskScore } from '../utils/calculations.ts';

const Dashboard: React.FC = () => {
  const { risks, addRisk } = useRiskStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Calculate summary metrics
  const totalRisks = risks.length;
  const highRiskRisks = risks.filter((risk: Risk) => risk.riskScore > 6).length;
  const openRisks = risks.filter((risk: Risk) => risk.status === 'open').length;

  // Get top risks by score
  const topRisks = sortByRiskScore(risks as Risk[]).slice(0, 3);

  const handleCreateRisk = (data: RiskFormData) => {
    addRisk(data);
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Risk
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <h3 className="text-lg font-medium text-gray-900">Total Risks</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{totalRisks}</p>
            <p className="mt-1 text-sm text-gray-500">All registered risks</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <h3 className="text-lg font-medium text-gray-900">High Priority</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">{highRiskRisks}</p>
            <p className="mt-1 text-sm text-gray-500">Risks with score {'> 6'}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <h3 className="text-lg font-medium text-gray-900">Open Risks</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{openRisks}</p>
            <p className="mt-1 text-sm text-gray-500">Active risks requiring attention</p>
          </motion.div>
        </div>

        {/* Risk Matrix Visualization */}
        <div className="mb-8">
          <RiskMatrix risks={risks as Risk[]} />
        </div>

        {/* Top Risks */}
        {topRisks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Risks</h2>
            <div className="space-y-4">
              {topRisks.map((risk: Risk) => (
                <div key={risk.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{risk.title}</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {risk.riskScore} - {risk.probability}×{risk.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{risk.description}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">{risk.category}</span>
                    <span>{risk.status}</span>
                  </div>
                </div>
              ))}
            </div>
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

export default Dashboard;