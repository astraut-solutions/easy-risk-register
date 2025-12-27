export type IntegrationId =
  | 'timeseries'
  | 'realtime'
  | 'graphDb'
  | 'siem'
  | 'vulnerabilityScanner'

export type IntegrationCatalogItem = {
  id: IntegrationId
  name: string
  flagEnvVar: string
  enabled: boolean
  dataLeavesDevice: boolean
  disclosure: string
  docsPath?: string
}

export const integrationCatalog = (): IntegrationCatalogItem[] => [
  {
    id: 'timeseries',
    name: 'Time-series history',
    flagEnvVar: 'VITE_ENABLE_TIMESERIES',
    enabled: import.meta.env.VITE_ENABLE_TIMESERIES === 'true',
    dataLeavesDevice: true,
    disclosure:
      'When enabled, this app sends time-series snapshots (risk score, probability, impact, timestamps, and optional category/status) from your browser to your configured serverless API endpoints (`/api/timeseries/*`).',
    docsPath: 'docs/guides/deploy/serverless-integrations.md',
  },
  {
    id: 'realtime',
    name: 'Real-time updates',
    flagEnvVar: 'VITE_ENABLE_REALTIME',
    enabled: import.meta.env.VITE_ENABLE_REALTIME === 'true',
    dataLeavesDevice: true,
    disclosure:
      'When enabled, this app connects to a WebSocket server for live updates. Risk data may be transmitted over that connection depending on your deployment.',
  },
  {
    id: 'graphDb',
    name: 'Graph relationships',
    flagEnvVar: 'VITE_ENABLE_GRAPH_DB',
    enabled: import.meta.env.VITE_ENABLE_GRAPH_DB === 'true',
    dataLeavesDevice: true,
    disclosure:
      'When enabled, graph relationship queries run via an integration backend. Do not store graph DB credentials in the browser.',
    docsPath: 'docs/guides/deploy/serverless-integrations.md',
  },
  {
    id: 'siem',
    name: 'SIEM integration',
    flagEnvVar: 'VITE_ENABLE_SIEM',
    enabled: import.meta.env.VITE_ENABLE_SIEM === 'true',
    dataLeavesDevice: true,
    disclosure:
      'When enabled, SIEM queries are executed by server-side APIs. Do not enter SIEM API keys or passwords into the browser.',
    docsPath: 'docs/guides/deploy/serverless-integrations.md',
  },
  {
    id: 'vulnerabilityScanner',
    name: 'Vulnerability scanner integration',
    flagEnvVar: 'VITE_ENABLE_VULN_SCANNER',
    enabled: import.meta.env.VITE_ENABLE_VULN_SCANNER === 'true',
    dataLeavesDevice: true,
    disclosure:
      'When enabled, scanner queries are executed by server-side APIs. Do not enter scanner tokens into the browser.',
    docsPath: 'docs/guides/deploy/serverless-integrations.md',
  },
]
