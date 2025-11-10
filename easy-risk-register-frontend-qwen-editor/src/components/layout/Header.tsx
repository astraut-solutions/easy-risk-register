// src/components/layout/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Easy Risk Register</h1>
        </div>
        <nav className="flex space-x-6">
          <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</a>
          <a href="/risks" className="text-gray-600 hover:text-gray-900 font-medium">Risks</a>
          <a href="/reports" className="text-gray-600 hover:text-gray-900 font-medium">Reports</a>
          <a href="/settings" className="text-gray-600 hover:text-gray-900 font-medium">Settings</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;