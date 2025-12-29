export type RiskStatus = 'open' | 'mitigated' | 'closed' | 'accepted'

export type RiskSeverity = 'low' | 'medium' | 'high'

export type RiskResponse = 'treat' | 'transfer' | 'tolerate' | 'terminate'

export type ThreatType =
  | 'phishing'
  | 'ransomware'
  | 'business_email_compromise'
  | 'malware'
  | 'vulnerability'
  | 'data_breach'
  | 'supply_chain'
  | 'insider'
  | 'other'

export type ChecklistStatus = 'not_started' | 'in_progress' | 'done'

export type ReviewCadence =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'ad-hoc'

export type EvidenceType = 'link' | 'ticket' | 'doc' | 'other'

export interface RiskEvidence {
  type: EvidenceType
  url: string
  description?: string
  addedAt: string // ISO
}

export type MitigationStepStatus = 'open' | 'done'

export interface RiskMitigationStep {
  id: string
  description: string
  owner?: string
  dueDate?: string // ISO
  status: MitigationStepStatus
  createdAt: string // ISO
  completedAt?: string // ISO
}

export interface RiskChecklistItem {
  id: string
  position?: number
  description: string
  createdAt: string // ISO
  completedAt?: string // ISO
  completedBy?: string
}

export interface RiskChecklist {
  id: string
  templateId: string
  title: string
  description?: string
  status?: ChecklistStatus
  items: RiskChecklistItem[]
  attachedAt: string // ISO
  startedAt?: string // ISO
  completedAt?: string // ISO
}

export interface RiskPlaybookStep {
  id: string
  description: string
  createdAt: string // ISO
  completedAt?: string // ISO
}

export interface RiskPlaybook {
  title: string
  steps: RiskPlaybookStep[]
  lastModified: string // ISO
}

export interface FinancialImpactRange {
  lowerBound: number
  upperBound: number
  expectedMean: number
  currency?: string
}

export interface Risk {
  id: string
  title: string
  description: string
  probability: number // 1-5
  impact: number // 1-5
  riskScore: number
  severity?: RiskSeverity
  category: string
  threatType: ThreatType
  templateId?: string
  status: RiskStatus
  mitigationPlan: string
  mitigationSteps: RiskMitigationStep[]
  checklists: RiskChecklist[]
  checklistStatus: ChecklistStatus
  playbook?: RiskPlaybook
  owner: string
  ownerTeam?: string
  dueDate?: string // ISO
  reviewDate?: string // ISO
  reviewCadence?: ReviewCadence
  riskResponse: RiskResponse
  ownerResponse: string
  securityAdvisorComment: string
  vendorResponse: string
  notes?: string
  evidence: RiskEvidence[]
  creationDate: string // ISO
  lastModified: string // ISO
  financialImpact?: FinancialImpactRange
  riskPriority?: number
  immediateAttention?: boolean
  actionableRecommendations?: string[]
}

export interface RiskInput {
  title: string
  description: string
  probability: number
  impact: number
  category: string
  threatType?: ThreatType
  templateId?: string
  status?: RiskStatus
  mitigationPlan?: string
  mitigationSteps?: RiskMitigationStep[]
  checklists?: RiskChecklist[]
  playbook?: RiskPlaybook
  owner?: string
  ownerTeam?: string
  dueDate?: string
  reviewDate?: string
  reviewCadence?: ReviewCadence
  riskResponse?: RiskResponse
  ownerResponse?: string
  securityAdvisorComment?: string
  vendorResponse?: string
  notes?: string
  evidence?: RiskEvidence[]
  financialImpact?: FinancialImpactRange
  riskPriority?: number
  immediateAttention?: boolean
  actionableRecommendations?: string[]
}

export interface RiskFilters {
  search: string
  category: string | 'all'
  threatType: ThreatType | 'all'
  status: RiskStatus | 'all'
  severity: RiskSeverity | 'all'
  checklistStatus: ChecklistStatus | 'all'
}

export interface RiskStats {
  total: number
  byStatus: Record<RiskStatus, number>
  bySeverity: Record<RiskSeverity, number>
  averageScore: number
  maxScore: number
  updatedAt: string
}

export interface RiskSnapshot {
  filters: RiskFilters
  risks: Risk[]
  stats: RiskStats
}
