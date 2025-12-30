import type { MaturityFrameworkPreset } from '../types/visualization'

export const MATURITY_FRAMEWORK_ID_BY_PRESET: Record<MaturityFrameworkPreset, string> = {
  acsc_essential_eight: 'maturity_acsc_essential_eight_v1',
  nist_csf: 'maturity_nist_csf_v1',
}

export const MATURITY_PRESET_BY_FRAMEWORK_ID: Record<string, MaturityFrameworkPreset> = {
  maturity_acsc_essential_eight_v1: 'acsc_essential_eight',
  maturity_nist_csf_v1: 'nist_csf',
}

export function frameworkIdToPreset(frameworkId: string): MaturityFrameworkPreset | null {
  const preset = MATURITY_PRESET_BY_FRAMEWORK_ID[String(frameworkId)] as MaturityFrameworkPreset | undefined
  return preset ?? null
}

