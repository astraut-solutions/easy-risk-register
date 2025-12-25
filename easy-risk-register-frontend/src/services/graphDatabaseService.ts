import type { Risk } from '../types/risk';  
  
interface RiskRelationship { 
  fromRiskId: string;  
  toRiskId: string;  
  relationshipType: 'depends_on' | 'affects' | 'mitigates' | 'similar_to' | 'conflicts_with';  
  strength: number; // 1-10 scale  
  description: string;  
}  
  
interface RiskGraphNode {  
  id: string;  
  type: 'risk' | 'threat' | 'control' | 'asset';  
  properties: {  
    [key: string]: any;  
  };  
}  
  
interface GraphQueryOptions {  
  relationshipType?: RiskRelationship['relationshipType'];  
  minStrength?: number;  
  maxDistance?: number; // For pathfinding  
}  
  
class GraphDatabaseService { 
