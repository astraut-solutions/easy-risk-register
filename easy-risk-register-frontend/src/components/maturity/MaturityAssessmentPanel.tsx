import { useEffect, useMemo, useRef, useState } from 'react'
import { Radar } from 'react-chartjs-2'

import type { MaturityAssessment, MaturityFrameworkPreset } from '../../types/visualization'
import { Button, Select, Textarea } from '../../design-system'
import { ensureChartJsRegistered } from '../charts/chartjs'
import { buildMaturityAssessmentReportHtml, openReportWindow } from '../../utils/reports'

const scoreOptions = [
  { value: 0, label: '0 — Not started' },
  { value: 1, label: '1 — Initial' },
  { value: 2, label: '2 — Developing' },
  { value: 3, label: '3 — Defined' },
  { value: 4, label: '4 — Managed' },
]

const presetLabel: Record<MaturityFrameworkPreset, string> = {
  acsc_essential_eight: 'ACSC Essential Eight (inspired)',
  nist_csf: 'NIST CSF (inspired)',
}

const dateLabel = (ms: number) => {
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ms)
  }
}

export interface MaturityAssessmentPanelProps {
  settings: {
    maturityEnabled: boolean
    maturityFrameworkPreset: MaturityFrameworkPreset
  }
  assessments: MaturityAssessment[]
  onCreate: (preset?: MaturityFrameworkPreset) => MaturityAssessment
  onUpdateDomain: (assessmentId: string, domainKey: string, updates: { score?: number; notes?: string }) => void
  onDelete: (assessmentId: string) => void
}

export const MaturityAssessmentPanel = ({
  settings,
  assessments,
  onCreate,
  onUpdateDomain,
  onDelete,
}: MaturityAssessmentPanelProps) => {
  ensureChartJsRegistered()

  const [selectedId, setSelectedId] = useState<string>(() => assessments[0]?.id ?? '')
  const [createPreset, setCreatePreset] = useState<MaturityFrameworkPreset>(
    settings.maturityFrameworkPreset,
  )
  const radarRef = useRef<any>(null)

  useEffect(() => {
    setCreatePreset(settings.maturityFrameworkPreset)
  }, [settings.maturityFrameworkPreset])

  const selected = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedId) ?? null,
    [assessments, selectedId],
  )

  const selectionOptions = useMemo(
    () =>
      assessments.map((assessment) => ({
        value: assessment.id,
        label: `${assessment.frameworkName} — ${dateLabel(assessment.createdAt)}`,
      })),
    [assessments],
  )

  const chartData = useMemo(() => {
    if (!selected) return null
    return {
      labels: selected.domains.map((domain) => domain.name),
      datasets: [
        {
          label: 'Maturity (0–4)',
          data: selected.domains.map((domain) => domain.score),
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.95)',
          borderWidth: 2,
          pointRadius: 2,
        },
      ],
    }
  }, [selected])

  const downloadPng = () => {
    const chart = radarRef.current
    if (!chart || typeof chart.toBase64Image !== 'function') return
    const dataUrl = chart.toBase64Image('image/png', 1)
    try {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `easy-risk-register__maturity__${new Date().toISOString().replaceAll(':', '-')}.png`
      link.click()
    } catch {
      // ignore
    }
  }

  const exportPdf = () => {
    if (!selected) return
    const chart = radarRef.current
    const pngDataUrl = chart && typeof chart.toBase64Image === 'function' ? chart.toBase64Image('image/png', 1) : null
    const html = buildMaturityAssessmentReportHtml({
      generatedAtIso: new Date().toISOString(),
      assessment: selected,
      presetLabel: presetLabel[selected.frameworkKey],
      pngDataUrl,
      disclaimer:
        'Self-assessment only. This is assistive and does not represent certification, compliance, or legal advice.',
    })
    openReportWindow(html, 'Maturity self-assessment report')
  }

  if (!settings.maturityEnabled) {
    return (
      <div className="rr-panel p-8 text-center">
        <p className="text-lg font-semibold text-text-high">Maturity radar is disabled</p>
        <p className="mt-2 text-sm text-text-low">
          Enable it in Settings → Visualizations → Maturity self-assessment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rr-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-high">Maturity self-assessment (radar)</h3>
            <p className="mt-1 text-xs text-text-low">
              Self-assessment only. Use this to track progress and communicate gaps—this is not a certification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[260px]">
              <Select
                label="New assessment preset"
                labelVisibility="sr-only"
                options={[
                  { value: 'acsc_essential_eight', label: presetLabel.acsc_essential_eight },
                  { value: 'nist_csf', label: presetLabel.nist_csf },
                ]}
                value={createPreset}
                onChange={(value) => setCreatePreset(value as MaturityFrameworkPreset)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                const created = onCreate(createPreset)
                setSelectedId(created.id)
              }}
            >
              New assessment
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={exportPdf} disabled={!selected}>
              Export PDF
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={downloadPng} disabled={!selected}>
              Export PNG
            </Button>
          </div>
        </div>

        {assessments.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Assessment"
              options={selectionOptions}
              value={selectedId}
              onChange={(value) => setSelectedId(value)}
            />
            <Select
              label="Framework preset (default for new)"
              options={[
                { value: 'acsc_essential_eight', label: presetLabel.acsc_essential_eight },
                { value: 'nist_csf', label: presetLabel.nist_csf },
              ]}
              value={settings.maturityFrameworkPreset}
              onChange={() => {
                // Changing the default preset happens in Settings; keep this as informational here.
              }}
              disabled
              helperText="Change the default in Settings."
            />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border-faint bg-surface-secondary/10 p-4 text-sm text-text-low">
            No assessments yet. Create one to start scoring.
          </div>
        )}
      </div>

      {selected && chartData ? (
        <div className="space-y-4">
          <div className="rr-panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-text-high">Radar chart</h4>
                <p className="mt-1 text-xs text-text-low">
                  Scores range from 0 (not started) to 4 (managed).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  onDelete(selected.id)
                  setSelectedId('')
                }}
              >
                Delete assessment
              </Button>
            </div>
            <div className="mt-4" style={{ height: '400px' }} aria-label="Maturity radar chart">
              <div className="h-full w-full">
                <Radar
                  ref={radarRef}
                  data={chartData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      r: {
                        min: 0,
                        max: 4,
                        ticks: { stepSize: 1 },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-text-low">
              Created: <span className="font-semibold text-text-high">{dateLabel(selected.createdAt)}</span> · Updated:{' '}
              <span className="font-semibold text-text-high">{dateLabel(selected.updatedAt)}</span>
            </p>
          </div>

          <div className="rr-panel p-5">
            <h4 className="text-sm font-semibold text-text-high">Domain scores and notes</h4>
            <p className="mt-1 text-xs text-text-low">
              Update scores and optional notes. Changes are saved locally.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {selected.domains.map((domain, index) => (
                <div key={domain.key} className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4 transition-colors hover:bg-surface-secondary/20">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-text-high">{domain.name}</p>
                      </div>
                      <Select
                        label="Score"
                        labelVisibility="sr-only"
                        options={scoreOptions.map((option) => ({ value: String(option.value), label: option.label }))}
                        value={String(domain.score)}
                        onChange={(value) => onUpdateDomain(selected.id, domain.key, { score: Number(value) })}
                      />
                    </div>

                    <Textarea
                      label="Notes (optional)"
                      value={domain.notes ?? ''}
                      onChange={(event) => onUpdateDomain(selected.id, domain.key, { notes: event.target.value })}
                      rows={1}
                      placeholder="What's working, what's missing, next steps…"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MaturityAssessmentPanel
