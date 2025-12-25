import React, { useState } from 'react';
import { Card, Typography, Button, Slider, InputNumber, Space, Table, Tabs, Input, Alert } from 'antd';
import { ScenarioModelingService, SimulationResult } from './ScenarioModelingService';
import { RiskData } from './RiskTranslationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ScenarioModelingComponentProps {
  riskData: RiskData;
}

const ScenarioModelingComponent: React.FC<ScenarioModelingComponentProps> = ({ riskData }) => {
  const [probability, setProbability] = useState<number>(riskData.probability);
  const [impact, setImpact] = useState<number>(riskData.impact);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [whatIfResults, setWhatIfResults] = useState<SimulationResult[]>([]);
  const [sensitivityResults, setSensitivityResults] = useState<SimulationResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('simulation');
  const [iterations, setIterations] = useState<number>(1000);

  const runMonteCarloSimulation = () => {
    const results = ScenarioModelingService.runMonteCarloSimulation(
      { ...riskData, probability, impact },
      iterations
    );
    
    const resultsWithConfidence = ScenarioModelingService.calculateConfidenceIntervals(results);
    setSimulationResults(resultsWithConfidence);
  };

  const runWhatIfAnalysis = () => {
    const changes = [
      { 
        parameter: 'probability' as const, 
        newValue: probability * 1.5, 
        description: 'Probability +50%' 
      },
      { 
        parameter: 'probability' as const, 
        newValue: probability * 0.5, 
        description: 'Probability -50%' 
      },
      { 
        parameter: 'impact' as const, 
        newValue: impact * 1.5, 
        description: 'Impact +50%' 
      },
      { 
        parameter: 'impact' as const, 
        newValue: impact * 0.5, 
        description: 'Impact -50%' 
      }
    ];
    
    const results = ScenarioModelingService.performWhatIfAnalysis(
      { ...riskData, probability, impact },
      changes
    );
    
    setWhatIfResults(results);
  };

  const runSensitivityAnalysis = () => {
    const parameters = [
      { name: 'probability', range: [0, 1] as [number, number], steps: 10 },
      { name: 'impact', range: [0, impact * 2] as [number, number], steps: 10 }
    ];
    
    const results = ScenarioModelingService.performSensitivityAnalysis(
      { ...riskData, probability, impact },
      parameters
    );
    
    setSensitivityResults(results);
  };

  const columns = [
    {
      title: 'Scenario',
      dataIndex: 'scenarioName',
      key: 'scenarioName',
    },
    {
      title: 'Expected Loss',
      dataIndex: 'expectedLoss',
      key: 'expectedLoss',
      render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (value: number) => value.toFixed(2),
    },
  ];

  return (
    <Card 
      title="Scenario Modeling & What-If Analysis" 
      style={{ width: '100%', marginTop: 16 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5}>Risk Parameters</Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text>Probability: </Text>
              <Slider 
                min={0} 
                max={1} 
                step={0.01} 
                value={probability} 
                onChange={setProbability}
                style={{ width: 300 }}
              />
              <InputNumber 
                min={0} 
                max={1} 
                step={0.01} 
                value={probability} 
                onChange={(value) => setProbability(value || 0)}
              />
            </div>
            
            <div>
              <Text>Impact: </Text>
              <Slider 
                min={0} 
                max={riskData.impact * 3} 
                step={1000} 
                value={impact} 
                onChange={setImpact}
                style={{ width: 300 }}
              />
              <InputNumber 
                min={0} 
                max={riskData.impact * 3} 
                step={1000} 
                value={impact} 
                onChange={(value) => setImpact(value || 0)}
                formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: string) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </div>
            
            <div>
              <Text>Iterations: </Text>
              <InputNumber 
                min={100} 
                max={100000} 
                step={100} 
                value={iterations} 
                onChange={(value) => setIterations(value || 1000)}
              />
            </div>
          </Space>
        </div>

        <Space>
          <Button type="primary" onClick={runMonteCarloSimulation}>
            Run Monte Carlo Simulation
          </Button>
          <Button onClick={runWhatIfAnalysis}>
            Run What-If Analysis
          </Button>
          <Button onClick={runSensitivityAnalysis}>
            Run Sensitivity Analysis
          </Button>
        </Space>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Monte Carlo Simulation" key="simulation">
            {simulationResults.length > 0 ? (
              <div>
                <div style={{ height: 300, marginBottom: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={simulationResults.slice(0, 20)} // Show first 20 results for performance
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scenarioName" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Expected Loss']}
                      />
                      <Legend />
                      <Bar dataKey="expectedLoss" name="Expected Loss" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Table 
                  columns={columns} 
                  dataSource={simulationResults.slice(0, 10)} 
                  pagination={{ pageSize: 10 }}
                  rowKey="scenarioName"
                />
              </div>
            ) : (
              <Alert 
                message="Run Simulation" 
                description="Click 'Run Monte Carlo Simulation' to generate results" 
                type="info" 
                showIcon 
              />
            )}
          </TabPane>
          
          <TabPane tab="What-If Analysis" key="whatif">
            {whatIfResults.length > 0 ? (
              <div>
                <div style={{ height: 300, marginBottom: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={whatIfResults}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scenarioName" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Expected Loss']}
                      />
                      <Legend />
                      <Bar dataKey="expectedLoss" name="Expected Loss" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Table 
                  columns={columns} 
                  dataSource={whatIfResults} 
                  pagination={{ pageSize: 10 }}
                  rowKey="scenarioName"
                />
              </div>
            ) : (
              <Alert 
                message="Run Analysis" 
                description="Click 'Run What-If Analysis' to generate results" 
                type="info" 
                showIcon 
              />
            )}
          </TabPane>
          
          <TabPane tab="Sensitivity Analysis" key="sensitivity">
            {sensitivityResults.length > 0 ? (
              <div>
                <div style={{ height: 300, marginBottom: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={sensitivityResults}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="scenarioName" 
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Expected Loss']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="expectedLoss" 
                        name="Expected Loss" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <Table 
                  columns={columns} 
                  dataSource={sensitivityResults} 
                  pagination={{ pageSize: 10 }}
                  rowKey="scenarioName"
                />
              </div>
            ) : (
              <Alert 
                message="Run Analysis" 
                description="Click 'Run Sensitivity Analysis' to generate results" 
                type="info" 
                showIcon 
              />
            )}
          </TabPane>
        </Tabs>
      </Space>
    </Card>
  );
};

export default ScenarioModelingComponent;