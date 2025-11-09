// src/pages/RiskList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from '../components/risk/RiskCard';
import { useRiskStore } from '../stores/riskStore';
import type { Risk } from '../types';

const RiskList: React.FC = () => {
  const navigate = useNavigate();
  const risks = useRiskStore(state => state.risks);
  const deleteRisk = useRiskStore(state => state.deleteRisk);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>(risks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Risk; direction: 'asc' | 'desc' } | null>(null);

  const categories = Array.from(new Set(risks.map(risk => risk.category)));

  // Apply filters and sorting
  useEffect(() => {
    let result = [...risks];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(risk => 
        risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(risk => risk.category === selectedCategory);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(risk => risk.status === selectedStatus);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredRisks(result);
  }, [risks, searchTerm, selectedCategory, selectedStatus, sortConfig]);



  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this risk?')) {
      deleteRisk(id);
    }
  };

  const handleView = (id: string) => {
    navigate(`/risks/${id}`);
  };

  const handleSort = (key: keyof Risk) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (id: string) => {
    // Form editing happens in App.tsx, navigate to edit page if needed
    console.log(`Editing risk with ID: ${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Register</h1>
          <p className="text-gray-600 mt-2">Manage and track all project risks in one place</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block font-medium shadow-sm transition-colors duration-200 whitespace-nowrap"
        >
          + Create New Risk
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Risks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search risks..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="mitigated">Mitigated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Cards */}
      {filteredRisks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No risks found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {risks.length === 0
              ? "You don't have any risks yet. Create your first risk to get started."
              : "No risks match your current filters. Try adjusting your search criteria."}
          </p>
          {risks.length === 0 && (
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block font-medium shadow-sm"
            >
              Create Your First Risk
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="text-sm font-medium text-gray-700 self-center">Sort by:</span>
            <button
              onClick={() => handleSort('title')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
            >
              Title
            </button>
            <button
              onClick={() => handleSort('riskScore')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
            >
              Risk Score
            </button>
            <button
              onClick={() => handleSort('probability')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
            >
              Probability
            </button>
            <button
              onClick={() => handleSort('impact')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
            >
              Impact
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRisks.map(risk => (
              <RiskCard
                key={risk.id}
                risk={risk}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Risk Count Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Showing {filteredRisks.length} of {risks.length} risks
      </div>
    </div>
  );
};

export default RiskList;