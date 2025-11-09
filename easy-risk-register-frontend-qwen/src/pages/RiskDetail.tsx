// src/pages/RiskDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRiskStore } from '../stores/riskStore';
import type { Risk } from '../types';

const RiskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const risk = useRiskStore(state => state.getRiskById(id!));
  const updateRisk = useRiskStore(state => state.updateRisk);
  const deleteRisk = useRiskStore(state => state.deleteRisk);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: risk?.title || '',
    description: risk?.description || '',
    probability: risk?.probability || 1,
    impact: risk?.impact || 1,
    category: risk?.category || '',
    status: risk?.status || 'open',
    mitigationPlan: risk?.mitigationPlan || '',
  });

  if (!risk) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Risk not found</h3>
          <p className="text-gray-500 mb-6">The requested risk does not exist or may have been deleted.</p>
          <button
            onClick={() => navigate('/risks')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block font-medium shadow-sm"
          >
            Back to Risk List
          </button>
        </div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      updateRisk(risk.id, editData);
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
      deleteRisk(risk.id);
      navigate('/risks');
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getRiskColor = (score: number): string => {
    if (score <= 3) return 'text-green-600 bg-green-100 border-green-200'; // Low
    if (score <= 6) return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Medium
    return 'text-red-600 bg-red-100 border-red-200'; // High
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/risks')}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Risk List
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-2xl font-bold text-gray-900 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                  placeholder="Risk title"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{risk.title}</h1>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risk.riskScore)}`}>
                  Risk Score: {risk.riskScore}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {risk.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  risk.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  risk.status === 'mitigated' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the risk in detail..."
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {risk.description || 'No description provided.'}
                  </p>
                )}
              </section>

              {/* Mitigation Plan */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mitigation Plan</h2>
                {isEditing ? (
                  <textarea
                    value={editData.mitigationPlan}
                    onChange={(e) => setEditData({...editData, mitigationPlan: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How will this risk be addressed?"
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {risk.mitigationPlan || 'No mitigation plan provided.'}
                  </p>
                )}
              </section>

              {/* Risk Assessment */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Probability</h3>
                    <div className="text-3xl font-bold text-blue-600">{risk.probability}/5</div>
                    <p className="text-sm text-blue-600 mt-1">
                      {isEditing ? (
                        <select
                          value={editData.probability}
                          onChange={(e) => setEditData({...editData, probability: parseInt(e.target.value)})}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">
                          {risk.probability === 1 ? 'Very Low' :
                           risk.probability === 2 ? 'Low' :
                           risk.probability === 3 ? 'Medium' :
                           risk.probability === 4 ? 'High' : 'Very High'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">Impact</h3>
                    <div className="text-3xl font-bold text-purple-600">{risk.impact}/5</div>
                    <p className="text-sm text-purple-600 mt-1">
                      {isEditing ? (
                        <select
                          value={editData.impact}
                          onChange={(e) => setEditData({...editData, impact: parseInt(e.target.value)})}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">
                          {risk.impact === 1 ? 'Very Low' :
                           risk.impact === 2 ? 'Low' :
                           risk.impact === 3 ? 'Medium' :
                           risk.impact === 4 ? 'High' : 'Very High'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Calculated Score</h3>
                    <div className={`text-3xl font-bold ${
                      risk.riskScore <= 3 ? 'text-green-600' :
                      risk.riskScore <= 6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {risk.riskScore}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {risk.riskScore <= 3 ? 'Low Risk' :
                       risk.riskScore <= 6 ? 'Medium Risk' : 'High Risk'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Risk Details */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Details</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.category}
                          onChange={(e) => setEditData({...editData, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        risk.category
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      {isEditing ? (
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value as 'open' | 'mitigated' | 'closed'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Open</option>
                          <option value="mitigated">Mitigated</option>
                          <option value="closed">Closed</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          risk.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          risk.status === 'mitigated' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                        </span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(risk.creationDate)}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(risk.lastModified)}</dd>
                  </div>
                </dl>
              </div>

              {/* Risk Matrix Position */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Matrix Position</h2>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Impact vs Probability</div>
                  <div className="relative h-48 w-full bg-gradient-to-br from-green-50 to-red-50 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div 
                      className="absolute w-4 h-4 rounded-full bg-blue-600 shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${(risk.probability - 1) * 25 + 12.5}%`,
                        top: `${(5 - risk.impact) * 25 + 12.5}%`
                      }}
                      title={`Risk position: Prob ${risk.probability}, Impact ${risk.impact}`}
                    ></div>
                    <div className="text-xs text-gray-500">
                      Prob {risk.probability} × Impact {risk.impact} = Score {risk.riskScore}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-right">High Impact</div>
                    <div></div>
                    <div className="text-left">Low Impact</div>
                    <div className="text-right">Low Prob</div>
                    <div className="text-center">Risk</div>
                    <div className="text-left">High Prob</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDetail;