// src/components/risk/RiskCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Risk } from '../../types';
import { getRiskColor, getRiskSeverity, formatDate } from '../../utils/calculations';
import Button from '../ui/Button';

interface RiskCardProps {
  risk: Risk;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk, onEdit, onDelete, onView }) => {
  const riskColor = getRiskColor(risk.riskScore);
  const riskSeverity = getRiskSeverity(risk.riskScore);

  const getRiskColorClass = () => {
    switch (riskColor) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{risk.title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{risk.description}</p>
          </div>
          <div className={`ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColorClass()}`}>
            {risk.riskScore} - {riskSeverity}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">{risk.category}</span>
            <span>{risk.probability} × {risk.impact}</span>
          </div>
          <span className="text-xs text-gray-400">{formatDate(risk.creationDate)}</span>
        </div>

        <div className="mt-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => onView(risk.id)}>
            View
          </Button>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(risk.id)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(risk.id)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskCard;