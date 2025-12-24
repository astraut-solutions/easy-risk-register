export type PlaybookTemplate = {
  id: string
  title: string
  steps: string[]
}

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: 'playbook_privacy_incident_ndb_v1',
    title: 'Privacy incident response (NDB-ready)',
    steps: [
      'Contain the incident and preserve evidence (logs, emails, device images).',
      'Assess what information was involved and whether there is a likely risk of serious harm.',
      'Engage internal stakeholders (privacy lead, IT, legal) and assign an incident manager.',
      'Decide notification path (OAIC + affected individuals) and prepare draft notices.',
      'Notify impacted individuals with clear guidance (what happened, what to do, support channels).',
      'Post-incident review: root cause, remediation actions, and updates to controls/training.',
    ],
  },
  {
    id: 'playbook_ransomware_v1',
    title: 'Ransomware response',
    steps: [
      'Isolate affected systems (disconnect network, disable compromised accounts).',
      'Preserve evidence and identify initial access vector (phishing, RDP, vulnerability).',
      'Assess backups and restoration options; avoid paying ransom without expert/legal guidance.',
      'Reset credentials and enforce MFA; patch vulnerabilities exploited.',
      'Restore from known-good backups and monitor for re-compromise.',
      'Communicate internally/externally as required; perform a lessons-learned review.',
    ],
  },
  {
    id: 'playbook_bec_v1',
    title: 'Business email compromise / phishing response',
    steps: [
      'Reset affected credentials and revoke active sessions; enforce MFA.',
      'Search mailboxes for related messages and block malicious senders/domains.',
      'Review forwarding rules and suspicious OAuth app grants; remove as needed.',
      'Assess financial exposure (payment diversion) and contact the bank if applicable.',
      'Notify impacted customers/vendors if relevant; document timeline and actions.',
      'Improve controls (training, DMARC/SPF/DKIM, conditional access).',
    ],
  },
]

