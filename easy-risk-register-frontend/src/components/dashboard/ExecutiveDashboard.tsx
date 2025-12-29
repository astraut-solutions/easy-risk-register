import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { Risk } from '../../types/risk';
import type { RiskFilters } from '../../types/risk';
import type { RiskScoreSnapshot } from '../../types/visualization';
import { getRiskSeverity } from '../../utils/riskCalculations';

interface ExecutiveDashboardProps {
  risks: Risk[];
  snapshots: RiskScoreSnapshot[];
  onDrillDown?: (target: { filters: Partial<RiskFilters>; label: string }) => void;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ risks, snapshots: _snapshots, onDrillDown }) => {
  // Calculate risk distribution by severity
  const riskDistribution = [
    { name: 'High', value: risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'high').length },
    { name: 'Medium', value: risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'medium').length },
    { name: 'Low', value: risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'low').length },
  ];

  // Calculate risk distribution by category
  const categoryDistribution = risks.reduce((acc: Array<{name: string, value: number}>, risk) => {
    const category = risk.category || 'Uncategorized';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  // Calculate financial impact by category
  const financialImpactByCategory = risks.reduce((acc: Array<{name: string, impact: number}>, risk) => {
    const category = risk.category || 'Uncategorized';
    const existing = acc.find(item => item.name === category);
    const impact = risk.financialImpact?.expectedMean ?? 0;
    if (existing) {
      existing.impact += impact;
    } else {
      acc.push({ name: category, impact });
    }
    return acc;
  }, []);

  // Prepare trend data for the last 30 days
  const getTrendData = () => {
    const now = new Date();
    const trendData = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count risks created on this date
      const risksOnDate = risks.filter(risk => {
        // Try to get a valid date from risk properties
        let riskDate: Date | null = null;

        if (risk.creationDate) {
          riskDate = new Date(risk.creationDate);
        } else if (risk.lastModified) {
          riskDate = new Date(risk.lastModified);
        } else if (risk.createdAt) {
          riskDate = new Date(risk.createdAt);
        } else if (risk.updatedAt) {
          riskDate = new Date(risk.updatedAt);
        }

        // Check if the date is valid
        if (!riskDate || isNaN(riskDate.getTime())) {
          return false;
        }

        return riskDate.toISOString().split('T')[0] === dateStr;
      }).length;

      // Calculate average risk score on this date
      const risksForScore = risks.filter(risk => {
        // Try to get a valid date from risk properties
        let riskDate: Date | null = null;

        if (risk.creationDate) {
          riskDate = new Date(risk.creationDate);
        } else if (risk.lastModified) {
          riskDate = new Date(risk.lastModified);
        } else if (risk.createdAt) {
          riskDate = new Date(risk.createdAt);
        } else if (risk.updatedAt) {
          riskDate = new Date(risk.updatedAt);
        }

        // Check if the date is valid
        if (!riskDate || isNaN(riskDate.getTime())) {
          return false;
        }

        return riskDate.toISOString().split('T')[0] === dateStr;
      });

      const avgScore = risksForScore.length > 0
        ? risksForScore.reduce((sum, risk) => sum + risk.riskScore, 0) / risksForScore.length
        : 0;

      trendData.push({
        date: date.getDate() + '/' + (date.getMonth() + 1),
        newRisks: risksOnDate,
        avgRiskScore: parseFloat(avgScore.toFixed(2))
      });
    }

    return trendData;
  };

  const trendData = getTrendData();

  // Colors for charts
  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Risks Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDrillDown && onDrillDown({ filters: {}, label: 'Show all risks' })}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.length}</div>
            <p className="text-xs text-gray-500 mt-1">All identified risks</p>
          </CardContent>
        </Card>

        {/* High Risk Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDrillDown && onDrillDown({ filters: { severity: 'high' }, label: 'Show high risks' })}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">High Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{risks.filter((r) => (r.severity ?? getRiskSeverity(r.riskScore)) === 'high').length}</div>
            <p className="text-xs text-gray-500 mt-1">Critical attention required</p>
          </CardContent>
        </Card>

        {/* Medium Risk Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDrillDown && onDrillDown({ filters: { severity: 'medium' }, label: 'Show medium risks' })}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Medium Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{risks.filter((r) => (r.severity ?? getRiskSeverity(r.riskScore)) === 'medium').length}</div>
            <p className="text-xs text-gray-500 mt-1">Monitor and mitigate</p>
          </CardContent>
        </Card>

        {/* Low Risk Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDrillDown && onDrillDown({ filters: { severity: 'low' }, label: 'Show low risks' })}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Low Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{risks.filter((r) => (r.severity ?? getRiskSeverity(r.riskScore)) === 'low').length}</div>
            <p className="text-xs text-gray-500 mt-1">Acceptable levels</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution by Severity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Risk Distribution by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Risk Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Risk Count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Impact by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Financial Impact by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialImpactByCategory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Financial Impact']} />
                  <Legend />
                  <Bar dataKey="impact" name="Financial Impact ($)" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Trend Over Time */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Risk Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="newRisks" stroke="#3b82f6" name="New Risks" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgRiskScore" stroke="#ef4444" name="Avg Risk Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
