import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, InputNumber, Space, Button, Select, message, Tabs, Progress, Tag, Input } from 'antd';
import { ROIMeasurementService, SecurityInvestment, ROICalculation } from './ROIMeasurementService';
import { RiskData } from './RiskTranslationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface ROIMeasurementComponentProps {
  riskData: RiskData;
}

const ROIMeasurementComponent: React.FC<ROIMeasurementComponentProps> = ({ riskData }) => {
  const [investments, setInvestments] = useState<SecurityInvestment[]>([
    {
      id: 'siem',
      name: 'SIEM Solution',
      cost: 150000,
      effectiveness: 0.4,
      implementationTime: 6,
      lifecycle: 3
    },
    {
      id: 'edr',
      name: 'Endpoint Detection & Response',
      cost: 100000,
      effectiveness: 0.35,
      implementationTime: 3,
      lifecycle: 5
    },
    {
      id: 'vulnerability',
      name: 'Vulnerability Management',
      cost: 75000,
      effectiveness: 0.25,
      implementationTime: 2,
      lifecycle: 3
    }
  ]);
  
  const [roiCalculations, setRoiCalculations] = useState<ROICalculation[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<string>('siem');
  const [newInvestment, setNewInvestment] = useState<Omit<SecurityInvestment, 'id'>>({
    name: '',
    cost: 0,
    effectiveness: 0,
    implementationTime: 0,
    lifecycle: 0
  });

  useEffect(() => {
    if (investments.length > 0) {
      const calculations = ROIMeasurementService.calculateROIsForInvestments(riskData, investments);
      setRoiCalculations(calculations);
    }
  }, [investments, riskData]);

  const addInvestment = () => {
    if (!newInvestment.name || newInvestment.cost <= 0) {
      message.warning('Please enter a valid investment name and cost');
      return;
    }

    const investment: SecurityInvestment = {
      ...newInvestment,
      id: `inv-${Date.now()}`
    };

    setInvestments([...investments, investment]);
    setNewInvestment({
      name: '',
      cost: 0,
      effectiveness: 0,
      implementationTime: 0,
      lifecycle: 0
    });
    message.success('Investment added successfully');
  };

  const removeInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
    message.success('Investment removed');
  };

  const optimalInvestment = ROIMeasurementService.findOptimalInvestment(riskData, investments);
  const combinedROI = ROIMeasurementService.calculateCombinedROIFromMultipleInvestments(riskData, investments);

  const roiColumns = [
    {
      title: 'Investment',
      dataIndex: ['investment', 'name'],
      key: 'name',
    },
    {
      title: 'Annual Cost',
      dataIndex: ['investment', 'cost'],
      key: 'cost',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Effectiveness',
      dataIndex: ['investment', 'effectiveness'],
      key: 'effectiveness',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Risk Reduction',
      dataIndex: 'riskReduction',
      key: 'riskReduction',
      render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      title: 'Cost Avoidance',
      dataIndex: 'costAvoidance',
      key: 'costAvoidance',
      render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      title: 'Net Benefit',
      dataIndex: 'netBenefit',
      key: 'netBenefit',
      render: (value: number) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Text>
      ),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      render: (value: number) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          {value.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'Payback Period',
      dataIndex: 'paybackPeriod',
      key: 'paybackPeriod',
      render: (value: number) => value === Infinity ? 'N/A' : `${value.toFixed(1)} years`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ROICalculation) => (
        <Button 
          size="small" 
          onClick={() => removeInvestment(record.investment.id)}
          danger
        >
          Remove
        </Button>
      ),
    },
  ];

  // Prepare data for charts
  const chartData = roiCalculations.map(roi => ({
    name: roi.investment.name,
    roi: roi.roi,
    netBenefit: roi.netBenefit,
    riskReduction: roi.riskReduction
  }));

  return (
    <Card 
      title="ROI Measurement for Security Investments" 
      style={{ width: '100%', marginTop: 16 }}
    >
      <Tabs defaultActiveKey="analysis" type="card">
        <TabPane tab="ROI Analysis" key="analysis">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Current Risk Profile</Title>
              <Space size="middle">
                <Text><strong>Risk:</strong> {riskData.riskName}</Text>
                <Text><strong>Probability:</strong> {(riskData.probability * 100).toFixed(1)}%</Text>
                <Text><strong>Impact:</strong> ${riskData.impact.toLocaleString()}</Text>
                <Text><strong>Expected Loss:</strong> ${(riskData.probability * riskData.impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </Space>
            </div>

            <div>
              <Title level={5}>Add New Security Investment</Title>
              <Space>
                <Input 
                  placeholder="Investment name" 
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                />
                <InputNumber 
                  placeholder="Annual cost" 
                  value={newInvestment.cost}
                  onChange={(value) => setNewInvestment({...newInvestment, cost: value || 0})}
                  formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string) => value!.replace(/\$\s?|(,*)/g, '')}
                />
                <InputNumber 
                  placeholder="Effectiveness (0-1)" 
                  value={newInvestment.effectiveness}
                  onChange={(value) => setNewInvestment({...newInvestment, effectiveness: value || 0})}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                />
                <InputNumber 
                  placeholder="Implementation (months)" 
                  value={newInvestment.implementationTime}
                  onChange={(value) => setNewInvestment({...newInvestment, implementationTime: value || 0})}
                />
                <InputNumber 
                  placeholder="Lifecycle (years)" 
                  value={newInvestment.lifecycle}
                  onChange={(value) => setNewInvestment({...newInvestment, lifecycle: value || 0})}
                />
                <Button type="primary" onClick={addInvestment}>
                  Add Investment
                </Button>
              </Space>
            </div>

            <div>
              <Title level={5}>ROI Calculations</Title>
              <Table 
                columns={roiColumns} 
                dataSource={roiCalculations} 
                pagination={{ pageSize: 10 }}
                rowKey="investment.id"
              />
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'roi') return [`${Number(value).toFixed(2)}%`, 'ROI'];
                      return [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="roi" name="ROI (%)" fill="#8884d8" />
                  <Bar dataKey="netBenefit" name="Net Benefit ($)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Space>
        </TabPane>

        <TabPane tab="Recommendations" key="recommendations">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Optimal Investment Recommendation</Title>
              {optimalInvestment ? (
                <Card size="small">
                  <Text strong>{optimalInvestment.investment.name}</Text> offers the highest ROI at{' '}
                  <Text strong type="success">{optimalInvestment.roi.toFixed(2)}%</Text>.{' '}
                  It provides risk reduction of ${optimalInvestment.riskReduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                  at an annual cost of ${optimalInvestment.investment.cost.toLocaleString()}.
                </Card>
              ) : (
                <Text type="warning">No positive ROI investments identified. Consider adjusting effectiveness or cost parameters.</Text>
              )}
            </div>

            <div>
              <Title level={5}>Combined Investment Analysis</Title>
              <Card size="small">
                <Text strong>Combined ROI:</Text> {combinedROI.roi.toFixed(2)}%<br/>
                <Text strong>Total Risk Reduction:</Text> ${combinedROI.riskReduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}<br/>
                <Text strong>Net Benefit:</Text> ${combinedROI.netBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}<br/>
                <Text strong>Payback Period:</Text> {combinedROI.paybackPeriod === Infinity ? 'N/A' : `${combinedROI.paybackPeriod.toFixed(1)} years`}
              </Card>
            </div>

            <div>
              <Title level={5}>Investment Prioritization</Title>
              <Table 
                columns={[
                  {
                    title: 'Investment',
                    dataIndex: ['investment', 'name'],
                    key: 'name',
                  },
                  {
                    title: 'Priority',
                    key: 'priority',
                    render: (_: any, record: ROICalculation) => {
                      if (record.roi > 100) return <Tag color="green">High</Tag>;
                      if (record.roi > 50) return <Tag color="blue">Medium</Tag>;
                      if (record.roi > 0) return <Tag color="orange">Low</Tag>;
                      return <Tag color="red">Avoid</Tag>;
                    },
                  },
                  {
                    title: 'ROI',
                    dataIndex: 'roi',
                    key: 'roi',
                    render: (value: number) => `${value.toFixed(2)}%`,
                  },
                  {
                    title: 'Risk Reduction',
                    dataIndex: 'riskReduction',
                    key: 'riskReduction',
                    render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  },
                ]} 
                dataSource={roiCalculations.sort((a, b) => b.roi - a.roi)} 
                pagination={false}
                rowKey="investment.id"
              />
            </div>
          </Space>
        </TabPane>

        <TabPane tab="Cost-Benefit Analysis" key="costBenefit">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Cost-Benefit Analysis</Title>
              <Table 
                columns={[
                  {
                    title: 'Investment',
                    dataIndex: ['investment', 'name'],
                    key: 'name',
                  },
                  {
                    title: 'Total Cost',
                    dataIndex: 'cost',
                    key: 'cost',
                    render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  },
                  {
                    title: 'Total Benefit',
                    dataIndex: 'benefit',
                    key: 'benefit',
                    render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  },
                  {
                    title: 'Net Benefit',
                    dataIndex: 'net',
                    key: 'net',
                    render: (value: number) => (
                      <Text type={value >= 0 ? 'success' : 'danger'}>
                        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    ),
                  },
                  {
                    title: 'Benefit/Cost Ratio',
                    dataIndex: 'ratio',
                    key: 'ratio',
                    render: (value: number) => value.toFixed(2),
                  },
                ]} 
                dataSource={ROIMeasurementService.performCostBenefitAnalysis(riskData, investments)} 
                pagination={{ pageSize: 10 }}
                rowKey="investment.id"
              />
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="riskReduction" name="Risk Reduction ($)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="netBenefit" name="Net Benefit ($)" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Space>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default ROIMeasurementComponent;