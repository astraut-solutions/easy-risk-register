import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import RiskList from './pages/RiskList';
import RiskDetail from './pages/RiskDetail';
import RiskForm from './components/risk/RiskForm';
import { useRiskStore } from './stores/riskStore';
import { useState } from 'react';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);

  const handleSubmitRisk = (data: any) => {
    const addRisk = useRiskStore.getState().addRisk;
    const updateRisk = useRiskStore.getState().updateRisk;
    
    if (editingRisk) {
      updateRisk(editingRisk.id, data);
    } else {
      addRisk(data);
    }
    
    setShowForm(false);
    setEditingRisk(null);
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRisk(null);
  };

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={
            showForm ? (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <RiskForm
                  onSubmit={handleSubmitRisk}
                  onCancel={handleCancelForm}
                  initialData={editingRisk || undefined}
                  mode={editingRisk ? 'edit' : 'create'}
                />
              </div>
            ) : (
              <Dashboard />
            )
          } />
          <Route path="/risks" element={
            showForm ? (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <RiskForm
                  onSubmit={handleSubmitRisk}
                  onCancel={handleCancelForm}
                  initialData={editingRisk || undefined}
                  mode={editingRisk ? 'edit' : 'create'}
                />
              </div>
            ) : (
              <RiskList />
            )
          } />
          <Route path="/risks/:id" element={<RiskDetail />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
