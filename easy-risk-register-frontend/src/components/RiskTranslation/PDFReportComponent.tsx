import React, { useState } from 'react';
import { Card, Typography, Button, Input, Space, message, Progress, Divider } from 'antd';
import { PDFReportGenerator, ReportData } from './PDFReportGenerator';
import { RiskData } from './RiskTranslationService';
import { SimulationResult } from './ScenarioModelingService';
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface PDFReportComponentProps {
  riskData: RiskData[];
  simulationResults?: SimulationResult[];
}

const PDFReportComponent: React.FC<PDFReportComponentProps> = ({ riskData, simulationResults }) => {
  const [reportTitle, setReportTitle] = useState<string>('Cybersecurity Risk Register Report');
  const [author, setAuthor] = useState<string>('Risk Management Team');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(10);
    
    try {
      // Create report data
      const reportData: ReportData = {
        title: reportTitle,
        executiveSummary: `This report presents the current cybersecurity risk posture based on ${riskData.length} identified risks with a total potential financial impact of $${riskData.reduce((sum, risk) => sum + risk.impact, 0).toLocaleString()}.`,
        risks: riskData,
        simulationResults: simulationResults,
        date: new Date(),
        author: author
      };
      
      setProgress(30);
      
      // Generate the PDF
      const pdfDoc = await PDFReportGenerator.generateBoardReport(reportData);
      
      setProgress(80);
      
      // Save the PDF
      pdfDoc.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setProgress(100);
      message.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Card 
      title="Board-Ready PDF Reports" 
      style={{ width: '100%', marginTop: 16 }}
      extra={
        <Button 
          type="primary" 
          icon={<FilePdfOutlined />} 
          onClick={generateReport}
          loading={isGenerating}
          disabled={riskData.length === 0}
        >
          Generate PDF Report
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>Report Title:</Text>
          <Input 
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Enter report title"
            style={{ marginTop: 8 }}
          />
        </div>
        
        <div>
          <Text strong>Report Author:</Text>
          <Input 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter report author"
            style={{ marginTop: 8 }}
          />
        </div>
        
        <div>
          <Text strong>Report Preview:</Text>
          <div style={{ marginTop: 8, padding: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <Paragraph>
              <Text strong>Title:</Text> {reportTitle}
            </Paragraph>
            <Paragraph>
              <Text strong>Author:</Text> {author}
            </Paragraph>
            <Paragraph>
              <Text strong>Date:</Text> {new Date().toLocaleDateString()}
            </Paragraph>
            <Paragraph>
              <Text strong>Risks Included:</Text> {riskData.length} risks with total impact of ${riskData.reduce((sum, risk) => sum + risk.impact, 0).toLocaleString()}
            </Paragraph>
          </div>
        </div>
        
        {isGenerating && (
          <div>
            <Text strong>Generating Report:</Text>
            <Progress percent={progress} style={{ marginTop: 8 }} />
          </div>
        )}
        
        <Divider />
        
        <div>
          <Title level={5}>Report Features:</Title>
          <ul>
            <li>Executive summary with key metrics</li>
            <li>Complete risk register table</li>
            <li>Simulation results and risk metrics</li>
            <li>Visual risk heatmap</li>
            <li>Recommendations by risk level</li>
            <li>Professional formatting for board presentation</li>
          </ul>
        </div>
      </Space>
    </Card>
  );
};

export default PDFReportComponent;