export type PlaybookStepSection = 'roles' | 'immediate_actions' | 'communications' | 'recovery' | 'other'

export type PlaybookTemplateStep = {
  id: string
  position: number
  section: PlaybookStepSection
  description: string
}

export type PlaybookTemplate = {
  id: string
  title: string
  description?: string
  steps: PlaybookTemplateStep[]
}

export type RiskPlaybookStep = {
  id: string
  position: number
  section: PlaybookStepSection
  description: string
  createdAt: string
  completedAt?: string | null
  completedBy?: string | null
}

export type RiskPlaybook = {
  id: string
  templateId: string
  templateTitle: string
  templateDescription?: string
  attachedAt: string
  title: string
  description?: string
  steps: RiskPlaybookStep[]
}

