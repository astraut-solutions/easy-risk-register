import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import {
  DashboardSidebar,
  type SidebarNavItem,
} from './components/layout/DashboardSidebar'
import { RiskSummaryCards } from './components/risk/RiskSummaryCards'
import { RiskForm, type RiskFormValues } from './components/risk/RiskForm'
import { RiskDetailModal } from './components/risk/RiskDetailModal'
import { RiskList } from './components/risk/RiskList'
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

type DashboardView = 'overview' | 'table'

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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const [isRiskFormDirty, setIsRiskFormDirty] = useState(false)
  const [riskDraft, setRiskDraft] = useState<Partial<RiskFormValues> | null>(null)
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

  const handleSubmit = (values: RiskFormValues) => {
    formModalDidSubmitRef.current = true
    const durationMs =
      formModalOpenedAtRef.current === null ? null : Date.now() - formModalOpenedAtRef.current

    if (editingRisk) {
      actions.updateRisk(editingRisk.id, values)
    } else {
      actions.addRisk(values)
      clearRiskDraft()
      setRiskDraft(null)
    }

    trackEvent('risk_modal_submit', {
      mode: editingRisk ? 'edit' : 'create',
      durationMs,
      wasDraft: formModalOpenedFromDraftRef.current,
      view: activeView,
    })

    setEditingRisk(null)
    setIsFormModalOpen(false)
    setIsRiskFormDirty(false)
    formModalOpenedAtRef.current = null
    formModalModeRef.current = null
    formModalOpenedFromDraftRef.current = false
  }

  const handleDelete = (id: string) => {
    actions.deleteRisk(id)
    if (editingRisk?.id === id) {
      setEditingRisk(null)
      setIsFormModalOpen(false)
      setIsRiskFormDirty(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingRisk(null)
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
    setIsFormModalOpen(true)
  }

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk)
    setIsRiskFormDirty(false)
    setRiskDraft(null)
    formModalOpenedAtRef.current = Date.now()
    formModalModeRef.current = 'edit'
    formModalDidSubmitRef.current = false
    formModalOpenedFromDraftRef.current = false

    trackEvent('risk_modal_open', {
      mode: 'edit',
      view: activeView,
      riskId: risk.id,
    })
    setIsFormModalOpen(true)
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
    handleEditRisk(risk)
  }

  const handleCloseModal = () => {
    if (isFormModalOpen && !formModalDidSubmitRef.current) {
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
    setIsFormModalOpen(false)
    setIsRiskFormDirty(false)
    formModalOpenedAtRef.current = null
    formModalModeRef.current = null
    formModalOpenedFromDraftRef.current = false
    formModalDidSubmitRef.current = false
  }

  const handleRequestCloseModal = () => {
    if (!isRiskFormDirty) {
      handleCloseModal()
      return
    }

    setIsDiscardConfirmOpen(true)
  }

  const handleSaveDraft = (values: RiskFormValues) => {
    saveRiskDraft(values)
    trackEvent('risk_modal_save_draft', { view: activeView })
    toast.notify({
      title: 'Draft saved',
      description: 'You can close this modal and come back to the draft later.',
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

  const listEmptyState = useMemo(() => {
    if (visibleRisks.length > 0) return undefined

    if (matrixSelection) {
      return {
        title: 'No risks in this matrix cell',
        description: 'Adjust the matrix selection or clear it to explore other risks.',
      }
    }

    if (stats.total > 0) {
      return {
        title: 'No risks match the current filters',
        description: 'Try broadening or resetting your filters to see additional risks.',
      }
    }

    return undefined
  }, [matrixSelection, stats.total, visibleRisks.length])

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
          onSelect={(view) => setActiveView(view as DashboardView)}
        />

        <div id="main-content" className="flex flex-1 flex-col gap-8">
          <SectionHeader
            eyebrow="Easy Risk Register"
            title="Risk management workspace"
            description="Switch between an executive dashboard and a spreadsheet-style table without leaving the page. Capture risks in a focused modal, export reports, or narrow the data with filters."
              actions={
                <div className="flex flex-wrap gap-3">
                  {isMetricsUiEnabled ? (
                    <Button
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
                  <Button
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Import CSV file"
                >
                  Import CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  aria-label="Export CSV file"
                >
                  Export CSV
                </Button>
                <Button
                  onClick={handleOpenCreateModal}
                  aria-label="Create new risk"
                >
                  New risk
                </Button>
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
                  onClick={() => setActiveView(item.id as DashboardView)}
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

          <RiskSummaryCards stats={stats} />

          <RiskFiltersBar
            filters={filters}
            categories={categories}
            onChange={actions.setFilters}
            onReset={handleResetFilters}
          />

          {activeView === 'overview' ? (
            <div className="flex flex-col gap-6">
              <RiskMatrix risks={risks} onSelect={handleMatrixSelect} />

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

              <RiskList
                risks={visibleRisks}
                onEdit={handleEditRisk}
                onDelete={handleDelete}
                onView={handleViewRisk}
                emptyState={listEmptyState}
              />

              <div className="rr-panel flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-text-high">Prefer a spreadsheet?</p>
                  <p className="text-xs text-text-low">
                    Jump into the full-width risk table for bulk reviews and sorting.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveView('table')}
                >
                  Open risk table
                </Button>
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
        description="You have unsaved changes in this risk form. Discard them and close?"
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
                handleCloseModal()
              }}
            >
              Discard and close
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-text-low">
          <p>
            Tip: Use <span className="font-semibold text-text-high">Save draft</span> if you want to
            keep your progress without adding a risk yet.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleRequestCloseModal}
        title={editingRisk ? 'Update risk' : 'Create new risk'}
        eyebrow="Risk workspace"
        description={
          editingRisk
            ? 'Refresh severity, probability, and mitigation context without leaving the dashboard.'
            : 'Capture probability-impact details with live scoring and mitigation guidance.'
        }
        size="full"
      >
        <div className="mx-auto w-full max-w-5xl">
          <RiskForm
            mode={editingRisk ? 'edit' : 'create'}
            categories={categories}
            defaultValues={editingRisk ?? riskDraft ?? undefined}
            onSubmit={handleSubmit}
            onAddCategory={actions.addCategory}
            onCancel={handleRequestCloseModal}
            onSaveDraft={!editingRisk ? handleSaveDraft : undefined}
            onDirtyChange={setIsRiskFormDirty}
            className="border-0 bg-transparent p-0 shadow-none"
          />
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
