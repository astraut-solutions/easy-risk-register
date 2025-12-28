import { describe, it, expect, beforeEach, vi } from 'vitest';
import { riskService, useRiskManagement } from '../../src/services/riskService';
import type { Risk, RiskFilters, RiskInput } from '../../src/types/risk';
import type { RiskStoreState } from '../../src/stores/riskStore';
import { useAuthStore } from '../../src/stores/authStore'

type MockedRiskStore = RiskStoreState &
  ReturnType<typeof vi.fn> & {
    getState: ReturnType<typeof vi.fn>;
    setState: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

const { mockUseRiskStore, resetMockRiskStore } = vi.hoisted(() => {
  const createMockRiskStoreState = () => ({
    initialized: true,
    risks: [],
    filteredRisks: [],
    filters: { search: '', category: 'all', threatType: 'all', status: 'all', severity: 'all', checklistStatus: 'all' },
    categories: [],
    stats: {
      total: 0,
      byStatus: { open: 0, mitigated: 0, closed: 0, accepted: 0 },
      bySeverity: { low: 0, medium: 0, high: 0 },
      averageScore: 0,
      maxScore: 0,
      updatedAt: new Date().toISOString()
    },
    addRisk: vi.fn(),
    updateRisk: vi.fn(),
    deleteRisk: vi.fn(),
    attachChecklistTemplate: vi.fn(),
    toggleChecklistItem: vi.fn(),
    addCategory: vi.fn(),
    setFilters: vi.fn(),
    bulkImport: vi.fn(),
    exportToCSV: vi.fn(),
    importFromCSV: vi.fn(),
    seedDemoData: vi.fn(),
  });

  const store = Object.assign(vi.fn(), createMockRiskStoreState()) as MockedRiskStore;

  store.getState = vi.fn(() => store);
  store.setState = vi.fn();
  store.subscribe = vi.fn();

  const reset = () => {
    Object.assign(store, createMockRiskStoreState());
    store.getState.mockClear();
    store.setState.mockClear();
    store.subscribe.mockClear();
  };

  reset();

  return {
    mockUseRiskStore: store,
    resetMockRiskStore: reset,
  };
});

vi.mock('../../src/stores/riskStore', async () => {
  const actual = await vi.importActual<typeof import('../../src/stores/riskStore')>(
    '../../src/stores/riskStore'
  );

  return {
    ...actual,
    useRiskStore: mockUseRiskStore,
  };
});

describe('riskService', () => {
  const mockRisk: Risk = {
    id: 'test-id',
    title: 'Test Risk',
    description: 'Test Description',
    probability: 3,
    impact: 4,
    riskScore: 12,
    category: 'Security',
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
  };

  const mockRiskInput: RiskInput = {
    title: 'New Test Risk',
    description: 'New Test Description',
    probability: 2,
    impact: 3,
    category: 'Operational',
  };

  beforeEach(() => {
    resetMockRiskStore();
    useAuthStore.setState({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
      workspaceId: null,
      workspaceName: null,
    })

    // Set default return values
    mockUseRiskStore.addRisk.mockImplementation((input) => ({
      ...input,
      id: 'generated-id',
      riskScore: input.probability * input.impact,
      threatType: input.threatType ?? 'other',
      checklists: input.checklists ?? [],
      checklistStatus: 'not_started',
      status: 'open',
      mitigationPlan: input.mitigationPlan ?? '',
      mitigationSteps: input.mitigationSteps ?? [],
      owner: input.owner ?? '',
      riskResponse: input.riskResponse ?? 'treat',
      ownerResponse: input.ownerResponse ?? '',
      securityAdvisorComment: input.securityAdvisorComment ?? '',
      vendorResponse: input.vendorResponse ?? '',
      evidence: input.evidence ?? [],
      creationDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }));
    mockUseRiskStore.updateRisk.mockImplementation((id, updates) => ({
      ...mockRisk,
      ...updates
    }));
  });

  describe('list', () => {
    it('should return filtered risks', () => {
      mockUseRiskStore.filteredRisks = [mockRisk];

      const result = riskService.list();
      expect(result).toEqual([mockRisk]);
    });
  });

  describe('listAll', () => {
    it('should return all risks without filtering', () => {
      mockUseRiskStore.risks = [mockRisk];

      const result = riskService.listAll();
      expect(result).toEqual([mockRisk]);
    });
  });

  describe('getById', () => {
    it('should return a specific risk by ID', () => {
      mockUseRiskStore.risks = [mockRisk];

      const result = riskService.getById('test-id');
      expect(result).toEqual(mockRisk);
    });

    it('should return undefined if risk does not exist', () => {
      mockUseRiskStore.risks = [mockRisk];

      const result = riskService.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should call addRisk with the provided input', async () => {
      const result = await riskService.create(mockRiskInput);

      expect(mockUseRiskStore.addRisk).toHaveBeenCalledWith(mockRiskInput);
      expect(result).toEqual(
        expect.objectContaining({
          title: mockRiskInput.title,
          description: mockRiskInput.description,
          probability: mockRiskInput.probability,
          impact: mockRiskInput.impact,
          category: mockRiskInput.category,
        })
      );
    });
  });

  describe('update', () => {
    it('should call updateRisk with ID and updates', async () => {
      const updates = { title: 'Updated Title', category: 'Compliance' };
      const result = await riskService.update('test-id', updates);

      expect(mockUseRiskStore.updateRisk).toHaveBeenCalledWith('test-id', updates);
      expect(result).toEqual(
        expect.objectContaining({
          title: 'Updated Title',
          category: 'Compliance',
        })
      );
    });
  });

  describe('remove', () => {
    it('should call deleteRisk with the provided ID', async () => {
      await riskService.remove('test-id');

      expect(mockUseRiskStore.deleteRisk).toHaveBeenCalledWith('test-id');
    });
  });

  describe('setFilters', () => {
    it('should call setFilters with the provided updates', () => {
      const filterUpdates: Partial<RiskFilters> = {
        category: 'Security',
        status: 'open'
      };

      riskService.setFilters(filterUpdates);

      expect(mockUseRiskStore.setFilters).toHaveBeenCalledWith(filterUpdates);
    });
  });

  describe('exportCSV', () => {
    it('should call exportToCSV', () => {
      mockUseRiskStore.exportToCSV.mockReturnValue('csv-content');

      const result = riskService.exportCSV();

      expect(mockUseRiskStore.exportToCSV).toHaveBeenCalled();
      expect(result).toBe('csv-content');
    });
  });

  describe('importCSV', () => {
    it('should call importFromCSV with the provided CSV string', () => {
      mockUseRiskStore.importFromCSV.mockReturnValue({ imported: 5 });

      const result = riskService.importCSV('csv-data');

      expect(mockUseRiskStore.importFromCSV).toHaveBeenCalledWith('csv-data');
      expect(result).toEqual({ imported: 5 });
    });
  });

  describe('seedDemoData', () => {
    it('should call seedDemoData', () => {
      mockUseRiskStore.seedDemoData.mockReturnValue(3);

      const result = riskService.seedDemoData();

      expect(mockUseRiskStore.seedDemoData).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });
});
