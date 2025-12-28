import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { RiskData } from '../RiskTranslation/RiskTranslationService';
import { SimulationResult } from '../RiskTranslation/ScenarioModelingService';

export interface ReportData {
  title: string;
  executiveSummary: string;
  risks: RiskData[];
  simulationResults?: SimulationResult[];
  charts?: string[]; // Base64 encoded chart images
  date: Date;
  author: string;
}

export class PDFReportGenerator {
  /**
   * Generates a board-ready PDF report
   */
  static async generateBoardReport(reportData: ReportData): Promise<jsPDF> {
    const doc = new jsPDF();
    
    // Add title page
    this.addTitlePage(doc, reportData);
    
    // Add executive summary
    doc.addPage();
    this.addExecutiveSummary(doc, reportData);
    
    // Add risk register
    doc.addPage();
    this.addRiskRegister(doc, reportData);
    
    // Add simulation results if available
    if (reportData.simulationResults && reportData.simulationResults.length > 0) {
      doc.addPage();
      this.addSimulationResults(doc, reportData);
    }
    
    // Add charts if available
    if (reportData.charts && reportData.charts.length > 0) {
      doc.addPage();
      this.addCharts(doc, reportData);
    }
    
    // Add risk heatmap
    doc.addPage();
    this.addRiskHeatmap(doc, reportData);
    
    // Add recommendations
    doc.addPage();
    this.addRecommendations(doc, reportData);
    
    return doc;
  }

  /**
   * Adds the title page to the document
   */
  private static addTitlePage(doc: jsPDF, reportData: ReportData): void {
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(24);
    doc.text(reportData.title, pageWidth / 2, 60, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(16);
    doc.text('Cybersecurity Risk Register Report', pageWidth / 2, 80, { align: 'center' });
    
    // Report date
    doc.setFontSize(12);
    doc.text(`Date: ${reportData.date.toLocaleDateString()}`, pageWidth / 2, 100, { align: 'center' });
    
    // Author
    doc.text(`Prepared by: ${reportData.author}`, pageWidth / 2, 110, { align: 'center' });
    
    // Company logo placeholder (would be replaced with actual logo in real implementation)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(50, 150, 100, 50);
    doc.text('Company Logo', 100, 175, { align: 'center' });
  }

  /**
   * Adds the executive summary section
   */
  private static addExecutiveSummary(doc: jsPDF, reportData: ReportData): void {
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(18);
    doc.text('Executive Summary', 20, 20);
    
    doc.setFontSize(12);
    const summaryText = reportData.executiveSummary;
    
    // Split text into lines that fit the page
    const lines = doc.splitTextToSize(summaryText, pageWidth - 40);
    let yPosition = 35;
    
    lines.forEach(line => {
      if (yPosition > 260) { // If we're near the bottom of the page
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 8;
    });
    
    // Add key metrics
    doc.setFontSize(14);
    doc.text('Key Risk Metrics', 20, yPosition + 10);
    
    doc.setFontSize(12);
    const totalRisks = reportData.risks.length;
    const criticalRisks = reportData.risks.filter(r => r.riskScore >= 8).length;
    const highRisks = reportData.risks.filter(r => r.riskScore >= 6 && r.riskScore < 8).length;
    const totalImpact = reportData.risks.reduce((sum, risk) => sum + risk.impact, 0);
    
    const metrics = [
      `Total Risks: ${totalRisks}`,
      `Critical Risks: ${criticalRisks}`,
      `High Risks: ${highRisks}`,
      `Total Financial Impact: $${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    ];
    
    metrics.forEach((metric, index) => {
      doc.text(metric, 20, yPosition + 25 + (index * 8));
    });
  }

  /**
   * Adds the risk register table
   */
  private static addRiskRegister(doc: jsPDF, reportData: ReportData): void {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    
    doc.setFontSize(18);
    doc.text('Risk Register', 20, 20);
    
    // Prepare data for the table
    const tableData = reportData.risks.map(risk => [
      risk.riskName,
      risk.threatActor || 'N/A',
      risk.vulnerability || 'N/A',
      `${(risk.probability * 100).toFixed(1)}%`,
      `$${risk.impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      risk.riskScore.toFixed(1),
      this.getRiskLevel(risk.riskScore)
    ]);
    
    // Add the table
    (doc as any).autoTable({
      head: [['Risk', 'Threat Actor', 'Vulnerability', 'Probability', 'Impact', 'Score', 'Level']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // Green header
      styles: { fontSize: 10 }
    });
  }

  /**
   * Adds simulation results to the report
   */
  private static addSimulationResults(doc: jsPDF, reportData: ReportData): void {
    doc.setFontSize(18);
    doc.text('Simulation Results', 20, 20);
    
    if (!reportData.simulationResults) return;
    
    // Show top 10 simulation results
    const topResults = reportData.simulationResults.slice(0, 10);
    
    const tableData = topResults.map(result => [
      result.scenarioName,
      `${(result.probability * 100).toFixed(2)}%`,
      `$${result.impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `$${result.expectedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      result.riskScore.toFixed(2)
    ]);
    
    // Add the table
    (doc as any).autoTable({
      head: [['Scenario', 'Probability', 'Impact', 'Expected Loss', 'Risk Score']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // Green header
      styles: { fontSize: 10 }
    });
    
    // Add risk metrics
    doc.setFontSize(14);
    doc.text('Risk Metrics from Simulation', 20, (doc as any).lastAutoTable.finalY + 15);
    
    // Calculate metrics (in a real implementation, these would come from the service)
    const meanExpectedLoss = reportData.simulationResults.reduce((sum, r) => sum + r.expectedLoss, 0) / reportData.simulationResults.length;
    const maxExpectedLoss = Math.max(...reportData.simulationResults.map(r => r.expectedLoss));
    const minExpectedLoss = Math.min(...reportData.simulationResults.map(r => r.expectedLoss));
    
    doc.setFontSize(12);
    doc.text(`Mean Expected Loss: $${meanExpectedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 20, (doc as any).lastAutoTable.finalY + 25);
    doc.text(`Max Expected Loss: $${maxExpectedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 20, (doc as any).lastAutoTable.finalY + 35);
    doc.text(`Min Expected Loss: $${minExpectedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 20, (doc as any).lastAutoTable.finalY + 45);
  }

  /**
   * Adds charts to the report
   */
  private static addCharts(doc: jsPDF, reportData: ReportData): void {
    doc.setFontSize(18);
    doc.text('Risk Visualizations', 20, 20);
    
    if (!reportData.charts || reportData.charts.length === 0) return;
    
    let yPosition = 35;
    reportData.charts.forEach((chart, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add chart image
      doc.addImage(chart, 'PNG', 20, yPosition, 170, 100);
      
      // Add chart title
      doc.setFontSize(12);
      doc.text(`Chart ${index + 1}`, 20, yPosition + 110);
    });
  }

  /**
   * Adds a risk heatmap based on probability and impact
   */
  private static addRiskHeatmap(doc: jsPDF, reportData: ReportData): void {
    doc.setFontSize(18);
    doc.text('Risk Heatmap', 20, 20);
    
    // Draw axes
    doc.line(50, 50, 50, 200); // Y-axis (probability)
    doc.line(50, 200, 200, 200); // X-axis (impact)
    
    // Add axis labels
    doc.text('Probability', 20, 45);
    doc.text('Impact', 200, 215);
    
    // Add risk quadrants
    doc.setFillColor(255, 235, 235); // Low risk (red, light)
    doc.rect(50, 150, 50, 50); // Low probability, low impact
    
    doc.setFillColor(255, 205, 205); // Medium risk (orange)
    doc.rect(100, 150, 50, 50); // Low probability, high impact
    doc.rect(50, 100, 50, 50); // High probability, low impact
    
    doc.setFillColor(255, 150, 150); // High risk (red)
    doc.rect(100, 100, 50, 50); // High probability, high impact
    
    // Draw risk points
    reportData.risks.forEach((risk, index) => {
      // Scale probability (0-1) to Y coordinate (200-50)
      const y = 200 - (risk.probability * 150);
      // Scale impact to X coordinate (50-200)
      const normalizedImpact = Math.min(risk.impact / 1000000, 1); // Normalize to 0-1
      const x = 50 + (normalizedImpact * 150);
      
      // Color code by risk score
      if (risk.riskScore >= 8) {
        doc.setFillColor(220, 20, 20); // Red for critical
      } else if (risk.riskScore >= 6) {
        doc.setFillColor(255, 140, 0); // Orange for high
      } else if (risk.riskScore >= 4) {
        doc.setFillColor(255, 215, 0); // Yellow for medium
      } else {
        doc.setFillColor(50, 205, 50); // Green for low
      }
      
      // Draw risk point
      doc.circle(x, y, 3, 'F');
      
      // Add risk label
      if (index < 10) { // Only label first 10 to avoid clutter
        doc.setFontSize(8);
        doc.text(risk.riskName.substring(0, 10) + (risk.riskName.length > 10 ? '...' : ''), x + 5, y);
      }
    });
    
    // Reset fill color
    doc.setFillColor(255, 255, 255);
    
    // Add legend
    doc.setFontSize(12);
    doc.text('Risk Levels:', 20, 230);
    
    // Critical risk indicator
    doc.setFillColor(220, 20, 20);
    doc.circle(30, 245, 3, 'F');
    doc.text('Critical (8-10)', 40, 248);
    
    // High risk indicator
    doc.setFillColor(255, 140, 0);
    doc.circle(30, 255, 3, 'F');
    doc.text('High (6-7.9)', 40, 258);
    
    // Medium risk indicator
    doc.setFillColor(255, 215, 0);
    doc.circle(30, 265, 3, 'F');
    doc.text('Medium (4-5.9)', 40, 268);
    
    // Low risk indicator
    doc.setFillColor(50, 205, 50);
    doc.circle(30, 275, 3, 'F');
    doc.text('Low (1-3.9)', 40, 278);
    
    // Reset fill color
    doc.setFillColor(255, 255, 255);
  }

  /**
   * Adds recommendations section
   */
  private static addRecommendations(doc: jsPDF, reportData: ReportData): void {
    doc.setFontSize(18);
    doc.text('Recommendations', 20, 20);
    
    doc.setFontSize(12);
    let yPosition = 35;
    
    // Add critical risk recommendations
    const criticalRisks = reportData.risks.filter(r => r.riskScore >= 8);
    if (criticalRisks.length > 0) {
      doc.setFontSize(14);
      doc.text('Critical Risk Priorities:', 20, yPosition);
      doc.setFontSize(12);
      yPosition += 10;
      
      criticalRisks.forEach(risk => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${risk.riskName}: Immediate remediation required`, 20, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
    }
    
    // Add high risk recommendations
    const highRisks = reportData.risks.filter(r => r.riskScore >= 6 && r.riskScore < 8);
    if (highRisks.length > 0) {
      doc.setFontSize(14);
      doc.text('High Risk Priorities:', 20, yPosition);
      doc.setFontSize(12);
      yPosition += 10;
      
      highRisks.forEach(risk => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${risk.riskName}: Plan remediation within 30-60 days`, 20, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
    }
    
    // Add general recommendations
    doc.setFontSize(14);
    doc.text('General Recommendations:', 20, yPosition);
    doc.setFontSize(12);
    yPosition += 10;
    
    const generalRecs = [
      'Implement regular risk assessments',
      'Establish risk monitoring procedures',
      'Review and update security controls',
      'Allocate budget for risk mitigation',
      'Improve threat intelligence capabilities'
    ];
    
    generalRecs.forEach(rec => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`• ${rec}`, 20, yPosition);
      yPosition += 8;
    });
  }

  /**
   * Gets risk level based on score
   */
  private static getRiskLevel(score: number): string {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }
}
