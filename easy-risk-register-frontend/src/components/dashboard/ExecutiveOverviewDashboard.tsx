import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { StatCard, Badge, Card } from '../../design-system';
import type { Risk } from '../../types/risk';
import type { RiskScoreSnapshot } from '../../types/visualization';
import { timeSeriesService } from '../../services/timeSeriesService';
import { getRiskSeverity } from '../../utils/riskCalculations';

interface ExecutiveOverviewDashboardProps {
  risks: Risk[];
  snapshots: RiskScoreSnapshot[];
  onDrillDown?: (target: { filters: Partial<any>; label: string }) => void;
}

const ExecutiveOverviewDashboard: React.FC<ExecutiveOverviewDashboardProps> = ({
  risks,
  onDrillDown
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [serverAvgScoreByDate, setServerAvgScoreByDate] = useState<Record<string, number> | null>(null);

  // Calculate key executive metrics
    const executiveMetrics = useMemo(() => {
    const totalRisks = risks.length;
    const highRisks = risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'high').length;
    const mediumRisks = risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'medium').length;
    const lowRisks = risks.filter((risk) => (risk.severity ?? getRiskSeverity(risk.riskScore)) === 'low').length;
    const openRisks = risks.filter(risk => risk.status !== 'mitigated').length;
    const totalFinancialImpact = risks.reduce((sum, risk) => sum + (risk.financialImpact?.expectedMean ?? 0), 0);
    const avgRiskScore = totalRisks > 0
      ? risks.reduce((sum, risk) => sum + risk.riskScore, 0) / totalRisks
      : 0;

    return {
      totalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      openRisks,
      totalFinancialImpact,
      avgRiskScore: parseFloat(avgRiskScore.toFixed(2))
    };
  }, [risks]);

  // Risk distribution by severity
  const riskDistribution = [
    { name: 'High', value: executiveMetrics.highRisks, color: '#ef4444' },
    { name: 'Medium', value: executiveMetrics.mediumRisks, color: '#f59e0b' },
    { name: 'Low', value: executiveMetrics.lowRisks, color: '#10b981' },
  ];

  // Risk distribution by category
  const categoryDistribution = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    risks.forEach(risk => {
      const category = risk.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));
  }, [risks]);

  // Financial impact by category
  const financialImpactByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    risks.forEach(risk => {
      const category = risk.category || 'Uncategorized';
      const impact = risk.financialImpact?.expectedMean ?? 0;
      categoryMap[category] = (categoryMap[category] || 0) + impact;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      impact: value
    }));
  }, [risks]);

  // Prepare trend data
  const getTrendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    const trendData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count risks created on this date
      const risksOnDate = risks.filter(risk => {
        let riskDate: Date | null = null;

        if (risk.creationDate) {
          riskDate = new Date(risk.creationDate);
        } else if (risk.lastModified) {
          riskDate = new Date(risk.lastModified);
        }

        if (!riskDate || isNaN(riskDate.getTime())) {
          return false;
        }

        return riskDate.toISOString().split('T')[0] === dateStr;
      }).length;

      // Calculate average risk score on this date
      const risksForScore = risks.filter(risk => {
        let riskDate: Date | null = null;

        if (risk.creationDate) {
          riskDate = new Date(risk.creationDate);
        } else if (risk.lastModified) {
          riskDate = new Date(risk.lastModified);
        }

        if (!riskDate || isNaN(riskDate.getTime())) {
          return false;
        }

        return riskDate.toISOString().split('T')[0] === dateStr;
      });

      const avgScore = risksForScore.length > 0
        ? risksForScore.reduce((sum, risk) => sum + risk.riskScore, 0) / risksForScore.length
        : 0;

      trendData.push({
        date: timeRange === '7d'
          ? date.toLocaleDateString(undefined, { weekday: 'short' })
          : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        newRisks: risksOnDate,
        avgRiskScore: parseFloat(avgScore.toFixed(2)),
        _isoDate: dateStr,
      });
    }

    return trendData;
  }, [risks, timeRange]);

  const mergedTrendData = useMemo(() => {
    if (!serverAvgScoreByDate) return getTrendData;
    return getTrendData.map((point: any) => ({
      ...point,
      avgRiskScore:
        typeof serverAvgScoreByDate[point._isoDate] === 'number'
          ? serverAvgScoreByDate[point._isoDate]
          : point.avgRiskScore,
    }));
  }, [getTrendData, serverAvgScoreByDate]);

  useEffect(() => {
    const enabled = import.meta.env.VITE_ENABLE_TIMESERIES === 'true';
    if (!enabled) {
      setServerAvgScoreByDate(null);
      return;
    }

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    let cancelled = false;

    (async () => {
      const points = await timeSeriesService.query({ startDate: start, endDate: now, limit: 5000 });
      if (cancelled) return;

      const sums: Record<string, { total: number; count: number }> = {};
      for (const p of points) {
        const d = new Date(p.timestamp);
        if (Number.isNaN(d.getTime())) continue;
        const iso = d.toISOString().split('T')[0];
        if (!sums[iso]) sums[iso] = { total: 0, count: 0 };
        sums[iso].total += p.riskScore;
        sums[iso].count += 1;
      }

      const avgs: Record<string, number> = {};
      for (const [iso, agg] of Object.entries(sums)) {
        avgs[iso] = parseFloat((agg.total / agg.count).toFixed(2));
      }

      setServerAvgScoreByDate(Object.keys(avgs).length ? avgs : null);
    })().catch(() => {
      if (!cancelled) setServerAvgScoreByDate(null);
    });

    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  // Color palette for charts
  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#f59e0b', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <StatCard
            label="Total Risks"
            value={executiveMetrics.totalRisks}
            description="All identified risks in the register"
            accent="brand"
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            label="High Risks"
            value={executiveMetrics.highRisks}
            description="Critical risks requiring immediate attention"
            accent="danger"
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <StatCard
            label="Open Risks"
            value={executiveMetrics.openRisks}
            description="Active risks that require action"
            accent="warning"
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            label="Avg Risk Score"
            value={executiveMetrics.avgRiskScore}
            description="Average probability x impact score"
            accent="brand"
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <StatCard
            label="Financial Impact"
            value={`$${executiveMetrics.totalFinancialImpact.toLocaleString()}`}
            description="Total potential financial impact"
            accent="success"
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatCard
            label="Risk Reduction"
            value={`${Math.round((executiveMetrics.highRisks / Math.max(executiveMetrics.totalRisks, 1)) * 100)}%`}
            description="High risk percentage of total"
            accent="danger"
            className="h-full"
          />
        </motion.div>
      </div>

      {/* Risk Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution by Severity */}
        <Card className="p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-high">Risk Distribution by Severity</h3>
            <div className="flex items-center gap-2">
              <Badge tone="danger">High: {executiveMetrics.highRisks}</Badge>
              <Badge tone="warning">Medium: {executiveMetrics.mediumRisks}</Badge>
              <Badge tone="success">Low: {executiveMetrics.lowRisks}</Badge>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Distribution by Category */}
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-high mb-6">Risk Distribution by Category</h3>
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
                <Bar dataKey="value" name="Risk Count">
                  {categoryDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Financial Impact and Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Impact by Category */}
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-high mb-6">Financial Impact by Category</h3>
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
        </Card>

        {/* Risk Trend Over Time */}
        <Card className="p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-high">Risk Trend Over Time</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === '7d'
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-secondary text-text-low hover:bg-surface-tertiary'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === '30d'
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-secondary text-text-low hover:bg-surface-tertiary'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === '90d'
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-secondary text-text-low hover:bg-surface-tertiary'
                }`}
              >
                90D
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mergedTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="newRisks"
                  stroke="#3b82f6"
                  name="New Risks"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRiskScore"
                  stroke="#ef4444"
                  name="Avg Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Executive Actions */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-high mb-4">Executive Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary">
            <h4 className="font-semibold text-text-high mb-2">Risk Prioritization</h4>
            <p className="text-sm text-text-low mb-3">
              Focus on high-impact, high-probability risks that affect critical business operations.
            </p>
            <button
              className="text-sm text-brand-primary font-medium hover:underline"
              onClick={() => onDrillDown && onDrillDown({ filters: { severity: 'high' }, label: 'Show high risks' })}
            >
              View High-Risk Items →
            </button>
          </div>

          <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary">
            <h4 className="font-semibold text-text-high mb-2">Resource Allocation</h4>
            <p className="text-sm text-text-low mb-3">
              Allocate budget and resources based on financial impact and risk severity.
            </p>
            <button
              className="text-sm text-brand-primary font-medium hover:underline"
              onClick={() => onDrillDown && onDrillDown({ filters: { financialImpact: { min: 100000 } }, label: 'Show high financial impact risks' })}
            >
              View Financial Impact →
            </button>
          </div>

          <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary">
            <h4 className="font-semibold text-text-high mb-2">Compliance Status</h4>
            <p className="text-sm text-text-low mb-3">
              Track compliance-related risks and ensure regulatory requirements are met.
            </p>
            <button
              className="text-sm text-brand-primary font-medium hover:underline"
              onClick={() => onDrillDown && onDrillDown({ filters: { category: 'compliance' }, label: 'Show compliance risks' })}
            >
              View Compliance Risks →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveOverviewDashboard;
