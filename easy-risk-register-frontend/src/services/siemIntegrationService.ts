import type { Risk } from '../types/risk';

export interface SiemConfig {
  siemType: 'wazuh' | 'elk' | 'securityonion';
}

export interface SiemAlert {
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

export interface SiemEvent {
  id: string;
  timestamp: string; // ISO date
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  tags?: string[];
  fields: Record<string, any>;
}

export interface SiemQuery {
  query: string;
  timeRange: {
    from: string; // ISO date
    to: string; // ISO date
  };
  limit?: number;
}

type SiemFeatureFlags = {
  enabled: boolean;
  apiBaseUrl: string;
};

const getSiemFlags = (): SiemFeatureFlags => ({
  enabled: import.meta.env.VITE_ENABLE_SIEM === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
});

/**
 * Service for integrating with SIEM systems.
 *
 * Security policy:
 * - Feature-flagged (off by default)
 * - Credentials must be stored server-side only
 * - Frontend only calls same-origin (or configured) `/api/siem/*` routes
 */
export class SiemIntegrationService {
  private config: SiemConfig;

  constructor(config: SiemConfig) {
    this.config = config;
  }

  private async postJson<T>(path: string, body: unknown): Promise<T | null> {
    const flags = getSiemFlags();
    if (!flags.enabled) return null;

    try {
      const res = await fetch(`${flags.apiBaseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });

      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async connect(): Promise<boolean> {
    const flags = getSiemFlags();
    if (!flags.enabled) return false;
    const result = await this.postJson<{ ok: boolean }>('/api/siem/ping', { siemType: this.config.siemType });
    return Boolean(result?.ok);
  }

  async fetchAlerts(query?: SiemQuery): Promise<SiemAlert[]> {
    const flags = getSiemFlags();
    if (!flags.enabled) return [];
    return (
      (await this.postJson<SiemAlert[]>('/api/siem/alerts', {
        siemType: this.config.siemType,
        query: query ?? null,
      })) ?? []
    );
  }

  async fetchEvents(query?: SiemQuery): Promise<SiemEvent[]> {
    const flags = getSiemFlags();
    if (!flags.enabled) return [];
    return (
      (await this.postJson<SiemEvent[]>('/api/siem/events', {
        siemType: this.config.siemType,
        query: query ?? null,
      })) ?? []
    );
  }

  async search(query: SiemQuery): Promise<any[]> {
    const flags = getSiemFlags();
    if (!flags.enabled) return [];
    return (
      (await this.postJson<any[]>('/api/siem/search', {
        siemType: this.config.siemType,
        query,
      })) ?? []
    );
  }

  alertsToRisks(alerts: SiemAlert[]): Partial<Risk>[] {
    return alerts.map((alert) => {
      let probability = 3;
      let impact = 3;

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
        evidence: [
          {
            type: 'other' as const,
            url: '',
            description: `SIEM Alert ID: ${alert.id}, Rule: ${alert.ruleName || alert.ruleId}`,
          },
        ],
        creationDate: alert.timestamp,
        lastModified: new Date().toISOString(),
        immediateAttention: alert.severity === 'critical' || alert.severity === 'high',
      };
    });
  }

  eventsToRisks(events: SiemEvent[]): Partial<Risk>[] {
    return events.map((event) => {
      let probability = 2;
      let impact = 2;

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
        evidence: [
          {
            type: 'other' as const,
            url: '',
            description: `SIEM Event ID: ${event.id}`,
          },
        ],
        creationDate: event.timestamp,
        lastModified: new Date().toISOString(),
        immediateAttention: event.severity === 'critical' || event.severity === 'error',
      };
    });
  }

  private mapAlertCategoryToThreatType(category: string): string {
    const lower = String(category || '').toLowerCase();
    if (lower.includes('malware')) return 'malware';
    if (lower.includes('phish')) return 'phishing';
    if (lower.includes('ransom')) return 'ransomware';
    if (lower.includes('intrusion') || lower.includes('unauthorized')) return 'unauthorized_access';
    if (lower.includes('dos') || lower.includes('ddos')) return 'dos';
    return 'other';
  }
}

export const createSiemIntegrationService = (config: SiemConfig) => new SiemIntegrationService(config);

