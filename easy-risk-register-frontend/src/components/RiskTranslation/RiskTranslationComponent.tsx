import React, { useState, useEffect } from 'react';
import { RiskData, RiskTranslationService } from './RiskTranslationService';
import { Card, Typography, Select, Button, Input, Space, Divider } from 'antd';
import { CopyOutlined, ShareAltOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface RiskTranslationComponentProps {
  riskData: RiskData;
}

const RiskTranslationComponent: React.FC<RiskTranslationComponentProps> = ({ riskData }) => {
  const [translatedText, setTranslatedText] = useState<string>('');
  const [stakeholderView, setStakeholderView] = useState<'executive' | 'technical' | 'business'>('executive');
  const [customNarrative, setCustomNarrative] = useState<string>('');

  useEffect(() => {
    // Generate initial translation
    const translation = RiskTranslationService.generateStakeholderNarrative(riskData, stakeholderView);
    setTranslatedText(translation);
  }, [riskData, stakeholderView]);

  const handleStakeholderChange = (value: 'executive' | 'technical' | 'business') => {
    setStakeholderView(value);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
  };

  const shareNarrative = () => {
    // In a real app, this would trigger email or sharing functionality
    alert('Sharing functionality would be implemented here');
  };

  return (
    <Card 
      title="Risk Translation & Communication" 
      style={{ width: '100%', marginTop: 16 }}
      extra={
        <Space>
          <Button icon={<CopyOutlined />} onClick={copyToClipboard}>
            Copy
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={shareNarrative} type="primary">
            Share
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>Stakeholder View:</Text>
          <Select 
            defaultValue="executive" 
            style={{ width: 200, marginLeft: 8 }} 
            onChange={handleStakeholderChange}
          >
            <Option value="executive">Executive Summary</Option>
            <Option value="technical">Technical View</Option>
            <Option value="business">Business Impact</Option>
          </Select>
        </div>

        <div>
          <Title level={5}>Risk Narrative:</Title>
          <Paragraph>{translatedText}</Paragraph>
        </div>

        <div>
          <Title level={5}>Custom Narrative:</Title>
          <Input.TextArea 
            rows={4}
            placeholder="Enter custom narrative or notes about this risk..."
            value={customNarrative}
            onChange={(e) => setCustomNarrative(e.target.value)}
          />
        </div>

        <div>
          <Title level={5}>Executive Summary:</Title>
          <Paragraph>
            {RiskTranslationService.generateExecutiveSummary([riskData])}
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
};

export default RiskTranslationComponent;