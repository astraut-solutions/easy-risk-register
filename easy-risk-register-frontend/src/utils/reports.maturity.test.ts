import { describe, expect, it } from 'vitest'

import { buildMaturityAssessmentReportHtml } from './reports'

describe('maturity assessment report html', () => {
  it('includes disclaimer, preset label, and a scores table', () => {
    const html = buildMaturityAssessmentReportHtml({
      generatedAtIso: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      presetLabel: 'NIST CSF (inspired)',
      pngDataUrl: 'data:image/png;base64,abc',
      disclaimer: 'Self-assessment only. Not certification.',
      assessment: {
        frameworkName: 'NIST CSF (inspired)',
        createdAt: Date.parse('2025-01-01T00:00:00.000Z'),
        updatedAt: Date.parse('2025-01-02T00:00:00.000Z'),
        domains: [
          { name: 'Identify', score: 1 },
          { name: 'Protect', score: 2, notes: 'Some notes' },
        ],
      },
    })

    expect(html).toContain('Maturity self-assessment report')
    expect(html).toContain('Self-assessment only. Not certification.')
    expect(html).toContain('NIST CSF (inspired)')
    expect(html).toContain('<table>')
    expect(html).toContain('Score (0–4)')
    expect(html).toContain('Identify')
    expect(html).toContain('Protect')
  })

  it('renders a chart unavailable placeholder when png missing', () => {
    const html = buildMaturityAssessmentReportHtml({
      generatedAtIso: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      presetLabel: 'ACSC Essential Eight (inspired)',
      pngDataUrl: null,
      disclaimer: 'Self-assessment only.',
      assessment: {
        frameworkName: 'ACSC Essential Eight (inspired)',
        createdAt: Date.parse('2025-01-01T00:00:00.000Z'),
        updatedAt: Date.parse('2025-01-01T00:00:00.000Z'),
        domains: [{ name: 'Application control', score: 0 }],
      },
    })

    expect(html).toContain('Chart unavailable.')
  })
})
