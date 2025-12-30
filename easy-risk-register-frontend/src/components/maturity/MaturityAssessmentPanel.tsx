import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Radar } from 'react-chartjs-2'

import type { MaturityAssessment, MaturityFrameworkPreset } from '../../types/visualization'
import { Button, Select } from '../../design-system'
import { ensureChartJsRegistered } from '../charts/chartjs'
import { buildMaturityAssessmentReportHtml, openReportWindow } from '../../utils/reports'
import { useToast } from '../feedback/ToastProvider'
import { trackEvent } from '../../utils/analytics'

const scoreOptions = [
  { value: 0, label: '0 - Not started' },
  { value: 1, label: '1 - Initial' },
  { value: 2, label: '2 - Developing' },
  { value: 3, label: '3 - Defined' },
  { value: 4, label: '4 - Managed' },
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
  onCreate: (preset?: MaturityFrameworkPreset) => Promise<MaturityAssessment>
  onUpdateDomain: (assessmentId: string, domainKey: string, updates: { score?: number }) => Promise<void>
  onDelete: (assessmentId: string) => Promise<void>
  registerPdfExporter?: (exporter: (() => void) | null) => void
}

export const MaturityAssessmentPanel = ({
  settings,
  assessments,
  onCreate,
  onUpdateDomain,
  onDelete,
  registerPdfExporter,
}: MaturityAssessmentPanelProps) => {
  ensureChartJsRegistered()
  const toast = useToast()

  const [selectedId, setSelectedId] = useState<string>(() => assessments[0]?.id ?? '')
  const [createPreset, setCreatePreset] = useState<MaturityFrameworkPreset>(
    settings.maturityFrameworkPreset,
  )
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingDomainKey, setUpdatingDomainKey] = useState<string | null>(null)
  const [showTableFallback, setShowTableFallback] = useState(true)
  const radarRef = useRef<any>(null)

  useEffect(() => {
    setCreatePreset(settings.maturityFrameworkPreset)
  }, [settings.maturityFrameworkPreset])

  useEffect(() => {
    if (!assessments.length) {
      setSelectedId('')
      return
    }

    if (selectedId && assessments.some((assessment) => assessment.id === selectedId)) return
    setSelectedId(assessments[0].id)
  }, [assessments, selectedId])

  const selected = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedId) ?? null,
    [assessments, selectedId],
  )

  const selectionOptions = useMemo(
    () =>
      assessments.map((assessment) => ({
        value: assessment.id,
        label: `${assessment.frameworkName} - ${dateLabel(assessment.createdAt)}`,
      })),
    [assessments],
  )

  const chartData = useMemo(() => {
    if (!selected) return null
    return {
      labels: selected.domains.map((domain) => domain.name),
      datasets: [
        {
          label: 'Maturity (0-4)',
          data: selected.domains.map((domain) => domain.score),
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.95)',
          borderWidth: 2,
          pointRadius: 2,
        },
      ],
    }
  }, [selected])

  const downloadPng = useCallback(() => {
    const chart = radarRef.current
    const sourceCanvas = chart?.canvas as HTMLCanvasElement | undefined
    if (!sourceCanvas) return

    const outCanvas = document.createElement('canvas')
    outCanvas.width = 1920
    outCanvas.height = 1080

    const ctx = outCanvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)

    const srcWidth = sourceCanvas.width
    const srcHeight = sourceCanvas.height
    if (!srcWidth || !srcHeight) return

    const scale = Math.min(outCanvas.width / srcWidth, outCanvas.height / srcHeight)
    const drawWidth = srcWidth * scale
    const drawHeight = srcHeight * scale
    const dx = (outCanvas.width - drawWidth) / 2
    const dy = (outCanvas.height - drawHeight) / 2

    ctx.imageSmoothingEnabled = true
    try {
      ctx.imageSmoothingQuality = 'high'
    } catch {
      // ignore
    }
    ctx.drawImage(sourceCanvas, dx, dy, drawWidth, drawHeight)

    const dataUrl = outCanvas.toDataURL('image/png')

    try {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `easy-risk-register__maturity__${new Date().toISOString().replaceAll(':', '-')}.png`
      link.click()
    } catch {
      // ignore
    }
    trackEvent('export_png', { kind: 'maturity_radar' })
  }, [])

  const exportPdf = useCallback(() => {
    if (!selected) return
    const chart = radarRef.current
    const sourceCanvas = chart?.canvas as HTMLCanvasElement | undefined
    const pngDataUrl = sourceCanvas ? sourceCanvas.toDataURL('image/png') : null
    const html = buildMaturityAssessmentReportHtml({
      generatedAtIso: new Date().toISOString(),
      assessment: selected,
      presetLabel: presetLabel[selected.frameworkKey],
      pngDataUrl,
      disclaimer:
        'Self-assessment only. This is assistive and does not represent certification, compliance, or legal advice.',
    })
    const opened = openReportWindow(html, 'Maturity self-assessment report')
    trackEvent('export_print_view_open', {
      kind: 'maturity_radar',
      outcome: opened ? 'success' : 'blocked_popup',
    })
  }, [selected])

  useEffect(() => {
    if (!registerPdfExporter) return
    registerPdfExporter(selected ? exportPdf : null)
    return () => registerPdfExporter(null)
  }, [exportPdf, registerPdfExporter, selected])

  const handleCreate = async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const created = await onCreate(createPreset)
      setSelectedId(created.id)
    } catch (error) {
      toast.notify({
        title: 'Unable to create assessment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'warning',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!selected || isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete(selected.id)
      setSelectedId('')
    } catch (error) {
      toast.notify({
        title: 'Unable to delete assessment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'warning',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateDomain = async (domainKey: string, score: number) => {
    if (!selected) return
    if (updatingDomainKey) return

    setUpdatingDomainKey(domainKey)
    try {
      await onUpdateDomain(selected.id, domainKey, { score })
    } catch (error) {
      toast.notify({
        title: 'Unable to save score',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'warning',
      })
    } finally {
      setUpdatingDomainKey(null)
    }
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
            <Button type="button" size="sm" variant="secondary" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating…' : 'New assessment'}
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
                <p className="mt-1 text-xs text-text-low">Scores range from 0 (not started) to 4 (managed).</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTableFallback((prev) => !prev)}
                >
                  {showTableFallback ? 'Hide table' : 'Show table'}
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Delete assessment'}
                </Button>
              </div>
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
              Created: <span className="font-semibold text-text-high">{dateLabel(selected.createdAt)}</span> • Updated:{' '}
              <span className="font-semibold text-text-high">{dateLabel(selected.updatedAt)}</span>
            </p>
          </div>

          {showTableFallback ? (
            <div className="rr-panel p-5">
              <h4 className="text-sm font-semibold text-text-high">Domain scores (table)</h4>
              <p className="mt-1 text-xs text-text-low">
                Use this as a non-visual fallback for the radar chart. Scores range from 0 (not started) to 4 (managed).
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-faint text-left text-xs uppercase tracking-wide text-text-low">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Domain</th>
                      <th className="py-2 pr-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.domains.map((domain, index) => (
                      <tr key={domain.key} className="border-b border-border-faint last:border-b-0">
                        <td className="py-3 pr-3 align-top text-text-low">{index + 1}</td>
                        <td className="py-3 pr-3 align-top font-medium text-text-high">{domain.name}</td>
                        <td className="py-3 pr-3 align-top text-right">
                          <div className="inline-block min-w-[220px] text-left">
                            <Select
                              label={`Score for ${domain.name}`}
                              labelVisibility="sr-only"
                              options={scoreOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                              }))}
                              value={String(domain.score)}
                              onChange={(value) => handleUpdateDomain(domain.key, Number(value))}
                              disabled={Boolean(updatingDomainKey)}
                              helperText={updatingDomainKey === domain.key ? 'Saving…' : undefined}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default MaturityAssessmentPanel
