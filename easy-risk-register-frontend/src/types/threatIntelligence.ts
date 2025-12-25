// Types for Threat Intelligence Integration

export interface MitreAttackTechnique {
  id: string
  name: string
  description: string
  tactics: string[]
  platforms: string[]
  version: string
  created: string
  modified: string
  revoked?: boolean
  deprecated?: boolean
}

export interface MitreAttackTactic {
  id: string
  name: string
  description: string
  shortname: string
}

export interface MitreAttackMatrix {
  id: string
  name: string
  tactics: string[]
}

export interface CveEntry {
  id: string
  published: string
  lastModified: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  cvssScore?: number
  cvssVector?: string
  affectedProducts?: string[]
  references?: string[]
}

export interface ThreatIntelligenceFeed {
  id: string
  name: string
  description: string
  url: string
  type: 'cve' | 'threat_report' | 'ioc' | 'vulnerability'
  lastUpdated: string
  enabled: boolean
}

export interface ThreatIntelRiskMapping {
  riskId: string
  mitreTechniques: string[]
  cves: string[]
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  lastUpdated: string
}

export interface ThreatDatabase {
  id: string
  name: string
  description: string
  type: 'cve' | 'mitre_attack' | 'custom_threats'
  lastSync: string
  entriesCount: number
}

export interface RiskWithThreatIntel {
  id: string
  threatIntel?: ThreatIntelRiskMapping
}