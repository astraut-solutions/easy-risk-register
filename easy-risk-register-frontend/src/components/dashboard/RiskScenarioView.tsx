import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { Risk } from '../../types/risk';

interface RiskScenarioViewProps {
  risks: Risk[];
}

const RiskScenarioView: React.FC<RiskScenarioViewProps> = ({ risks }) => {
  const ransomwareRef = useRef<SVGSVGElement>(null);
  const dataBreachRef = useRef<SVGSVGElement>(null);
  const scenarioRef = useRef<SVGSVGElement>(null);

  // Function to create a risk scenario visualization using D3
  const createScenarioVisualization = (containerRef: React.RefObject<SVGSVGElement>, scenarioType: string) => {
    if (!containerRef.current) return;

    // Clear previous content
    d3.select(containerRef.current).selectAll("*").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const svg = d3.select(containerRef.current)
      .attr("width", width)
      .attr("height", height);

    // Get risks for this scenario
    let scenarioRisks: Risk[] = [];
    if (scenarioType === 'ransomware') {
      scenarioRisks = risks.filter(risk => 
        risk.title.toLowerCase().includes('ransomware') || 
        risk.category?.toLowerCase().includes('ransomware') ||
        risk.description.toLowerCase().includes('ransomware')
      );
    } else if (scenarioType === 'data-breach') {
      scenarioRisks = risks.filter(risk => 
        risk.title.toLowerCase().includes('data') || 
        risk.category?.toLowerCase().includes('data') ||
        risk.description.toLowerCase().includes('data') ||
        risk.title.toLowerCase().includes('breach') ||
        risk.category?.toLowerCase().includes('breach') ||
        risk.description.toLowerCase().includes('breach')
      );
    } else {
      // General scenario view with all risks
      scenarioRisks = risks;
    }

    // Create a simple force-directed graph
    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.index).distance(100).strength(1))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create nodes (risks)
    const nodes = scenarioRisks.map((risk, index) => ({
      id: risk.id,
      title: risk.title.substring(0, 20) + (risk.title.length > 20 ? '...' : ''),
      riskScore: risk.riskScore,
      financialImpact: risk.financialImpact || 0,
      index: index
    }));

    // Create links (for demonstration, connecting related risks)
    const links: Array<{source: number, target: number}> = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() > 0.7) { // Randomly connect some nodes
        links.push({ source: i, target: i + 1 });
      }
    }

    // Add links to the graph
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    // Add nodes to the graph
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => Math.max(5, d.riskScore * 3))
      .attr("fill", (d: any) => {
        if (d.riskScore > 6) return "#ef4444"; // High risk - red
        if (d.riskScore >= 4) return "#f59e0b"; // Medium risk - yellow
        return "#10b981"; // Low risk - green
      });

    // Add labels to nodes
    const label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => d.title)
      .attr("font-size", "10px")
      .attr("dx", 10)
      .attr("dy", 4);

    // Update positions based on simulation
    simulation.nodes(nodes).on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    // Add simulation forces
    simulation.force("link")?.links(links);
  };

  useEffect(() => {
    // Create visualizations for each scenario
    createScenarioVisualization(ransomwareRef, 'ransomware');
    createScenarioVisualization(dataBreachRef, 'data-breach');
    createScenarioVisualization(scenarioRef, 'general');
  }, [risks]);

  // Get statistics for each scenario
  const ransomwareRisks = risks.filter(risk =>
    risk.title.toLowerCase().includes('ransomware') ||
    risk.category?.toLowerCase().includes('ransomware') ||
    risk.description.toLowerCase().includes('ransomware')
  );

  const dataBreachRisks = risks.filter(risk =>
    risk.title.toLowerCase().includes('data') ||
    risk.category?.toLowerCase().includes('data') ||
    risk.description.toLowerCase().includes('data') ||
    risk.title.toLowerCase().includes('breach') ||
    risk.category?.toLowerCase().includes('breach') ||
    risk.description.toLowerCase().includes('breach')
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ransomware Scenario */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ransomware Risk Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <svg ref={ransomwareRef} width="100%" height="100%" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{ransomwareRisks.length}</div>
                <div className="text-sm text-gray-600">Total Risks</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  ${ransomwareRisks.reduce((sum, risk) => sum + (risk.financialImpact || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Financial Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Breach Scenario */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Data Compromise Risk Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <svg ref={dataBreachRef} width="100%" height="100%" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{dataBreachRisks.length}</div>
                <div className="text-sm text-gray-600">Total Risks</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  ${dataBreachRisks.reduce((sum, risk) => sum + (risk.financialImpact || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Financial Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Risk Scenario */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>General Risk Scenario Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <svg ref={scenarioRef} width="100%" height="100%" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{risks.length}</div>
              <div className="text-sm text-gray-600">Total Risks</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${risks.reduce((sum, risk) => sum + (risk.financialImpact || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Financial Impact</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {risks.length > 0 ? (risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-600">Average Risk Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskScenarioView;