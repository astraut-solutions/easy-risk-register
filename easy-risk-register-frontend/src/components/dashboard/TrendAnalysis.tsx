import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { Risk } from '../../types/risk';
import type { RiskScoreSnapshot } from '../../types/visualization';

interface TrendAnalysisProps {
  risks: Risk[];
  snapshots: RiskScoreSnapshot[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ risks, snapshots }) => {
  const trendChartRef = useRef<HTMLDivElement>(null);
  const riskScoreChartRef = useRef<HTMLDivElement>(null);
  const financialImpactChartRef = useRef<HTMLDivElement>(null);
  const categoryTrendChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trendChartRef.current) {
      const chart = echarts.init(trendChartRef.current);

      // Prepare trend data
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

        trendData.push({
          date: date.getDate() + '/' + (date.getMonth() + 1),
          newRisks: risksOnDate
        });
      }

      const option = {
        title: {
          text: 'Risk Creation Trend'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['New Risks']
        },
        xAxis: {
          type: 'category',
          data: trendData.map(item => item.date)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'New Risks',
            type: 'line',
            data: trendData.map(item => item.newRisks),
            smooth: true,
            itemStyle: {
              color: '#3b82f6'
            }
          }
        ]
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [risks]);

  useEffect(() => {
    if (riskScoreChartRef.current) {
      const chart = echarts.init(riskScoreChartRef.current);

      // Prepare risk score trend data
      const now = new Date();
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Get average risk score for this date
        const risksForDate = risks.filter(risk => {
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

        const avgScore = risksForDate.length > 0
          ? risksForDate.reduce((sum, risk) => sum + risk.riskScore, 0) / risksForDate.length
          : 0;

        trendData.push({
          date: date.getDate() + '/' + (date.getMonth() + 1),
          avgScore: parseFloat(avgScore.toFixed(2))
        });
      }

      const option = {
        title: {
          text: 'Average Risk Score Trend'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Average Risk Score']
        },
        xAxis: {
          type: 'category',
          data: trendData.map(item => item.date)
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 10
        },
        series: [
          {
            name: 'Average Risk Score',
            type: 'line',
            data: trendData.map(item => item.avgScore),
            smooth: true,
            itemStyle: {
              color: '#ef4444'
            }
          }
        ]
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [risks]);

  useEffect(() => {
    if (financialImpactChartRef.current) {
      const chart = echarts.init(financialImpactChartRef.current);

      // Prepare financial impact trend data
      const now = new Date();
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Get total financial impact for this date
        const totalImpact = risks
          .filter(risk => {
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
          })
          .reduce((sum, risk) => sum + (risk.financialImpact || 0), 0);

        trendData.push({
          date: date.getDate() + '/' + (date.getMonth() + 1),
          impact: totalImpact
        });
      }

      const option = {
        title: {
          text: 'Financial Impact Trend'
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const param = params[0];
            return `${param.name}<br />$${param.value.toLocaleString()}`;
          }
        },
        legend: {
          data: ['Financial Impact']
        },
        xAxis: {
          type: 'category',
          data: trendData.map(item => item.date)
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => `$${value.toLocaleString()}`
          }
        },
        series: [
          {
            name: 'Financial Impact',
            type: 'line',
            data: trendData.map(item => item.impact),
            smooth: true,
            itemStyle: {
              color: '#10b981'
            }
          }
        ]
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [risks]);

  useEffect(() => {
    if (categoryTrendChartRef.current) {
      const chart = echarts.init(categoryTrendChartRef.current);

      // Prepare category trend data
      const categories = Array.from(new Set(risks.map(risk => risk.category || 'Uncategorized')));
      const now = new Date();
      const seriesData = categories.map(category => {
        const categoryData = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const count = risks.filter(risk => {
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

            return riskDate.toISOString().split('T')[0] === dateStr &&
                   (risk.category === category || (!risk.category && category === 'Uncategorized'));
          }).length;

          categoryData.push(count);
        }
        return {
          name: category,
          type: 'line',
          stack: 'Total',
          data: categoryData,
          smooth: true
        };
      });

      const dates = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.getDate() + '/' + (date.getMonth() + 1));
      }

      const option = {
        title: {
          text: 'Risk Distribution by Category Over Time'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: categories,
          type: 'scroll',
          bottom: 0
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: {
          type: 'value'
        },
        series: seriesData
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [risks]);

  // Calculate summary statistics
  const totalRisks = risks.length;
  const avgRiskScore = risks.length > 0 
    ? (risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length).toFixed(2) 
    : '0.00';
  const totalFinancialImpact = risks.reduce((sum, risk) => sum + (risk.financialImpact || 0), 0);
  const highRiskCount = risks.filter(risk => risk.riskScore > 6).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalRisks}</div>
              <div className="text-sm text-gray-600 mt-2">Total Risks</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{highRiskCount}</div>
              <div className="text-sm text-gray-600 mt-2">High Risk Items</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{avgRiskScore}</div>
              <div className="text-sm text-gray-600 mt-2">Average Risk Score</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">${totalFinancialImpact.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-2">Total Financial Impact</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Creation Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Risk Creation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={trendChartRef} className="h-80 w-full" />
          </CardContent>
        </Card>

        {/* Average Risk Score Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Average Risk Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={riskScoreChartRef} className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Impact Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Financial Impact Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={financialImpactChartRef} className="h-80 w-full" />
          </CardContent>
        </Card>

        {/* Category Distribution Over Time */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Category Distribution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={categoryTrendChartRef} className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Additional Trend Analysis */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Advanced Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Risk Severity Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>High Risk (7-10)</span>
                  <span>{risks.filter(r => r.riskScore > 6).length} ({((risks.filter(r => r.riskScore > 6).length / risks.length) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-red-600 h-2.5 rounded-full" 
                    style={{ width: `${(risks.filter(r => r.riskScore > 6).length / risks.length) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between">
                  <span>Medium Risk (4-6)</span>
                  <span>{risks.filter(r => r.riskScore >= 4 && r.riskScore <= 6).length} ({((risks.filter(r => r.riskScore >= 4 && r.riskScore <= 6).length / risks.length) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${(risks.filter(r => r.riskScore >= 4 && r.riskScore <= 6).length / risks.length) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between">
                  <span>Low Risk (1-3)</span>
                  <span>{risks.filter(r => r.riskScore < 4).length} ({((risks.filter(r => r.riskScore < 4).length / risks.length) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${(risks.filter(r => r.riskScore < 4).length / risks.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Top Risk Categories</h4>
              <ul className="space-y-2">
                {Array.from(
                  risks.reduce((acc, risk) => {
                    const category = risk.category || 'Uncategorized';
                    acc.set(category, (acc.get(category) || 0) + 1);
                    return acc;
                  }, new Map<string, number>())
                )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, count]) => (
                  <li key={category} className="flex justify-between">
                    <span>{category}</span>
                    <span>{count} risks</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendAnalysis;