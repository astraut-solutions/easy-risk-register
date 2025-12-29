import type { ChecklistStatus, RiskChecklist, RiskInput, RiskStatus, ThreatType } from '../types/risk'

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

function generateLocalId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : null
  if (uuid) return `${prefix}${uuid}`
  return `${prefix}${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

export const THREAT_TYPE_OPTIONS: Array<{ value: ThreatType; label: string }> = [
  { value: 'phishing', label: 'Phishing' },
  { value: 'ransomware', label: 'Ransomware' },
  { value: 'business_email_compromise', label: 'Business email compromise' },
  { value: 'malware', label: 'Malware' },
  { value: 'vulnerability', label: 'Vulnerability management' },
  { value: 'data_breach', label: 'Data breach / privacy incident' },
  { value: 'supply_chain', label: 'Supply chain / third-party' },
  { value: 'insider', label: 'Insider / access misuse' },
  { value: 'other', label: 'Other' },
]

export const CHECKLIST_STATUS_OPTIONS: Array<{ value: ChecklistStatus; label: string }> = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export type CyberRiskTemplate = {
  id: string
  label: string
  description: string
  threatType: ThreatType
  risk: Partial<RiskInput>
}

export const CYBER_RISK_TEMPLATES: CyberRiskTemplate[] = [
  {
    id: 'template_phishing_v1',
    label: 'Phishing / credential theft',
    description: 'Staff receive realistic phishing emails leading to credential compromise and account takeover.',
    threatType: 'phishing',
    risk: {
      title: 'Phishing leads to credential compromise',
      description:
        'Users are targeted by phishing emails and may disclose credentials, enabling account takeover and downstream access.',
      category: 'Security',
      probability: 4,
      impact: 3,
      mitigationPlan:
        'Enable MFA for key systems, run regular phishing simulations and awareness training, and enforce email security controls (SPF/DKIM/DMARC).',
      mitigationSteps: [
        {
          id: 'tmpl-phish-1',
          description: 'Enforce MFA for email and admin accounts',
          status: 'open',
          createdAt: '',
        },
        {
          id: 'tmpl-phish-2',
          description: 'Run quarterly phishing training and simulations',
          status: 'open',
          createdAt: '',
        },
      ],
    },
  },
  {
    id: 'template_ransomware_v1',
    label: 'Ransomware',
    description: 'Malware encrypts systems and data, causing downtime and potential data loss/exfiltration.',
    threatType: 'ransomware',
    risk: {
      title: 'Ransomware disrupts operations and data access',
      description:
        'Ransomware may encrypt critical systems and data, causing extended downtime and recovery costs. Some variants also exfiltrate data.',
      category: 'Security',
      probability: 3,
      impact: 5,
      mitigationPlan:
        'Maintain tested offline backups, patch critical systems, restrict admin privileges, and harden endpoints. Prepare a recovery runbook.',
      mitigationSteps: [
        {
          id: 'tmpl-ransom-1',
          description: 'Implement 3-2-1 backups and test restore quarterly',
          status: 'open',
          createdAt: '',
        },
        {
          id: 'tmpl-ransom-2',
          description: 'Patch operating systems and critical applications monthly',
          status: 'open',
          createdAt: '',
        },
      ],
    },
  },
  {
    id: 'template_bec_v1',
    label: 'Business email compromise (BEC)',
    description: 'Attacker impersonates leadership or vendors to redirect payments or obtain sensitive data.',
    threatType: 'business_email_compromise',
    risk: {
      title: 'Business email compromise redirects payments',
      description:
        'Attackers may impersonate executives or vendors to trick staff into changing bank details or authorising fraudulent payments.',
      category: 'Security',
      probability: 3,
      impact: 4,
      mitigationPlan:
        'Implement payment verification procedures (out-of-band), enforce MFA, and configure email authentication and anti-impersonation controls.',
      mitigationSteps: [
        {
          id: 'tmpl-bec-1',
          description: 'Add out-of-band verification for payment detail changes',
          status: 'open',
          createdAt: '',
        },
        {
          id: 'tmpl-bec-2',
          description: 'Configure SPF/DKIM/DMARC and mailbox auditing',
          status: 'open',
          createdAt: '',
        },
      ],
    },
  },
]

export function buildRiskDefaultsFromCyberTemplate(
  template: CyberRiskTemplate,
  nowIso: string,
): Partial<RiskInput> & { status: RiskStatus } {
  const clonedRisk = deepClone(template.risk ?? {})
  const mitigationStepsRaw = Array.isArray(clonedRisk.mitigationSteps) ? clonedRisk.mitigationSteps : []

  return {
    ...clonedRisk,
    threatType: template.threatType,
    templateId: template.id,
    status: 'open',
    mitigationSteps: mitigationStepsRaw.map((step) => ({
      ...step,
      id: generateLocalId('mitigation_step_'),
      createdAt: nowIso,
      completedAt: undefined,
    })),
  }
}

export type ComplianceChecklistTemplate = {
  id: string
  title: string
  description: string
  itemDescriptions: string[]
}

export const COMPLIANCE_CHECKLIST_TEMPLATES: ComplianceChecklistTemplate[] = [
  {
    id: 'checklist_privacy_incident_ndb_v1',
    title: 'Privacy incident response (NDB assist)',
    description:
      'A lightweight checklist to help document key response steps for privacy incidents (assistive, not legal advice).',
    itemDescriptions: [
      'Confirm incident scope and affected systems/accounts',
      'Containment: disable compromised accounts, isolate affected endpoints',
      'Preserve evidence (logs, email headers, forensic images where possible)',
      'Identify whether personal information is involved',
      'Assess likelihood of serious harm (internal assessment)',
      'Determine whether the incident may be an eligible data breach (NDB)',
      'Prepare internal incident summary (timeline, actions, open items)',
      'Decide notification approach and communications plan',
      'Complete post-incident review and update controls/training',
    ],
  },
]

export const buildChecklistInstanceFromTemplate = (
  template: ComplianceChecklistTemplate,
  nowIso: string,
  checklistId: string,
): RiskChecklist => ({
  id: checklistId,
  templateId: template.id,
  title: template.title,
  attachedAt: nowIso,
  items: template.itemDescriptions.map((description, index) => ({
    id: `${checklistId}-${index + 1}`,
    description,
    createdAt: nowIso,
  })),
})
