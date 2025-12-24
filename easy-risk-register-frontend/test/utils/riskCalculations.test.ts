import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_FILTERS, 
  calculateRiskScore, 
  getRiskSeverity, 
  filterRisks, 
  computeRiskStats 
} from '../../src/utils/riskCalculations';
import type { Risk } from '../../src/types/risk';

const makeRisk = (overrides: Partial<Risk>): Risk => ({
  id: 'risk-id',
  title: 'Risk title',
  description: 'Risk description',
  probability: 3,
  impact: 3,
  riskScore: 9,
  category: 'Operational',
  threatType: 'other',
  checklists: [],
  checklistStatus: 'not_started',
  status: 'open',
  mitigationPlan: '',
  mitigationSteps: [],
  owner: '',
  riskResponse: 'treat',
  ownerResponse: '',
  securityAdvisorComment: '',
  vendorResponse: '',
  evidence: [],
  creationDate: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  ...overrides,
});

describe('riskCalculations', () => {
  describe('DEFAULT_FILTERS', () => {
    it('should have default filter values', () => {
      expect(DEFAULT_FILTERS).toEqual({
        search: '',
        category: 'all',
        threatType: 'all',
        status: 'all',
        severity: 'all',
        checklistStatus: 'all',
      });
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score as probability * impact', () => {
      expect(calculateRiskScore(3, 4)).toBe(12); // 3 * 4 = 12
      expect(calculateRiskScore(2, 5)).toBe(10); // 2 * 5 = 10
      expect(calculateRiskScore(1, 1)).toBe(1);  // 1 * 1 = 1
    });

    it('should clamp values within range [1, 5]', () => {
      // Values below 1 should be clamped to 1
      expect(calculateRiskScore(0, 3)).toBe(3);   // 1 * 3 = 3
      expect(calculateRiskScore(-1, 3)).toBe(3);  // 1 * 3 = 3
      expect(calculateRiskScore(3, 0)).toBe(3);   // 3 * 1 = 3
      expect(calculateRiskScore(3, -1)).toBe(3);  // 3 * 1 = 3

      // Values above 5 should be clamped to 5
      expect(calculateRiskScore(6, 3)).toBe(15);  // 5 * 3 = 15
      expect(calculateRiskScore(10, 3)).toBe(15); // 5 * 3 = 15
      expect(calculateRiskScore(3, 6)).toBe(15);  // 3 * 5 = 15
      expect(calculateRiskScore(3, 10)).toBe(15); // 3 * 5 = 15

      // Both values clamped
      expect(calculateRiskScore(10, 10)).toBe(25); // 5 * 5 = 25
      expect(calculateRiskScore(0, 0)).toBe(1);    // 1 * 1 = 1
    });
  });

  describe('getRiskSeverity', () => {
    it('should return "low" for scores <= 3', () => {
      expect(getRiskSeverity(1)).toBe('low');
      expect(getRiskSeverity(2)).toBe('low');
      expect(getRiskSeverity(3)).toBe('low');
    });

    it('should return "medium" for scores 4-6', () => {
      expect(getRiskSeverity(4)).toBe('medium');
      expect(getRiskSeverity(5)).toBe('medium');
      expect(getRiskSeverity(6)).toBe('medium');
    });

    it('should return "high" for scores > 6', () => {
      expect(getRiskSeverity(7)).toBe('high');
      expect(getRiskSeverity(8)).toBe('high');
      expect(getRiskSeverity(12)).toBe('high');
      expect(getRiskSeverity(25)).toBe('high');
    });
  });

  describe('filterRisks', () => {
    const sampleRisks: Risk[] = [
      makeRisk({
        id: '1',
        title: 'High Security Risk',
        description: 'A critical security vulnerability',
        probability: 4,
        impact: 5,
        riskScore: 20,
        category: 'Security',
        status: 'open',
      }),
      makeRisk({
        id: '2',
        title: 'Low Operational Risk',
        description: 'Minor operational issue',
        probability: 2,
        impact: 1,
        riskScore: 2,
        category: 'Operational',
        status: 'mitigated',
      }),
      makeRisk({
        id: '3',
        title: 'Medium Compliance Risk',
        description: 'Potential compliance issue',
        probability: 3,
        impact: 2,
        riskScore: 6,
        category: 'Compliance',
        status: 'closed',
      }),
    ];

    it('should return all risks when no filters are applied', () => {
      const result = filterRisks(sampleRisks, DEFAULT_FILTERS);
      expect(result).toEqual(sampleRisks);
    });

    it('should filter by search term in title', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        search: 'High' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('High Security Risk');
    });

    it('should filter by search term in description', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        search: 'operational' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Low Operational Risk');
    });

    it('should filter by category', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        category: 'Security' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Security');
    });

    it('should filter by status', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        status: 'mitigated' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('mitigated');
    });

    it('should filter by severity', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        severity: 'high' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].riskScore).toBe(20); // High severity (20 > 6)
    });

    it('should combine multiple filters', () => {
      const result = filterRisks(sampleRisks, { 
        search: 'Risk',
        category: 'Operational',
        threatType: 'all',
        status: 'mitigated',
        severity: 'low',
        checklistStatus: 'all',
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Low Operational Risk');
    });

    it('should return empty array when no risks match filters', () => {
      const result = filterRisks(sampleRisks, { 
        ...DEFAULT_FILTERS, 
        search: 'Nonexistent' 
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('computeRiskStats', () => {
    it('should return default stats for empty risk array', () => {
      const result = computeRiskStats([]);
      
      expect(result.total).toBe(0);
      expect(result.byStatus).toEqual({ open: 0, mitigated: 0, closed: 0, accepted: 0 });
      expect(result.bySeverity).toEqual({ low: 0, medium: 0, high: 0 });
      expect(result.averageScore).toBe(0);
      expect(result.maxScore).toBe(0);
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt)).toBeInstanceOf(Date);
    });

    it('should calculate stats for a single risk', () => {
      const singleRisk: Risk[] = [
        makeRisk({
          id: '1',
          title: 'Test Risk',
          description: 'Test Description',
          probability: 3,
          impact: 4,
          riskScore: 12, // 3 * 4 = 12
          category: 'Security',
          status: 'open',
        }),
      ];

      const result = computeRiskStats(singleRisk);
      
      expect(result.total).toBe(1);
      expect(result.byStatus).toEqual({ open: 1, mitigated: 0, closed: 0, accepted: 0 });
      expect(result.bySeverity).toEqual({ low: 0, medium: 0, high: 1 }); // 12 = high
      expect(result.averageScore).toBe(12);
      expect(result.maxScore).toBe(12);
    });

    it('should calculate stats for multiple risks', () => {
      const multipleRisks: Risk[] = [
        makeRisk({
          id: '1',
          title: 'Low Risk',
          description: 'Low Description',
          probability: 1,
          impact: 2,
          riskScore: 2, // low severity
          category: 'Security',
          status: 'open',
        }),
        makeRisk({
          id: '2',
          title: 'Medium Risk',
          description: 'Medium Description',
          probability: 2,
          impact: 3,
          riskScore: 6, // medium severity
          category: 'Operational',
          status: 'mitigated',
        }),
        makeRisk({
          id: '3',
          title: 'High Risk',
          description: 'High Description',
          probability: 4,
          impact: 5,
          riskScore: 20, // high severity
          category: 'Compliance',
          status: 'closed',
        }),
      ];

      const result = computeRiskStats(multipleRisks);
      
      expect(result.total).toBe(3);
      expect(result.byStatus).toEqual({ open: 1, mitigated: 1, closed: 1, accepted: 0 });
      expect(result.bySeverity).toEqual({ low: 1, medium: 1, high: 1 });
      expect(result.averageScore).toBe(9.33); // (2 + 6 + 20) / 3 = 9.33
      expect(result.maxScore).toBe(20);
    });

    it('should handle risks with different statuses properly', () => {
      const risksWithStatuses: Risk[] = [
        makeRisk({
          id: '1',
          title: 'Open Risk',
          description: 'Open Description',
          probability: 2,
          impact: 2,
          riskScore: 4, // medium severity
          category: 'Security',
          status: 'open',
        }),
        makeRisk({
          id: '2',
          title: 'Mitigated Risk',
          description: 'Mitigated Description',
          probability: 2,
          impact: 2,
          riskScore: 4, // medium severity
          category: 'Operational',
          status: 'mitigated',
        }),
        makeRisk({
          id: '3',
          title: 'Accepted Risk',
          description: 'Accepted Description',
          probability: 2,
          impact: 2,
          riskScore: 4, // medium severity
          category: 'Compliance',
          status: 'accepted',
        }),
      ];

      const result = computeRiskStats(risksWithStatuses);
      
      expect(result.byStatus).toEqual({ open: 1, mitigated: 1, closed: 0, accepted: 1 });
      expect(result.bySeverity).toEqual({ low: 0, medium: 3, high: 0 });
      expect(result.averageScore).toBe(4);
      expect(result.maxScore).toBe(4);
    });
  });
});
