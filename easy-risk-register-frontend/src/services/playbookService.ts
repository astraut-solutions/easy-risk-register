import { apiDelete, apiGetJson, apiPatchJson, apiPostJson } from './apiClient'
import type { PlaybookTemplate, RiskPlaybook, PlaybookStepSection, RiskPlaybookStep } from '../types/playbooks'

type ApiPlaybookTemplatesListResponse = {
  items: PlaybookTemplate[]
}

type ApiRiskPlaybooksListResponse = {
  items: RiskPlaybook[]
}

export const playbookService = {
  listTemplates: async (): Promise<PlaybookTemplate[]> => {
    const data = await apiGetJson<ApiPlaybookTemplatesListResponse>('/api/playbook-templates')
    return Array.isArray(data?.items) ? data.items : []
  },

  listRiskPlaybooks: async (riskId: string): Promise<RiskPlaybook[]> => {
    const data = await apiGetJson<ApiRiskPlaybooksListResponse>(`/api/risks/${encodeURIComponent(riskId)}/playbooks`)
    return Array.isArray(data?.items) ? data.items : []
  },

  attachTemplate: async (riskId: string, templateId: string): Promise<RiskPlaybook> => {
    return await apiPostJson<RiskPlaybook>(`/api/risks/${encodeURIComponent(riskId)}/playbooks`, { templateId })
  },

  updatePlaybook: async (
    riskId: string,
    playbookId: string,
    updates: Partial<Pick<RiskPlaybook, 'title' | 'description'>> & { encryptedFields?: Record<string, unknown> },
  ): Promise<RiskPlaybook> => {
    const body: Record<string, unknown> = {}
    if (typeof updates.title === 'string') body.title = updates.title
    if (typeof updates.description === 'string') body.description = updates.description
    if (updates.encryptedFields && typeof updates.encryptedFields === 'object') body.encryptedFields = updates.encryptedFields

    return await apiPatchJson<RiskPlaybook>(
      `/api/risks/${encodeURIComponent(riskId)}/playbooks/${encodeURIComponent(playbookId)}`,
      body,
    )
  },

  deletePlaybook: async (riskId: string, playbookId: string): Promise<void> => {
    await apiDelete(`/api/risks/${encodeURIComponent(riskId)}/playbooks/${encodeURIComponent(playbookId)}`)
  },

  addStep: async (
    riskId: string,
    playbookId: string,
    step: { description: string; section?: PlaybookStepSection; position?: number },
  ): Promise<RiskPlaybookStep> => {
    return await apiPostJson<RiskPlaybookStep>(`/api/risks/${encodeURIComponent(riskId)}/playbooks/steps`, {
      playbookId,
      description: step.description,
      section: step.section,
      position: step.position,
    })
  },

  updateStep: async (
    riskId: string,
    stepId: string,
    updates: { description?: string; section?: PlaybookStepSection; position?: number; completed?: boolean },
  ): Promise<RiskPlaybookStep> => {
    const body: Record<string, unknown> = {}
    if (typeof updates.description === 'string') body.description = updates.description
    if (typeof updates.section === 'string') body.section = updates.section
    if (typeof updates.position === 'number') body.position = updates.position
    if (typeof updates.completed === 'boolean') body.completed = updates.completed

    return await apiPatchJson<RiskPlaybookStep>(
      `/api/risks/${encodeURIComponent(riskId)}/playbooks/steps/${encodeURIComponent(stepId)}`,
      body,
    )
  },

  deleteStep: async (riskId: string, stepId: string): Promise<void> => {
    await apiDelete(`/api/risks/${encodeURIComponent(riskId)}/playbooks/steps/${encodeURIComponent(stepId)}`)
  },
}

