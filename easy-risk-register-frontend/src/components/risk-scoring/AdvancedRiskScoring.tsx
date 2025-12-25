import React from 'react';
import { AdvancedRiskScore, ScenarioRiskScore, RiskPostureMetrics, calculateAdvancedRiskScore, calculateScenarioScores, calculateRiskPosture } from '../utils/advancedRiskScoring';
import type { Risk } from '../types/risk';
import { Card, CardContent, CardHeader, CardTitle } from '../design-system/Card';
import { Badge } from '../design-system/Badge';

interface AdvancedRiskScoringProps {
  risk: Risk;
  className?: string;
}

export const AdvancedRiskScoring: React.FC<AdvancedRiskScoringProps> = ({ 
  risk, 
  className = '' 
}) => {
  const advancedScore = calculateAdvancedRiskScore(risk);
  const scenarioScores = calculateScenarioScores(risk);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Advanced Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className="text-3xl font-bold text-brand-primary">{advancedScore.baseScore.toFixed(1)}</div>
              <div className="text-sm text-text-low mt-1">Base Score</div>
              <div className="text-xs text-text-low mt-1">P × I</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className="text-3xl font-bold text-brand-primary">{advancedScore.adjustedScore.toFixed(1)}</div>
              <div className="text-sm text-text-low mt-1">Adjusted Score</div>
              <div className="text-xs text-text-low mt-1">With Additional Factors</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className="text-3xl font-bold text-brand-primary">{(advancedScore.confidence * 100).toFixed(0)}%</div>
              <div className="text-sm text-text-low mt-1">Confidence</div>
              <div className="text-xs text-text-low mt-1">Score Reliability</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-high mb-2">Risk Sub-Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="text-lg font-semibold text-text-high">{advancedScore.subScores.likelihood.toFixed(1)}</div>
                <div className="text-xs text-text-low">Likelihood</div>
              </div>
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="text-lg font-semibold text-text-high">{advancedScore.subScores.consequence.toFixed(1)}</div>
                <div className="text-xs text-text-low">Consequence</div>
              </div>
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="text-lg font-semibold text-text-high">{advancedScore.subScores.exposure.toFixed(1)}</div>
                <div className="text-xs text-text-low">Exposure</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Scenario-Based Risk Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarioScores.map((scenario, index) => (
              <div key={index} className="p-4 border border-border-subtle rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-text-high">{scenario.scenario.replace('-', ' ').toUpperCase()}</h4>
                      <Badge variant="secondary">{scenario.score.toFixed(1)}</Badge>
                    </div>
                    <p className="text-sm text-text-low mt-1">{scenario.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface RiskPostureOverviewProps {
  risks: Risk[];
  className?: string;
}

export const RiskPostureOverview: React.FC<RiskPostureOverviewProps> = ({ 
  risks, 
  className = '' 
}) => {
  const postureMetrics = calculateRiskPosture(risks);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Risk Posture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className="text-3xl font-bold text-brand-primary">{postureMetrics.overallRiskScore.toFixed(1)}</div>
              <div className="text-sm text-text-low mt-1">Overall Risk Score</div>
              <div className="text-xs text-text-low mt-1">Average of all risks</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className="text-3xl font-bold text-brand-primary">{postureMetrics.riskExposure.toFixed(1)}</div>
              <div className="text-sm text-text-low mt-1">Risk Exposure</div>
              <div className="text-xs text-text-low mt-1">Total risk load</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-xl">
              <div className={`text-3xl font-bold ${
                postureMetrics.riskTrend === 'increasing' ? 'text-status-danger' : 
                postureMetrics.riskTrend === 'decreasing' ? 'text-status-success' : 'text-text-mid'
              }`}>
                {postureMetrics.riskTrend === 'increasing' ? '↗' : postureMetrics.riskTrend === 'decreasing' ? '↘' : '→'}
              </div>
              <div className="text-sm text-text-low mt-1">Risk Trend</div>
              <div className="text-xs text-text-low mt-1">{postureMetrics.riskTrend}</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-high mb-3">Risk Posture Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border-subtle rounded-xl">
                <div className="text-lg font-semibold text-text-high">{postureMetrics.riskCapacity}</div>
                <div className="text-sm text-text-low">Risk Capacity</div>
                <div className="text-xs text-text-low mt-1">Organization's risk tolerance</div>
              </div>
              
              <div className={`p-4 border border-border-subtle rounded-xl ${
                postureMetrics.riskGap > 0 ? 'bg-status-danger/10' : 'bg-status-success/10'
              }`}>
                <div className={`text-lg font-semibold ${
                  postureMetrics.riskGap > 0 ? 'text-status-danger' : 'text-status-success'
                }`}>
                  {postureMetrics.riskGap > 0 ? '+' : ''}{postureMetrics.riskGap.toFixed(1)}
                </div>
                <div className="text-sm text-text-low">Risk Gap</div>
                <div className="text-xs text-text-low mt-1">
                  {postureMetrics.riskGap > 0 
                    ? 'Exceeds risk capacity' 
                    : 'Within risk capacity'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface BreachLikelihoodCalculatorProps {
  threatLevel: number;
  vulnerabilityLevel: number;
  controlsEffectiveness: number;
  className?: string;
}

export const BreachLikelihoodCalculator: React.FC<BreachLikelihoodCalculatorProps> = ({ 
  threatLevel, 
  vulnerabilityLevel, 
  controlsEffectiveness,
  className = '' 
}) => {
  const likelihood = calculateBreachLikelihood(threatLevel, vulnerabilityLevel, controlsEffectiveness);
  const percentage = (likelihood * 100).toFixed(1);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Breach Likelihood</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-5xl font-bold text-brand-primary mb-2">{percentage}%</div>
            <div className="text-sm text-text-low">Estimated probability of a security breach</div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Threat Level: {threatLevel}/5</span>
                <span>{(threatLevel / 5 * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div 
                  className="bg-status-danger h-2 rounded-full" 
                  style={{ width: `${(threatLevel / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vulnerability Level: {vulnerabilityLevel}/5</span>
                <span>{(vulnerabilityLevel / 5 * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div 
                  className="bg-status-warning h-2 rounded-full" 
                  style={{ width: `${(vulnerabilityLevel / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Controls Effectiveness: {controlsEffectiveness}/5</span>
                <span>{(controlsEffectiveness / 5 * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div 
                  className="bg-status-success h-2 rounded-full" 
                  style={{ width: `${(controlsEffectiveness / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};