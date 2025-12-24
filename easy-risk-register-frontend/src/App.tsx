import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import {
  DashboardSidebar,
  type SidebarNavItem,
} from './components/layout/DashboardSidebar'
import { RiskSummaryCards } from './components/risk/RiskSummaryCards'
import { RiskForm, type RiskFormValues } from './components/risk/RiskForm'
import { RiskDetailModal } from './components/risk/RiskDetailModal'
import { RiskMatrix } from './components/risk/RiskMatrix'
import { RiskFiltersBar } from './components/risk/RiskFilters'
import { RiskTable } from './components/risk/RiskTable'
import { useRiskManagement } from './services/riskService'
import type { Risk, RiskSeverity } from './types/risk'
import type { CSVExportVariant } from './stores/riskStore'
import { DEFAULT_FILTERS, getRiskSeverity } from './utils/riskCalculations'
import { Button, Modal, SectionHeader } from './design-system'
import { cn } from './utils/cn'
import { useToast } from './components/feedback/ToastProvider'
import { MetricsModal } from './components/feedback/MetricsModal'
import { isAnalyticsEnabled, setAnalyticsEnabled, trackEvent } from './utils/analytics'

type MatrixSelection = {
  probability: number
  impact: number
  severity: RiskSeverity
}

type DashboardView = 'overview' | 'table' | 'new'

const RISK_FORM_DRAFT_KEY = 'easy-risk-register:risk-form-draft'

const NAV_ITEMS: SidebarNavItem[] = [
  {
    id: 'overview',
    label: 'Executive overview',
    description: 'KPIs, filters, and the interactive matrix',
  },
  {
    id: 'table',
    label: 'Risk table',
    description: 'Spreadsheet view for faster scanning and edits',
  },
]

function App() {
  const { risks, stats, filters, categories, actions } = useRiskManagement()
  const toast = useToast()
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [viewingRisk, setViewingRisk] = useState<Risk | null>(null)
  const [matrixSelection, setMatrixSelection] = useState<MatrixSelection | null>(null)
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const [isRiskFormDirty, setIsRiskFormDirty] = useState(false)
  const [riskDraft, setRiskDraft] = useState<Partial<RiskFormValues> | null>(null)
  const [pendingView, setPendingView] = useState<DashboardView | null>(null)
  const [returnView, setReturnView] = useState<DashboardView>('overview')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportVariant, setExportVariant] = useState<CSVExportVariant>('standard')
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const formModalOpenedAtRef = useRef<number | null>(null)
  const formModalModeRef = useRef<'create' | 'edit' | null>(null)
  const formModalOpenedFromDraftRef = useRef(false)
  const formModalDidSubmitRef = useRef(false)

  const isMetricsUiEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      return new URLSearchParams(window.location.search).has('metrics') || isAnalyticsEnabled()
    } catch {
      return false
    }
  }, [])

  const loadRiskDraft = () => {
    try {
      const raw = localStorage.getItem(RISK_FORM_DRAFT_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') return null
      return parsed as Partial<RiskFormValues>
    } catch {
      return null
    }
  }

  const saveRiskDraft = (values: RiskFormValues) => {
    try {
      localStorage.setItem(RISK_FORM_DRAFT_KEY, JSON.stringify(values))
    } catch {
      // ignore
    }
  }

  const clearRiskDraft = () => {
    try {
      localStorage.removeItem(RISK_FORM_DRAFT_KEY)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    actions.seedDemoData()
  }, [actions])

  useEffect(() => {
    if (activeView === 'table' && matrixSelection) {
      setMatrixSelection(null)
    }
  }, [activeView, matrixSelection])

  const requestNavigate = (nextView: DashboardView) => {
    if (nextView === activeView) return

    if (nextView === 'new') {
      startCreateRisk()
      return
    }

    if (activeView === 'new' && isRiskFormDirty) {
      setPendingView(nextView)
      setIsDiscardConfirmOpen(true)
      return
    }

    if (activeView === 'new') {
      leaveNewRiskView(nextView)
      return
    }

    setActiveView(nextView)
  }

  const leaveNewRiskView = (nextView: DashboardView) => {
    if (!formModalDidSubmitRef.current) {
      const durationMs =
        formModalOpenedAtRef.current === null ? null : Date.now() - formModalOpenedAtRef.current

      trackEvent('risk_modal_abandon', {
        mode: formModalModeRef.current ?? (editingRisk ? 'edit' : 'create'),
        durationMs,
        dirty: isRiskFormDirty,
        view: activeView,
      })
    }

    setEditingRisk(null)
    setIsRiskFormDirty(false)
    formModalOpenedAtRef.current = null
    formModalModeRef.current = null
    formModalOpenedFromDraftRef.current = false
    formModalDidSubmitRef.current = false
    setPendingView(null)
    setActiveView(nextView)
  }

  const startCreateRisk = () => {
    setEditingRisk(null)
    setReturnView(activeView === 'new' ? 'overview' : activeView)
    setIsRiskFormDirty(false)

    const draft = loadRiskDraft()
    setRiskDraft(draft)

    formModalOpenedAtRef.current = Date.now()
    formModalModeRef.current = 'create'
    formModalDidSubmitRef.current = false
    formModalOpenedFromDraftRef.current = Boolean(draft)

    trackEvent('risk_modal_open', {
      mode: 'create',
      view: activeView,
      hasDraft: Boolean(draft),
    })

    if (draft) {
      toast.notify({
        title: 'Draft loaded',
        description: 'Restored your last saved draft into the form.',
        variant: 'info',
      })
    }

    setActiveView('new')
  }

  const startEditRisk = (risk: Risk) => {
    setEditingRisk(risk)
    setRiskDraft(null)
    setReturnView(activeView === 'new' ? 'overview' : activeView)
    setIsRiskFormDirty(false)

    formModalOpenedAtRef.current = Date.now()
    formModalModeRef.current = 'edit'
    formModalDidSubmitRef.current = false
    formModalOpenedFromDraftRef.current = false

    trackEvent('risk_modal_open', {
      mode: 'edit',
      view: activeView,
      riskId: risk.id,
    })

    setActiveView('new')
  }

  const handleSubmit = (values: RiskFormValues) => {
    formModalDidSubmitRef.current = true
    const durationMs =
      formModalOpenedAtRef.current === null ? null : Date.now() - formModalOpenedAtRef.current

    if (editingRisk) {
      actions.updateRisk(editingRisk.id, values)
      toast.notify({
        title: 'Risk updated',
        description: 'Your changes are saved.',
        variant: 'success',
      })
    } else {
      actions.addRisk(values)
      clearRiskDraft()
      setRiskDraft(null)
      toast.notify({
        title: 'Risk added',
        description: 'Your new risk is now visible in the workspace.',
        variant: 'success',
      })
    }

    trackEvent('risk_modal_submit', {
      mode: editingRisk ? 'edit' : 'create',
      durationMs,
      wasDraft: formModalOpenedFromDraftRef.current,
      view: activeView,
    })

    setEditingRisk(null)
    setIsRiskFormDirty(false)
    formModalOpenedAtRef.current = null
    formModalModeRef.current = null
    formModalOpenedFromDraftRef.current = false

    setActiveView(returnView)
  }

  const handleDelete = (id: string) => {
    actions.deleteRisk(id)
    if (editingRisk?.id === id) {
      setEditingRisk(null)
      setIsRiskFormDirty(false)
    }
  }

  const handleEditRisk = (risk: Risk) => {
    startEditRisk(risk)
  }

  const handleViewRisk = (risk: Risk) => {
    setViewingRisk(risk)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setViewingRisk(null)
    setIsDetailModalOpen(false)
  }

  const handleEditFromDetail = (risk: Risk) => {
    handleCloseDetailModal()
    startEditRisk(risk)
  }

  const handleSaveDraft = (values: RiskFormValues) => {
    saveRiskDraft(values)
    trackEvent('risk_modal_save_draft', { view: activeView })
    toast.notify({
      title: 'Draft saved',
      description: 'You can leave this tab and come back to the draft later.',
      variant: 'success',
    })
  }

  const handleMatrixSelect = (riskIds: string[]) => {
    if (!riskIds.length) return
    const selected = risks.find((risk) => risk.id === riskIds[0])
    if (!selected) return

    setMatrixSelection((current) => {
      const isSameCell =
        current &&
        current.probability === selected.probability &&
        current.impact === selected.impact

      if (isSameCell) {
        return null
      }

      return {
        probability: selected.probability,
        impact: selected.impact,
        severity: getRiskSeverity(selected.riskScore),
      }
    })
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  const handleDownloadExport = () => {
    const csvContent = actions.exportToCSV(exportVariant)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const suffix = exportVariant === 'audit_pack' ? '-audit-pack' : ''
    link.download = `risk-register${suffix}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setIsExportModalOpen(false)
  }

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const content = loadEvent.target?.result
      if (typeof content === 'string') {
        const result = actions.importFromCSV(content)
        if (result.imported > 0) {
          toast.notify({
            title: 'CSV import complete',
            description: `Imported ${result.imported} risk${result.imported === 1 ? '' : 's'}.`,
            variant: 'success',
          })
        } else if (result.reason === 'invalid_content') {
          toast.notify({
            title: 'CSV blocked for safety',
            description:
              'The file appears to contain spreadsheet injection patterns (cells starting with =, +, -, or @).',
            variant: 'danger',
          })
        } else if (result.reason === 'parse_error') {
          toast.notify({
            title: 'Unable to read CSV',
            description: 'The CSV could not be parsed. Confirm it is valid CSV with a header row.',
            variant: 'danger',
          })
        } else if (result.reason === 'no_valid_rows') {
          toast.notify({
            title: 'No valid risks found',
            description: 'No rows contained the required fields (title and description).',
            variant: 'warning',
          })
        } else {
          toast.notify({
            title: 'Nothing to import',
            description: 'The CSV file appears to be empty.',
            variant: 'info',
          })
        }
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleResetFilters = () => {
    actions.setFilters({ ...DEFAULT_FILTERS })
    setMatrixSelection(null)
  }

  const clearMatrixSelection = () => setMatrixSelection(null)

  const visibleRisks = useMemo(() => {
    if (!matrixSelection) return risks
    return risks.filter(
      (risk) =>
        risk.probability === matrixSelection.probability &&
        risk.impact === matrixSelection.impact,
    )
  }, [matrixSelection, risks])

  const tableEmptyState = useMemo(() => {
    if (stats.total === 0) {
      return {
        title: 'No risks captured yet',
        description: 'Use the New risk button to add your first item.',
      }
    }

    return {
      title: 'No risks match the current filters',
      description: 'Adjust or reset the filters to reveal more risks.',
    }
  }, [filters, stats.total])

  return (
    <div className="min-h-screen bg-surface-tertiary text-text-mid">
      <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:px-10">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-blue-600"
        >
          Skip to main content
        </a>

        <DashboardSidebar
          items={NAV_ITEMS}
          activeItem={activeView}
          onSelect={(view) => requestNavigate(view as DashboardView)}
        />

        <div id="main-content" className="flex flex-1 flex-col gap-8">
          <SectionHeader
            eyebrow="Easy Risk Register"
            title="Risk management workspace"
             description="Switch between an executive dashboard, a spreadsheet-style table, and a focused New risk tab without leaving the page. Export reports or narrow the data with filters."
             actions={
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    if (activeView === 'new') {
                      requestNavigate(returnView)
                      return
                    }
                    startCreateRisk()
                  }}
                  aria-label={
                    activeView === 'new' ? 'Return to workspace overview' : 'Create new risk'
                  }
                >
                  {activeView === 'new' ? 'Back to overview' : 'New risk'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExport}
                  aria-label="Export CSV file"
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Import CSV file"
                >
                  Import CSV
                </Button>
                {isMetricsUiEnabled ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAnalyticsEnabled(true)
                      setIsMetricsModalOpen(true)
                    }}
                    aria-label="Open metrics and feedback"
                  >
                    Metrics
                  </Button>
                ) : null}
              </div>
              }
            />

          <div className="flex flex-wrap gap-3 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeView
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestNavigate(item.id as DashboardView)}
                  className={cn(
                    'flex-1 min-w-[160px] rounded-2xl border px-4 py-3 text-left text-sm transition',
                    isActive
                      ? 'border-brand-primary bg-brand-primary-light/60 text-brand-primary'
                      : 'border-border-subtle bg-surface-secondary text-text-high',
                  )}
                >
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-text-low">{item.description}</p>
                </button>
              )
            })}
          </div>

          {activeView === 'new' ? (
            <div className="rr-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">
                    {editingRisk ? 'Edit risk' : 'New risk'}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-text-high">
                    {editingRisk ? 'Update risk' : 'Create risk'}
                  </h2>
                  <p className="mt-1 text-sm text-text-low">
                    {editingRisk
                      ? 'Update likelihood, impact, and mitigation details without leaving the workspace.'
                      : 'Capture likelihood, impact, and mitigation details. Drafts are saved locally.'}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => requestNavigate(returnView)}>
                  Back
                </Button>
              </div>

              <div className="mt-6">
                <RiskForm
                  mode={editingRisk ? 'edit' : 'create'}
                  categories={categories}
                  defaultValues={editingRisk ?? riskDraft ?? undefined}
                  onSubmit={handleSubmit}
                  onAddCategory={actions.addCategory}
                  onCancel={() => requestNavigate(returnView)}
                  onSaveDraft={!editingRisk ? handleSaveDraft : undefined}
                  onDirtyChange={setIsRiskFormDirty}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>
          ) : (
            <>
              <RiskSummaryCards stats={stats} />

              <RiskFiltersBar
                filters={filters}
                categories={categories}
                onChange={actions.setFilters}
                onReset={handleResetFilters}
              />

              {activeView === 'overview' ? (
                <div className="flex flex-col gap-6">
                  <RiskMatrix risks={visibleRisks} onSelect={handleMatrixSelect} />

                  {matrixSelection && (
                    <div className="rr-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-text-high">
                      <div>
                        <span className="font-semibold text-text-high">Matrix filter active:</span>{' '}
                        Likelihood {matrixSelection.probability} x Impact {matrixSelection.impact}{' '}
                        <span className="text-text-low">({matrixSelection.severity})</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearMatrixSelection}
                      >
                        Clear matrix filter
                      </Button>
                    </div>
                  )}

                  <div className="rr-panel flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-text-high">
                        Showing {visibleRisks.length} of {stats.total} risk{stats.total === 1 ? '' : 's'}
                      </p>
                      <p className="text-xs text-text-low">
                        Executive overview focuses on KPIs and the matrix. Use the risk table to review individual items.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {visibleRisks.length === 0 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                          Reset filters
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => requestNavigate('table')}
                      >
                        Open risk table
                      </Button>
                    </div>
                  </div>

                </div>
              ) : (
                <RiskTable
                  risks={risks}
                  onEdit={handleEditRisk}
                  onDelete={handleDelete}
                  onView={handleViewRisk}
                  emptyState={tableEmptyState}
                />
              )}
            </>
          )}
        </div>
      </div>

      <RiskDetailModal
        risk={viewingRisk}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={handleEditFromDetail}
      />

      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title="Discard changes?"
        eyebrow="Unsaved edits"
        description="You have unsaved changes in this risk form. Discard them and leave this tab?"
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDiscardConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDiscardConfirmOpen(false)
                leaveNewRiskView(pendingView ?? returnView ?? 'overview')
              }}
            >
              Discard and leave
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-text-low">
          {editingRisk ? (
            <p>
              Tip: Use <span className="font-semibold text-text-high">Update risk</span> if you
              want to keep your edits before leaving.
            </p>
          ) : (
            <p>
              Tip: Use <span className="font-semibold text-text-high">Save draft</span> if you want
              to keep your progress without adding a risk yet.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export CSV"
        eyebrow="Import/Export"
        description="Choose a standard export for re-import, or an audit pack variant that adds explicit evidence URL columns."
        size="sm"
      >
        <div className="space-y-5">
          <div className="space-y-3" role="radiogroup" aria-label="Export format">
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition',
                exportVariant === 'standard'
                  ? 'border-brand-primary bg-brand-primary-light/40'
                  : 'border-border-faint bg-surface-secondary/40 hover:border-border-subtle',
              )}
            >
              <input
                type="radio"
                name="exportVariant"
                value="standard"
                checked={exportVariant === 'standard'}
                onChange={() => setExportVariant('standard')}
                className="mt-1"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-text-high">Standard CSV</span>
                <span className="block text-sm text-text-low">
                  Includes all risk fields. Evidence and mitigation steps are included as JSON columns for reliable round-trips.
                </span>
              </span>
            </label>

            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition',
                exportVariant === 'audit_pack'
                  ? 'border-brand-primary bg-brand-primary-light/40'
                  : 'border-border-faint bg-surface-secondary/40 hover:border-border-subtle',
              )}
            >
              <input
                type="radio"
                name="exportVariant"
                value="audit_pack"
                checked={exportVariant === 'audit_pack'}
                onChange={() => setExportVariant('audit_pack')}
                className="mt-1"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-text-high">Audit pack CSV</span>
                <span className="block text-sm text-text-low">
                  Adds evidence URL columns and review/acceptance metadata for audit evidence preparation. May include sensitive links.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleDownloadExport}>
              Download CSV
            </Button>
          </div>
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />

      <MetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
      />
    </div>
  )
}

export default App
