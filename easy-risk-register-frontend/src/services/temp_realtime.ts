import { io, Socket } from 'socket.io-client';  
import type { Risk } from '../types/risk';  
  
interface RiskUpdateEvent {  
  riskId: string;  
  action: 'create' | 'update' | 'delete';  
  data: Risk | null;  
}  
  
interface RiskSyncEvent {  
  risks: Risk[];  
  timestamp: number;  
}  
  
class RealtimeService { 
