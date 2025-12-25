import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import type { Risk } from '../../types/risk';
import { ensureChartJsRegistered } from '../charts/chartjs';

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialRiskTrendProps {
  risks: Risk[];
  currency?: string;
}

export const FinancialRiskTrend: React.FC<FinancialRiskTrendProps> = ({ 
  risks, 
  currency = 'USD' 
}) => {
  ensureChartJsRegistered();

  // Generate mock financial trend data based on risks
  const trendData = useMemo(() => {
    // Create 12 months of data for demonstration
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Generate mock financial impact data based on risk scores
    const financialImpact = months.map((_, index) => {
      // Base impact on risk count and average risk score
      const baseImpact = risks.length * 1000; // Base on number of risks
      const avgRiskScore = risks.length > 0 
        ? risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length 
        : 0;
      
      // Add some variation based on month index
      const variation = (Math.sin(index * 0.5) * 0.3 + 0.7); // 70-130% of base
      return Math.round(baseImpact * avgRiskScore * variation);
    });
    
    // Generate risk mitigation cost trend
    const mitigationCosts = months.map((_, index) => {
      // Simulate increasing investment in risk mitigation over time
      return Math.round(500 * (index + 1) * 1.1); // Increasing trend
    });
    
    // Calculate net risk exposure (financial impact - mitigation costs)
    const netExposure = financialImpact.map((impact, index) => 
      Math.max(0, impact - mitigationCosts[index])
    );
    
    return {
      labels: months,
      datasets: [
        {
          label: `Potential Financial Impact (${currency})`,
          data: financialImpact,
          borderColor: 'rgb(239, 68, 68)', // Red for high risk
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: `Mitigation Investment (${currency})`,
          data: mitigationCosts,
          borderColor: 'rgb(34, 197, 94)', // Green for investment
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: `Net Risk Exposure (${currency})`,
          data: netExposure,
          borderColor: 'rgb(59, 130, 246)', // Blue for net exposure
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
        },
      ],
    };
  }, [risks, currency]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Risk Trend Analysis',
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${currency} ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
        },
        grid: {
          display: false,
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `Amount (${currency})`,
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-high">Financial Risk Trend Visualization</h3>
        <p className="mt-1 text-sm text-text-low">
          Track potential financial impact over time with mitigation investments
        </p>
      </div>
      
      <div className="h-80 w-full">
        <Line data={trendData} options={options} />
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-red-50/30 border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Potential Impact</h4>
          <p className="text-2xl font-bold text-red-800">
            {currency} {trendData.datasets[0].data[11]?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-sm text-red-700">Current estimated financial impact</p>
        </div>
        
        <div className="p-4 rounded-lg bg-green-50/30 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Mitigation Investment</h4>
          <p className="text-2xl font-bold text-green-800">
            {currency} {trendData.datasets[1].data[11]?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-sm text-green-700">Current mitigation investment</p>
        </div>
        
        <div className="p-4 rounded-lg bg-blue-50/30 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Net Exposure</h4>
          <p className="text-2xl font-bold text-blue-800">
            {currency} {trendData.datasets[2].data[11]?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-sm text-blue-700">Net financial risk exposure</p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-text-medium">
        <p className="font-semibold">Insight:</p>
        <p>
          This visualization shows the trend of potential financial impact from risks, 
          mitigation investments over time, and the resulting net risk exposure. 
          As mitigation investments increase, the net risk exposure should decrease, 
          demonstrating the financial value of risk management.
        </p>
      </div>
    </div>
  );
};