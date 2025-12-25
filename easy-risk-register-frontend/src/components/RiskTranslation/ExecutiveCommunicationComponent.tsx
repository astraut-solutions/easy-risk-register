import React, { useState } from 'react';
import { Card, Typography, Button, Select, Input, Space, Table, Tabs, message, Divider } from 'antd';
import { ExecutiveCommunicationService, EmailTemplate } from './ExecutiveCommunicationService';
import { RiskData } from './RiskTranslationService';
import { SimulationResult } from './ScenarioModelingService';
import { MailOutlined, ShareAltOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface ExecutiveCommunicationComponentProps {
  riskData: RiskData;
  simulationResults?: SimulationResult[];
}

const ExecutiveCommunicationComponent: React.FC<ExecutiveCommunicationComponentProps> = ({ 
  riskData, 
  simulationResults 
}) => {
  const [activeTab, setActiveTab] = useState<string>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customRecipients, setCustomRecipients] = useState<string>('');
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Generate templates when component loads
  const [templates] = useState<EmailTemplate[]>(() => 
    ExecutiveCommunicationService.generateRiskTemplates(riskData)
  );

  // Generate communication recommendations
  const [recommendations] = useState<string[]>(() => 
    ExecutiveCommunicationService.generateCommunicationRecommendations(riskData, simulationResults)
  );

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const sendCommunication = async () => {
    if (!selectedTemplate) {
      message.warning('Please select a template first');
      return;
    }

    setIsSending(true);
    
    try {
      // In a real implementation, this would use emailjs to send the email
      // For now, we'll simulate the process
      const recipients = customRecipients ? 
        customRecipients.split(',').map(r => r.trim()) : 
        selectedTemplate.recipients;
      
      // Simulate sending
      await ExecutiveCommunicationService.sendEmail({
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        recipients
      });
      
      message.success('Communication sent successfully!');
      
      // Update communication history
      const history = ExecutiveCommunicationService.getCommunicationHistory();
      setCommunicationHistory(history);
    } catch (error) {
      message.error('Failed to send communication. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const shareOnPlatform = (platform: 'slack' | 'teams' | 'linkedin') => {
    const summary = ExecutiveCommunicationService.generateShareableSummary(riskData, platform);
    message.success(`Shareable content for ${platform} copied to clipboard!`);
    // In a real implementation, this would share to the platform
    console.log(`Sharing to ${platform}:`, summary);
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients: string[]) => recipients.join(', '),
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusColors = {
          sent: 'green',
          failed: 'red',
          pending: 'orange'
        };
        return <Text type={statusColors[status as keyof typeof statusColors] as any}>{status}</Text>;
      },
    },
  ];

  return (
    <Card 
      title="Executive Communication Tools" 
      style={{ width: '100%', marginTop: 16 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Email Templates" key="templates">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>Select Template:</Text>
              <Select 
                placeholder="Choose an email template"
                style={{ width: 300, marginLeft: 8 }}
                onChange={handleTemplateSelect}
                allowClear
              >
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </div>

            {selectedTemplate && (
              <Card title={selectedTemplate.subject} size="small">
                <Paragraph strong>To: {selectedTemplate.recipients.join(', ')}</Paragraph>
                <Paragraph>
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
                </Paragraph>
              </Card>
            )}

            <div>
              <Text strong>Custom Recipients (comma separated):</Text>
              <Input 
                value={customRecipients}
                onChange={(e) => setCustomRecipients(e.target.value)}
                placeholder="Enter custom recipients, or leave empty to use template defaults"
                style={{ marginTop: 8 }}
              />
            </div>

            <Space>
              <Button 
                type="primary" 
                icon={<MailOutlined />} 
                onClick={sendCommunication}
                loading={isSending}
                disabled={!selectedTemplate}
              >
                Send Email
              </Button>
              <Button 
                icon={<ShareAltOutlined />} 
                onClick={() => shareOnPlatform('slack')}
                disabled={!selectedTemplate}
              >
                Share to Slack
              </Button>
              <Button 
                icon={<ShareAltOutlined />} 
                onClick={() => shareOnPlatform('teams')}
                disabled={!selectedTemplate}
              >
                Share to Teams
              </Button>
              <Button 
                icon={<ShareAltOutlined />} 
                onClick={() => shareOnPlatform('linkedin')}
                disabled={!selectedTemplate}
              >
                Share to LinkedIn
              </Button>
            </Space>
          </Space>
        </TabPane>

        <TabPane tab="Communication Plan" key="plan">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Communication Recommendations:</Title>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            <Divider />

            <div>
              <Title level={5}>Suggested Recipients by Risk Level:</Title>
              <ul>
                {riskData.riskScore >= 8 ? (
                  <>
                    <li><strong>Executive Team:</strong> Immediate notification required</li>
                    <li><strong>Security Team:</strong> Technical assessment and remediation</li>
                    <li><strong>Business Operations:</strong> Impact assessment</li>
                    <li><strong>Legal Team:</strong> Regulatory implications</li>
                  </>
                ) : riskData.riskScore >= 6 ? (
                  <>
                    <li><strong>Department Heads:</strong> Awareness and planning</li>
                    <li><strong>Security Team:</strong> Technical assessment</li>
                    <li><strong>Risk Team:</strong> Planning and mitigation</li>
                  </>
                ) : (
                  <>
                    <li><strong>Risk Team:</strong> Ongoing monitoring</li>
                    <li><strong>Security Team:</strong> Regular updates</li>
                  </>
                )}
              </ul>
            </div>
          </Space>
        </TabPane>

        <TabPane tab="History" key="history">
          <Table 
            columns={columns} 
            dataSource={ExecutiveCommunicationService.getCommunicationHistory()} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default ExecutiveCommunicationComponent;