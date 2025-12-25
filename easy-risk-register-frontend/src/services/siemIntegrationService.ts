import type { Risk } from '../types/risk';

interface SiemConfig {
  siemType: 'wazuh' | 'elk' | 'securityonion';
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
}

interface SiemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string; // ISO date
  sourceIp?: string;
  destinationIp?: string;
  category: string;
  ruleId?: string;
  ruleName?: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
  rawLog: string;
}

interface SiemEvent {
  id: string;
  timestamp: string; // ISO date
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  tags?: string[];
  fields: Record<string, any>;
}

interface SiemQuery {
  query: string;
  timeRange: {
    from: string; // ISO date
    to: string; // ISO date
  };
  limit?: number;
}

/**
 * Service for integrating with SIEM systems (Wazuh, ELK Stack, Security Onion)
 */
export class SiemIntegrationService {
  private config: SiemConfig;

  constructor(config: SiemConfig) {
    this.config = config;
  }

  /**
   * Connect to the SIEM system
   */
  async connect(): Promise<boolean> {
    try {
      switch (this.config.siemType) {
        case 'wazuh':
          return await this.connectToWazuh();
        case 'elk':
          return await this.connectToELK();
        case 'securityonion':
          return await this.connectToSecurityOnion();
        default:
          throw new Error(`Unsupported SIEM type: ${this.config.siemType}`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${this.config.siemType}:`, error);
      return false;
    }
  }

  /**
   * Fetch security alerts from the SIEM
   */
  async fetchAlerts(query?: SiemQuery): Promise<SiemAlert[]> {
    try {
      switch (this.config.siemType) {
        case 'wazuh':
          return await this.fetchWazuhAlerts(query);
        case 'elk':
          return await this.fetchELKAlerts(query);
        case 'securityonion':
          return await this.fetchSecurityOnionAlerts(query);
        default:
          throw new Error(`Unsupported SIEM type: ${this.config.siemType}`);
      }
    } catch (error) {
      console.error(`Failed to fetch alerts from ${this.config.siemType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch security events from the SIEM
   */
  async fetchEvents(query?: SiemQuery): Promise<SiemEvent[]> {
    try {
      switch (this.config.siemType) {
        case 'wazuh':
          return await this.fetchWazuhEvents(query);
        case 'elk':
          return await this.fetchELKEvents(query);
        case 'securityonion':
          return await this.fetchSecurityOnionEvents(query);
        default:
          throw new Error(`Unsupported SIEM type: ${this.config.siemType}`);
      }
    } catch (error) {
      console.error(`Failed to fetch events from ${this.config.siemType}:`, error);
      throw error;
    }
  }

  /**
   * Search for specific patterns or events in the SIEM
   */
  async search(query: SiemQuery): Promise<any[]> {
    try {
      switch (this.config.siemType) {
        case 'wazuh':
          return await this.searchWazuh(query);
        case 'elk':
          return await this.searchELK(query);
        case 'securityonion':
          return await this.searchSecurityOnion(query);
        default:
          throw new Error(`Unsupported SIEM type: ${this.config.siemType}`);
      }
    } catch (error) {
      console.error(`Failed to search ${this.config.siemType}:`, error);
      throw error;
    }
  }

  /**
   * Convert SIEM alerts to risk objects for the risk register
   */
  alertsToRisks(alerts: SiemAlert[]): Partial<Risk>[] {
    return alerts.map(alert => {
      // Map SIEM alert severity to risk probability and impact
      let probability = 3; // Default to medium
      let impact = 3; // Default to medium
      
      switch (alert.severity) {
        case 'critical':
          probability = 5;
          impact = 5;
          break;
        case 'high':
          probability = 4;
          impact = 4;
          break;
        case 'medium':
          probability = 3;
          impact = 3;
          break;
        case 'low':
          probability = 2;
          impact = 2;
          break;
      }

      // Calculate risk score (probability * impact)
      const riskScore = probability * impact;

      return {
        title: alert.title,
        description: alert.description || `Security alert from SIEM: ${alert.ruleName || alert.category}`,
        probability,
        impact,
        riskScore,
        category: alert.category || 'Security Event',
        threatType: this.mapAlertCategoryToThreatType(alert.category),
        status: 'open',
        mitigationPlan: 'Investigate and respond to the security alert',
        evidence: [{
          type: 'other' as const,
          url: '',
          description: `SIEM Alert ID: ${alert.id}, Rule: ${alert.ruleName || alert.ruleId}`
        }],
        creationDate: alert.timestamp,
        lastModified: new Date().toISOString(),
        immediateAttention: alert.severity === 'critical' || alert.severity === 'high'
      };
    });
  }

  /**
   * Convert SIEM events to risk objects for the risk register
   */
  eventsToRisks(events: SiemEvent[]): Partial<Risk>[] {
    return events.map(event => {
      // Map SIEM event severity to risk probability and impact
      let probability = 2; // Default to low for events
      let impact = 2; // Default to low for events
      
      switch (event.severity) {
        case 'critical':
          probability = 4;
          impact = 5;
          break;
        case 'error':
          probability = 3;
          impact = 4;
          break;
        case 'warning':
          probability = 3;
          impact = 3;
          break;
        case 'info':
          probability = 2;
          impact = 2;
          break;
      }

      // Calculate risk score (probability * impact)
      const riskScore = probability * impact;

      return {
        title: event.message.substring(0, 50) + (event.message.length > 50 ? '...' : ''),
        description: event.message,
        probability,
        impact,
        riskScore,
        category: 'Security Event',
        threatType: 'other',
        status: 'open',
        mitigationPlan: 'Review and assess the security event',
        evidence: [{
          type: 'other' as const,
          url: '',
          description: `SIEM Event ID: ${event.id}`
        }],
        creationDate: event.timestamp,
        lastModified: new Date().toISOString(),
        immediateAttention: event.severity === 'critical' || event.severity === 'error'
      };
    });
  }

  // Wazuh-specific methods
  private async connectToWazuh(): Promise<boolean> {
    // Wazuh API connection logic
    const response = await fetch(`${this.config.baseUrl}/api/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `Bearer ${this.config.apiKey}` 
          : `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
      }
    });

    return response.ok;
  }

  private async fetchWazuhAlerts(query?: SiemQuery): Promise<SiemAlert[]> {
    // Fetch alerts from Wazuh
    let url = `${this.config.baseUrl}/api/alerts`;
    const params = new URLSearchParams();
    
    if (query) {
      if (query.timeRange) {
        params.append('dateFrom', query.timeRange.from);
        params.append('dateTo', query.timeRange.to);
      }
      if (query.limit) {
        params.append('limit', query.limit.toString());
      }
      if (query.query) {
        params.append('search', query.query);
      }
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `Bearer ${this.config.apiKey}` 
          : `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
      }
    });

    if (!response.ok) {
      throw new Error(`Wazuh API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data?.affected_items?.map((alert: any) => ({
      id: alert.id || alert.rule?.id,
      title: alert.rule?.description || `Wazuh Alert ${alert.rule?.id}`,
      description: alert.rule?.description || alert.description || '',
      severity: this.mapWazuhSeverity(alert.rule?.level),
      timestamp: alert.timestamp || new Date().toISOString(),
      sourceIp: alert.source?.ip,
      destinationIp: alert.destination?.ip,
      category: alert.rule?.description || alert.location,
      ruleId: alert.rule?.id,
      ruleName: alert.rule?.description,
      status: this.mapWazuhStatus(alert.status),
      rawLog: JSON.stringify(alert)
    })) || [];
  }

  private async fetchWazuhEvents(query?: SiemQuery): Promise<SiemEvent[]> {
    // Fetch events from Wazuh
    let url = `${this.config.baseUrl}/api/overview`;
    const params = new URLSearchParams();
    
    if (query) {
      if (query.timeRange) {
        params.append('dateFrom', query.timeRange.from);
        params.append('dateTo', query.timeRange.to);
      }
      if (query.limit) {
        params.append('limit', query.limit.toString());
      }
      if (query.query) {
        params.append('search', query.query);
      }
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `Bearer ${this.config.apiKey}` 
          : `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
      }
    });

    if (!response.ok) {
      throw new Error(`Wazuh API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data?.affected_items?.map((event: any) => ({
      id: event.id,
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.agent?.name || 'Unknown',
      message: event.description || JSON.stringify(event),
      severity: this.mapWazuhSeverity(event.rule?.level),
      tags: event.tags || [],
      fields: event
    })) || [];
  }

  private async searchWazuh(query: SiemQuery): Promise<any[]> {
    // Search in Wazuh
    const response = await fetch(`${this.config.baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `Bearer ${this.config.apiKey}` 
          : `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
      },
      body: JSON.stringify({
        q: query.query,
        dateFrom: query.timeRange.from,
        dateTo: query.timeRange.to,
        limit: query.limit || 10
      })
    });

    if (!response.ok) {
      throw new Error(`Wazuh search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.affected_items || [];
  }

  // ELK Stack-specific methods
  private async connectToELK(): Promise<boolean> {
    // ELK (Elasticsearch) API connection logic
    const response = await fetch(`${this.config.baseUrl}/_cluster/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      }
    });

    return response.ok;
  }

  private async fetchELKAlerts(query?: SiemQuery): Promise<SiemAlert[]> {
    // Fetch alerts from ELK (Elastic Security)
    // This would typically query the .siem-alerts index
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    const response = await fetch(`${this.config.baseUrl}/.siem-alerts/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`ELK API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.hits?.hits?.map((hit: any) => {
      const source = hit._source;
      return {
        id: hit._id,
        title: source.signal?.rule?.name || source.message || 'Unknown Alert',
        description: source.message || JSON.stringify(source),
        severity: this.mapELKSeverity(source.signal?.rule?.severity || source.level),
        timestamp: source['@timestamp'] || new Date().toISOString(),
        sourceIp: source.source?.ip,
        destinationIp: source.destination?.ip,
        category: source.signal?.rule?.category || 'Security Alert',
        ruleId: source.signal?.rule?.id,
        ruleName: source.signal?.rule?.name,
        status: this.mapELKStatus(source.signal?.status),
        rawLog: JSON.stringify(source)
      };
    }) || [];
  }

  private async fetchELKEvents(query?: SiemQuery): Promise<SiemEvent[]> {
    // Fetch events from ELK
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    const response = await fetch(`${this.config.baseUrl}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`ELK API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.hits?.hits?.map((hit: any) => {
      const source = hit._source;
      return {
        id: hit._id,
        timestamp: source['@timestamp'] || new Date().toISOString(),
        source: source.agent?.name || source.host?.name || 'Unknown',
        message: source.message || JSON.stringify(source),
        severity: this.mapELKSeverity(source.level),
        tags: source.tags || [],
        fields: source
      };
    }) || [];
  }

  private async searchELK(query: SiemQuery): Promise<any[]> {
    // Search in ELK
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    const response = await fetch(`${this.config.baseUrl}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`ELK search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map((hit: any) => hit._source) || [];
  }

  // Security Onion-specific methods
  private async connectToSecurityOnion(): Promise<boolean> {
    // Security Onion API connection logic
    // Security Onion typically uses Elasticsearch API
    const response = await fetch(`${this.config.baseUrl}/api/v1/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `Bearer ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      }
    });

    return response.ok;
  }

  private async fetchSecurityOnionAlerts(query?: SiemQuery): Promise<SiemAlert[]> {
    // Fetch alerts from Security Onion
    // Security Onion stores data in Elasticsearch indices
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    // Security Onion typically uses indices like "so-*" or "suricata-*", "zeek-*"
    const response = await fetch(`${this.config.baseUrl}/so-alerts-*/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`Security Onion API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.hits?.hits?.map((hit: any) => {
      const source = hit._source;
      return {
        id: hit._id,
        title: source.alert?.signature || source.message || 'Unknown Alert',
        description: source.message || JSON.stringify(source),
        severity: this.mapSecurityOnionSeverity(source.alert?.severity || source.level),
        timestamp: source['@timestamp'] || new Date().toISOString(),
        sourceIp: source.src_ip,
        destinationIp: source.dest_ip,
        category: source.alert?.category || source.event?.category || 'Security Alert',
        ruleId: source.alert?.signature_id,
        ruleName: source.alert?.signature,
        status: this.mapSecurityOnionStatus(source.alert?.status),
        rawLog: JSON.stringify(source)
      };
    }) || [];
  }

  private async fetchSecurityOnionEvents(query?: SiemQuery): Promise<SiemEvent[]> {
    // Fetch events from Security Onion
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    const response = await fetch(`${this.config.baseUrl}/so-events-*/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`Security Onion API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.hits?.hits?.map((hit: any) => {
      const source = hit._source;
      return {
        id: hit._id,
        timestamp: source['@timestamp'] || new Date().toISOString(),
        source: source.host?.name || 'Unknown',
        message: source.message || JSON.stringify(source),
        severity: this.mapSecurityOnionSeverity(source.level),
        tags: source.tags || [],
        fields: source
      };
    }) || [];
  }

  private async searchSecurityOnion(query: SiemQuery): Promise<any[]> {
    // Search in Security Onion
    const searchBody = {
      query: {
        bool: {
          must: [
            query?.query ? { match: { message: query.query } } : { match_all: {} }
          ],
          filter: [
            query?.timeRange ? {
              range: {
                '@timestamp': {
                  gte: query.timeRange.from,
                  lte: query.timeRange.to
                }
              }
            } : {}
          ]
        }
      },
      size: query?.limit || 100
    };

    const response = await fetch(`${this.config.baseUrl}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        'Authorization': this.config.apiKey 
          ? `ApiKey ${this.config.apiKey}` 
          : this.config.username && this.config.password
            ? `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
            : undefined
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`Security Onion search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map((hit: any) => hit._source) || [];
  }

  // Helper methods
  private mapWazuhSeverity(level: number): SiemAlert['severity'] {
    if (level >= 8) return 'critical';
    if (level >= 6) return 'high';
    if (level >= 4) return 'medium';
    return 'low';
  }

  private mapWazuhStatus(status: string): SiemAlert['status'] {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'fixed':
        return 'resolved';
      case 'acknowledged':
      case 'ack':
        return 'acknowledged';
      case 'false_positive':
      case 'false':
        return 'false_positive';
      default:
        return 'new';
    }
  }

  private mapELKSeverity(level: string): SiemAlert['severity'] {
    if (!level) return 'medium';
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('critical') || lowerLevel.includes('high')) return 'critical';
    if (lowerLevel.includes('medium')) return 'high';
    if (lowerLevel.includes('low')) return 'medium';
    return 'low';
  }

  private mapELKStatus(status: string): SiemAlert['status'] {
    switch (status?.toLowerCase()) {
      case 'closed':
      case 'resolved':
        return 'resolved';
      case 'acknowledged':
      case 'ack':
        return 'acknowledged';
      case 'false_positive':
      case 'false':
        return 'false_positive';
      default:
        return 'new';
    }
  }

  private mapSecurityOnionSeverity(level: number | string): SiemAlert['severity'] {
    if (typeof level === 'number') {
      if (level >= 2) return 'critical';
      if (level >= 1) return 'high';
      return 'medium';
    }
    
    const lowerLevel = String(level).toLowerCase();
    if (lowerLevel.includes('critical') || lowerLevel.includes('high')) return 'critical';
    if (lowerLevel.includes('medium')) return 'high';
    if (lowerLevel.includes('low')) return 'medium';
    return 'low';
  }

  private mapSecurityOnionStatus(status: string): SiemAlert['status'] {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'fixed':
        return 'resolved';
      case 'acknowledged':
      case 'ack':
        return 'acknowledged';
      case 'false_positive':
      case 'false':
        return 'false_positive';
      default:
        return 'new';
    }
  }

  private mapAlertCategoryToThreatType(category: string = ''): Risk['threatType'] {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('phishing') || lowerCategory.includes('email')) {
      return 'business_email_compromise';
    } else if (lowerCategory.includes('malware') || lowerCategory.includes('virus')) {
      return 'malware';
    } else if (lowerCategory.includes('vulnerability') || lowerCategory.includes('cve')) {
      return 'vulnerability';
    } else if (lowerCategory.includes('data') || lowerCategory.includes('breach')) {
      return 'data_breach';
    } else if (lowerCategory.includes('insider')) {
      return 'insider';
    } else if (lowerCategory.includes('supply') || lowerCategory.includes('vendor')) {
      return 'supply_chain';
    } else {
      return 'other';
    }
  }
}

// Convenience function to create a SIEM integration service
export const createSiemIntegrationService = (config: SiemConfig) => {
  return new SiemIntegrationService(config);
};