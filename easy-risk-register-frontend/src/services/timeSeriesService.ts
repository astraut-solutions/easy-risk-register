import { InfluxDB, Point } from '@influxdata/influxdb-client';  
import type { Risk } from '../types/risk';  
  
interface RiskTrendData { 
  riskId: string;  
  probability: number;  
  impact: number;  
  riskScore: number;  
  timestamp: number;  
  category?: string;  
  status?: Risk['status'];  
}  
  
interface TimeSeriesQueryOptions {  
  riskId?: string;  
  category?: string;  
  startDate?: Date;  
  endDate?: Date;  
  limit?: number;  
}  
  
class TimeSeriesService { 
  private client: InfluxDB | null = null;  
  private readonly bucket: string;  
  private readonly org: string;  
  private readonly token: string;  
  private readonly url: string;  
  
  constructor() {  
    this.url = import.meta.env.VITE_INFLUXDB_URL || '';  
    this.token = import.meta.env.VITE_INFLUXDB_TOKEN || '';  
    this.org = import.meta.env.VITE_INFLUXDB_ORG || '';  
    this.bucket = import.meta.env.VITE_INFLUXDB_BUCKET || 'risk-data';  
  
