import React, { useState, useEffect } from 'react';
import { useRiskManagement } from '../../services/riskService';
import { AdvancedRiskScoring, RiskPostureOverview, BreachLikelihoodCalculator } from './AdvancedRiskScoring';
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/Card';
import { Slider } from '../../design-system/Slider';
import { Button } from '../../design-system/Button';
import { Risk } from '../../types/risk';

const AdvancedRiskScoringDashboard: React.FC = () => {
  const { risks } = useRiskManagement();
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [threatLevel, setThreatLevel] = useState<number>(3);
  const [vulnerabilityLevel, setVulnerabilityLevel] = useState<number>(3);
  const [controlsEffectiveness, setControlsEffectiveness] = useState<number>(3);

  // Select the first risk by default if available
  useEffect(() => {
    if (risks.length > 0 && !selectedRisk) {
      setSelectedRisk(risks[0]);
    }
  }, [risks, selectedRisk]);

  return (
    <div className="space-y-8">
      <div className="rr-panel p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-high">Advanced Risk Scoring</h1>
          <p className="text-sm text-text-low mt-1">
            Enhanced risk assessment with dynamic scoring, scenario analysis, and real-time posture monitoring
          </p>
        </div>

        {/* Risk Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-high mb-2">
            Select Risk for Advanced Scoring
          </label>
          <div className="flex flex-wrap gap-2">
            {risks.length === 0 ? (
              <p className="text-sm text-text-low">No risks available. Create a risk to see advanced scoring.</p>
            ) : (
              risks.map((risk) => (
                <Button
                  key={risk.id}
                  variant={selectedRisk?.id === risk.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedRisk(risk)}
                >
                  {risk.title}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Breach Likelihood Calculator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Breach Likelihood Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-text-high mb-2">
                    Threat Level: {threatLevel}/5
                  </label>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[threatLevel]}
                    onValueChange={(value) => setThreatLevel(value[0])}
                  />
                  <div className="flex justify-between text-xs text-text-low mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-high mb-2">
                    Vulnerability Level: {vulnerabilityLevel}/5
                  </label>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[vulnerabilityLevel]}
                    onValueChange={(value) => setVulnerabilityLevel(value[0])}
                  />
                  <div className="flex justify-between text-xs text-text-low mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-high mb-2">
                    Controls Effectiveness: {controlsEffectiveness}/5
                  </label>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[controlsEffectiveness]}
                    onValueChange={(value) => setControlsEffectiveness(value[0])}
                  />
                  <div className="flex justify-between text-xs text-text-low mt-1">
                    <span>Weak</span>
                    <span>Strong</span>
                  </div>
                </div>
              </div>
              
              <BreachLikelihoodCalculator
                threatLevel={threatLevel}
                vulnerabilityLevel={vulnerabilityLevel}
                controlsEffectiveness={controlsEffectiveness}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Posture Overview */}
        <RiskPostureOverview risks={risks} className="mb-8" />

        {/* Advanced Scoring for Selected Risk */}
        {selectedRisk ? (
          <AdvancedRiskScoring risk={selectedRisk} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-text-low">Select a risk to view advanced scoring details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedRiskScoringDashboard;