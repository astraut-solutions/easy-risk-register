// src/components/risk/RiskCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Risk } from '../../types';

interface RiskCardProps {
  risk: Risk;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const getRiskColor = (score: number): string => {
    if (score <= 3) return 'bg-green-100 text-green-800 border-green-200'; // Low
    if (score <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Medium
    return 'bg-red-100 text-red-800 border-red-200'; // High
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/risks/${risk.id}`);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-250 ease-out bg-white h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 truncate"
            onClick={handleView}
          >
            {risk.title}
          </h3>
          <div className="flex items-center mt-2 space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(risk.riskScore)}`}>
              Risk: {risk.riskScore}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {risk.category}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 ml-2">
          <button
            onClick={() => onEdit(risk.id)}
            className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 transition-colors duration-200"
            aria-label="Edit risk"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(risk.id)}
            className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200"
            aria-label="Delete risk"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-3 flex-grow">
        {risk.description || 'No description provided'}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="flex space-x-3">
          <div className="text-xs text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">Prob:</span> {risk.probability}
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="font-medium">Impact:</span> {risk.impact}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(risk.lastModified)}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          risk.status === 'open' ? 'bg-blue-100 text-blue-800' :
          risk.status === 'mitigated' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
        </span>
        <button
          onClick={handleView}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default RiskCard;