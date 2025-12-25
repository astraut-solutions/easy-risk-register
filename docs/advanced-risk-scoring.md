# Advanced Risk Scoring Documentation

## Overview

The Advanced Risk Scoring module provides enhanced risk assessment capabilities beyond the basic probability × impact model. This system implements industry-standard risk scoring methodologies including dynamic scoring, scenario-based analysis, and real-time posture monitoring.

## Features

### Dynamic Risk Score System (SAFE Score-like)

The dynamic risk scoring system calculates risk scores using multiple weighted factors:

- **Probability**: Likelihood of the risk occurring (1-5 scale)
- **Impact**: Consequence if the risk materializes (1-5 scale) 
- **Asset Value**: Value of assets at risk
- **Threat Level**: Current threat landscape
- **Vulnerability**: System vulnerabilities
- **Controls**: Effectiveness of existing controls
- **Business Context**: Business-specific factors

The system also includes time-based adjustments to account for changing conditions over time.

### Breach Likelihood Probability Calculations

The breach likelihood calculator estimates the probability of a security breach based on:

- **Threat Level**: Current threat environment (1-5 scale)
- **Vulnerability Level**: System vulnerabilities (1-5 scale)
- **Controls Effectiveness**: Strength of security controls (1-5 scale)

The calculation uses the formula: `Base Likelihood = Threat Level × Vulnerability Level`, then applies controls mitigation: `Final Likelihood = Base Likelihood × (1 - Controls Effectiveness × 0.7)`

### Scenario-Based Scoring

The system provides specialized scoring for specific threat scenarios:

- **Ransomware**: Enhanced threat modeling with focus on attack vectors
- **Data Compromise**: Information asset-focused scoring
- **Insider Threat**: Internal threat probability factors
- **Supply Chain**: Third-party risk considerations

Each scenario uses custom weights to emphasize the most relevant risk factors for that specific threat type.

### Real-Time Risk Posture Measurement

The system continuously monitors organizational risk posture through:

- **Overall Risk Score**: Average of all risk scores
- **Risk Trend**: Increasing, decreasing, or stable based on historical data
- **Risk Velocity**: Rate of change in risk scores
- **Risk Exposure**: Total risk load across all risks
- **Risk Capacity**: Organization's risk tolerance level
- **Risk Gap**: Difference between exposure and capacity

## Technical Implementation

### Core Calculation Functions

#### `calculateAdvancedRiskScore(risk, weights)`
Calculates an advanced risk score based on multiple factors with customizable weights.

#### `calculateBreachLikelihood(threatLevel, vulnerabilityLevel, controlsEffectiveness)`
Calculates the probability of a security breach based on threat, vulnerability, and controls factors.

#### `calculateScenarioScores(risk, scenarioWeights)`
Calculates risk scores for specific threat scenarios with scenario-specific weights.

#### `calculateRiskPosture(risks, historicalScores)`
Calculates real-time risk posture metrics across the entire risk register.

#### `calculateDynamicSafeScore(risk, timeFactor)`
Calculates a dynamic SAFE-like score with time-based adjustments.

### Data Structures

#### `RiskFactorWeights`
```typescript
interface RiskFactorWeights {
  probability: number;
  impact: number;
  assetValue: number;
  threatLevel: number;
  vulnerability: number;
  controls: number;
  businessContext: number;
}
```

#### `AdvancedRiskScore`
```typescript
interface AdvancedRiskScore {
  baseScore: number; // Standard probability * impact
  adjustedScore: number; // With additional factors
  confidence: number; // Confidence in the score (0-1)
  factors: RiskFactorWeights;
  subScores: {
    likelihood: number;
    consequence: number;
    exposure: number;
  };
}
```

## User Interface

### Advanced Risk Scoring Dashboard

The dashboard provides a comprehensive view of all advanced scoring features:

1. **Risk Selection**: Choose which risk to analyze in detail
2. **Breach Likelihood Calculator**: Interactive sliders for threat, vulnerability, and controls
3. **Risk Posture Overview**: Real-time metrics for organizational risk posture
4. **Advanced Scoring Details**: Detailed breakdown of the selected risk's advanced scoring

### Interactive Controls

The breach likelihood calculator provides sliders for:
- Threat Level (1-5)
- Vulnerability Level (1-5) 
- Controls Effectiveness (1-5)

Changes to these values dynamically update the breach likelihood percentage.

## Integration with Existing System

The Advanced Risk Scoring module integrates seamlessly with the existing risk register:

- All calculations work with existing risk data structure
- Advanced scores complement the standard risk score
- Historical tracking maintains consistency with existing data
- CSV export includes advanced scoring data when available
- All calculations are performed client-side with no server dependencies

## Security and Privacy

All advanced risk scoring calculations are performed client-side:
- No data is sent to external servers
- Calculations use only locally stored risk data
- Advanced scoring data is stored in browser local storage
- Encryption settings apply to advanced scoring data as well

## Performance Considerations

The advanced risk scoring system is optimized for:
- Real-time calculations without performance degradation
- Efficient storage of additional scoring metadata
- Minimal impact on existing application performance
- Scalable calculations that work with large risk registers

## Testing and Validation

The system includes comprehensive testing for:
- Calculation accuracy across all scoring functions
- Edge case handling for input validation
- Performance testing with large datasets
- Integration testing with existing risk management features