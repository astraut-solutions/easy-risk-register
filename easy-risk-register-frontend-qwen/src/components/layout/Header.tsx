// src/components/layout/Header.tsx
import React from 'react';
import { useRiskStore } from '../../stores/riskStore';
import { downloadCSV } from '../../utils/exports';

const Header: React.FC = () => {
  const exportToCSV = useRiskStore(state => state.exportToCSV);

  const handleExport = () => {
    const csvData = exportToCSV();
    if (csvData) {
      downloadCSV(csvData, `risk-register-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      alert('No risks to export');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Easy Risk Register</h1>
            </div>
            <nav className="ml-10 flex space-x-8">
              <a
                href="/"
                className="text-slate-500 hover:text-slate-700 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-slate-300"
              >
                Dashboard
              </a>
              <a
                href="/risks"
                className="text-slate-500 hover:text-slate-700 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-slate-300"
              >
                Risks
              </a>
            </nav>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleExport}
              className="ml-4 bg-white border border-slate-300 rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;