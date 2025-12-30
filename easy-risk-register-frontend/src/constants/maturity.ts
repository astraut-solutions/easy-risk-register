import type { MaturityFrameworkPreset } from '../types/visualization'

export const MATURITY_PRESETS: Record<
  MaturityFrameworkPreset,
  { frameworkName: string; domains: Array<{ key: string; name: string }> }
> = {
  acsc_essential_eight: {
    frameworkName: 'ACSC Essential Eight (inspired)',
    domains: [
      { key: 'application_control', name: 'Application control' },
      { key: 'patch_applications', name: 'Patch applications' },
      { key: 'macro_settings', name: 'Configure Microsoft Office macros' },
      { key: 'user_application_hardening', name: 'User application hardening' },
      { key: 'restrict_admin', name: 'Restrict administrative privileges' },
      { key: 'patch_operating_systems', name: 'Patch operating systems' },
      { key: 'mfa', name: 'Multi-factor authentication (MFA)' },
      { key: 'backups', name: 'Regular backups' },
    ],
  },
  nist_csf: {
    frameworkName: 'NIST CSF (inspired)',
    domains: [
      { key: 'identify', name: 'Identify' },
      { key: 'protect', name: 'Protect' },
      { key: 'detect', name: 'Detect' },
      { key: 'respond', name: 'Respond' },
      { key: 'recover', name: 'Recover' },
    ],
  },
}

