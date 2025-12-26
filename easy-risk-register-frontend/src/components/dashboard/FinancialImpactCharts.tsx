import React, { useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { Risk } from '../../types/risk';
import { ensureChartJsRegistered } from '../charts/chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface FinancialImpactChartsProps {
  risks: Risk[];
}

const FinancialImpactCharts: React.FC<FinancialImpactChartsProps> = ({ risks }) => {
  useEffect(() => {
    ensureChartJsRegistered();
  }, []);

  // Prepare data for financial impact by category
  const financialImpactByCategory = risks.reduce((acc: Array<{category: string, impact: number}>, risk) => {
    const category = risk.category || 'Uncategorized';
    const existing = acc.find(item => item.category === category);
    const impact = risk.financialImpact?.expectedMean ?? 0;
    
    if (existing) {
      existing.impact += impact;
    } else {
      acc.push({ category, impact });
    }
    return acc;
  }, []);

  // Prepare data for financial impact by risk level
  const financialImpactByRiskLevel = risks.reduce((acc: Array<{level: string, impact: number}>, risk) => {
    let level = '';
    if (risk.riskScore > 6) {
      level = 'High';
    } else if (risk.riskScore >= 4) {
      level = 'Medium';
    } else {
      level = 'Low';
    }
    
    const existing = acc.find(item => item.level === level);
    const impact = risk.financialImpact?.expectedMean ?? 0;
    
    if (existing) {
      existing.impact += impact;
    } else {
      acc.push({ level, impact });
    }
    return acc;
  }, []);

  // Prepare data for trend analysis (simulated over time)
  const trendData = [
    { month: 'Jan', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 0.8 },
    { month: 'Feb', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 0.85 },
    { month: 'Mar', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 0.9 },
    { month: 'Apr', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 0.95 },
    { month: 'May', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) },
    { month: 'Jun', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.1 },
    { month: 'Jul', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.15 },
    { month: 'Aug', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.2 },
    { month: 'Sep', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.18 },
    { month: 'Oct', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.25 },
    { month: 'Nov', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.3 },
    { month: 'Dec', impact: risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) * 1.35 },
  ];

  // Chart data for financial impact by category
  const categoryChartData = {
    labels: financialImpactByCategory.map(item => item.category),
    datasets: [
      {
        label: 'Financial Impact ($)',
        data: financialImpactByCategory.map(item => item.impact),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for financial impact by risk level
  const riskLevelChartData = {
    labels: financialImpactByRiskLevel.map(item => item.level),
    datasets: [
      {
        label: 'Financial Impact ($)',
        data: financialImpactByRiskLevel.map(item => item.impact),
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)', // High - red
          'rgba(245, 158, 11, 0.5)', // Medium - yellow
          'rgba(34, 197, 94, 0.5)', // Low - green
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)', // High - red
          'rgba(245, 158, 11, 1)', // Medium - yellow
          'rgba(34, 197, 94, 1)', // Low - green
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for trend analysis
  const trendChartData = {
    labels: trendData.map(item => item.month),
    datasets: [
      {
        label: 'Financial Impact Trend ($)',
        data: trendData.map(item => item.impact),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return '$' + value.toLocaleString();
            }
            return value;
          }
        }
      }
    }
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return '$' + value.toLocaleString();
            }
            return value;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Impact by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Financial Impact by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={categoryChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact by Risk Level */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Financial Impact by Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={riskLevelChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Impact Trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Financial Impact Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Line data={trendChartData} options={trendChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                ${risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-2">Total Financial Impact</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${risks.length > 0 
                  ? (risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0) / risks.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                  : '0'}
              </div>
              <div className="text-sm text-gray-600 mt-2">Average Financial Impact</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {risks.filter(risk => (risk.financialImpact?.expectedMean ?? 0) > 0).length}
              </div>
              <div className="text-sm text-gray-600 mt-2">Risks with Financial Impact</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialImpactCharts;
