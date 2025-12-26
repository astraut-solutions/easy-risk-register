import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { Risk } from '../../types/risk';
import { Table, Tag, Button, Space, Progress } from 'antd';
import { ArrowDownOutlined, CaretRightOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

interface ActionCenterProps {
  risks: Risk[];
}

interface ActionType {
  key: string;
  title: string;
  riskId: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  impact: number;
  roi?: number;
  category: string;
  description: string;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ risks }) => {
  // Generate prioritized actions based on risks
  const generatePrioritizedActions = (): ActionType[] => {
    const actions: ActionType[] = [];
    
    risks.forEach(risk => {
      // Generate actions for high priority risks
      if (risk.riskScore > 6) {
        actions.push({
          key: `${risk.id}-mitigate`,
          title: `Mitigate ${risk.title}`,
          riskId: risk.id,
          priority: 'high',
          status: 'pending',
          dueDate: risk.dueDate,
          impact: risk.financialImpact?.expectedMean ?? 0,
          roi: undefined,
          category: risk.category || 'Uncategorized',
          description: `Implement controls to reduce the likelihood or impact of ${risk.title}`
        });
      }
      
      // Generate actions for medium risks that need attention
      if (risk.riskScore >= 4 && risk.riskScore <= 6) {
        actions.push({
          key: `${risk.id}-monitor`,
          title: `Monitor ${risk.title}`,
          riskId: risk.id,
          priority: 'medium',
          status: 'pending',
          dueDate: risk.dueDate,
          impact: risk.financialImpact?.expectedMean ?? 0,
          roi: undefined,
          category: risk.category || 'Uncategorized',
          description: `Monitor and review ${risk.title} to prevent escalation`
        });
      }
      
      // Generate actions for risks with specific due dates
      if (risk.dueDate) {
        actions.push({
          key: `${risk.id}-review`,
          title: `Review ${risk.title}`,
          riskId: risk.id,
          priority: risk.riskScore > 6 ? 'high' : risk.riskScore >= 4 ? 'medium' : 'low',
          status: 'pending',
          dueDate: risk.dueDate,
          impact: risk.financialImpact?.expectedMean ?? 0,
          roi: undefined,
          category: risk.category || 'Uncategorized',
          description: `Review controls and effectiveness for ${risk.title}`
        });
      }
    });
    
    // Sort by priority and risk score
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      const riskA = risks.find(r => r.id === a.riskId)?.riskScore || 0;
      const riskB = risks.find(r => r.id === b.riskId)?.riskScore || 0;
      return riskB - riskA;
    });
  };

  const actions = generatePrioritizedActions();

  // Define table columns
  const columns: TableColumnsType<ActionType> = [
    {
      title: 'Action',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskId',
      key: 'riskScore',
      sorter: (a, b) => {
        const riskA = risks.find(r => r.id === a.riskId)?.riskScore || 0;
        const riskB = risks.find(r => r.id === b.riskId)?.riskScore || 0;
        return riskB - riskA;
      },
      render: (_, record) => {
        const risk = risks.find(r => r.id === record.riskId);
        if (!risk) return null;
        
        let color = 'green';
        if (risk.riskScore > 6) color = 'red';
        else if (risk.riskScore >= 4) color = 'orange';
        
        return (
          <Tag color={color}>
            {risk.riskScore.toFixed(1)}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority.localeCompare(b.priority),
      render: (priority) => {
        let color = 'default';
        let text = priority.charAt(0).toUpperCase() + priority.slice(1);
        
        if (priority === 'high') {
          color = 'red';
          text = 'High';
        } else if (priority === 'medium') {
          color = 'orange';
          text = 'Medium';
        } else if (priority === 'low') {
          color = 'green';
          text = 'Low';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        let icon = null;
        
        if (status === 'completed') {
          icon = <CheckCircleOutlined />;
        } else if (status === 'in-progress') {
          icon = <ClockCircleOutlined />;
        } else {
          icon = <ExclamationCircleOutlined />;
        }
        
        return (
          <Space>
            {icon}
            <span>{status.replace('-', ' ')}</span>
          </Space>
        );
      },
    },
    {
      title: 'Financial Impact',
      dataIndex: 'impact',
      key: 'impact',
      sorter: (a, b) => b.impact - a.impact,
      render: (impact) => `$${impact.toLocaleString()}`,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      },
      render: (dueDate) => dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" size="small">View Risk</Button>
          <Button type="primary" size="small">Take Action</Button>
        </Space>
      ),
    },
  ];

  // Calculate summary statistics
  const highPriorityActions = actions.filter(action => action.priority === 'high').length;
  const mediumPriorityActions = actions.filter(action => action.priority === 'medium').length;
  const lowPriorityActions = actions.filter(action => action.priority === 'low').length;
  const totalFinancialImpact = actions.reduce((sum, action) => sum + action.impact, 0);
  const completedActions = actions.filter(action => action.status === 'completed').length;
  const completionRate = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Priority Actions</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityActions}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationCircleOutlined className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Medium Priority Actions</p>
                <p className="text-2xl font-bold text-orange-600">{mediumPriorityActions}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ArrowDownOutlined className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Financial Impact</p>
                <p className="text-2xl font-bold text-blue-600">${totalFinancialImpact.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CaretRightOutlined className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleOutlined className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Action Center Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completionRate.toFixed(1)}%</span>
            </div>
            <Progress percent={completionRate} status="active" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">{highPriorityActions}</div>
                <div className="text-xs text-gray-500">High Priority</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{mediumPriorityActions}</div>
                <div className="text-xs text-gray-500">Medium Priority</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{lowPriorityActions}</div>
                <div className="text-xs text-gray-500">Low Priority</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Actions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Prioritized Actionable Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Table 
            columns={columns} 
            dataSource={actions} 
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button type="primary" size="large" block>
              Create New Action
            </Button>
            <Button size="large" block>
              Export Action Plan
            </Button>
            <Button size="large" block>
              View All Risks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionCenter;
