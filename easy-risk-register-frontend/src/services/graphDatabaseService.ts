import type { Risk } from '../types/risk'

export type RiskRelationshipType =
  | 'depends_on'
  | 'affects'
  | 'mitigates'
  | 'similar_to'
  | 'conflicts_with'

export interface RiskRelationship {
  fromRiskId: string
  toRiskId: string
  relationshipType: RiskRelationshipType
  strength: number // 1-10 scale
  description?: string
}

export interface RiskGraphNode {
  id: string
  type: 'risk' | 'threat' | 'control' | 'asset'
  properties: Record<string, unknown>
}

export interface GraphQueryOptions {
  relationshipType?: RiskRelationshipType
  minStrength?: number
  maxDistance?: number
}

type GraphFeatureFlags = {
  enabled: boolean
}

const getGraphFlags = (): GraphFeatureFlags => ({
  enabled: import.meta.env.VITE_ENABLE_GRAPH_DB === 'true',
})

export class GraphDatabaseService {
  private connected = false

  connect(): void {
    if (!getGraphFlags().enabled) return
    this.connected = true
  }

  disconnect(): void {
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async upsertRiskNode(risk: Risk): Promise<RiskGraphNode | null> {
    void risk
    if (!getGraphFlags().enabled) return null
    if (!this.connected) this.connect()

    return {
      id: risk.id,
      type: 'risk',
      properties: {
        title: risk.title,
        category: risk.category,
        riskScore: risk.riskScore,
      },
    }
  }

  async createRelationship(relationship: RiskRelationship): Promise<RiskRelationship | null> {
    void relationship
    if (!getGraphFlags().enabled) return null
    if (!this.connected) this.connect()
    return relationship
  }

  async queryRelatedRisks(_riskId: string, _options: GraphQueryOptions = {}): Promise<Risk[]> {
    if (!getGraphFlags().enabled) return []
    if (!this.connected) this.connect()
    return []
  }
}

export const graphDatabaseService = new GraphDatabaseService()
