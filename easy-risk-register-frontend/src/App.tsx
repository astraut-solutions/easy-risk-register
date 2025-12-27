import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import {
  DashboardSidebar,
  type SidebarNavItem,
} from './components/layout/DashboardSidebar'
import { RiskSummaryCards } from './components/risk/RiskSummaryCards'
import { RiskForm, type RiskFormValues } from './components/risk/RiskForm'
import { RiskDetailModal } from './components/risk/RiskDetailModal'
import { RiskMatrix } from './components/risk/RiskMatrix'
import ComprehensiveDashboard from './components/dashboard/ComprehensiveDashboard'
import { RiskFiltersBar } from './components/risk/RiskFilters'
import { RiskTable } from './components/risk/RiskTable'
import { MaturityAssessmentPanel } from './components/maturity/MaturityAssessmentPanel'
import { useRiskManagement } from './services/riskService'
import type { Risk, RiskSeverity } from './types/risk'
import type { CSVExportVariant, ReminderFrequency } from './stores/riskStore'
import { DEFAULT_FILTERS } from './utils/riskCalculations'
import { Button, Input, Modal, SectionHeader, Select } from './design-system'
import { cn } from './utils/cn'
import { useToast } from './components/feedback/ToastProvider'
import { MetricsModal } from './components/feedback/MetricsModal'
import { isAnalyticsEnabled, setAnalyticsEnabled, trackEvent } from './utils/analytics'
import { CYBER_RISK_TEMPLATES } from './constants/cyber'
import { OnboardingCard } from './components/education/OnboardingCard'
import { ReminderBanner } from './components/education/ReminderBanner'
import {
  buildPrivacyIncidentChecklistReportHtml,
  buildRiskRegisterReportHtml,
  openReportWindow,
} from './utils/reports'
import { computeReminderSummary, getFrequencyMs } from './utils/reminders'
import { getEncryptionStatus } from './utils/encryptionManager'
import { EncryptionSettingsPanel } from './components/privacy/EncryptionSettingsPanel'
import { IntegrationSettingsPanel } from './components/integrations/IntegrationSettingsPanel'
import { EncryptionUnlockGate } from './components/privacy/EncryptionUnlockGate'
import { AuthControls } from './components/auth/AuthControls'
import { useAuthStore } from './stores/authStore'

type MatrixSelection = {
  probability: number
  impact: number
  severity: RiskSeverity
}

type DashboardView = 'overview' | 'dashboard' | 'maturity' | 'table' | 'new' | 'settings'

type DashboardWorkspaceView = Exclude<DashboardView, 'new'>

const RISK_FORM_DRAFT_KEY = 'easy-risk-register:risk-form-draft'

const NAV_ITEMS: SidebarNavItem[] = [
  {
    id: 'overview',
    label: 'Executive overview',
    description: 'KPIs, filters, and the interactive matrix',
  },
  {
    id: 'dashboard',
    label: 'Dashboard charts',
    description: 'Distribution and trend charts with drill-down',
  },
  {
    id: 'maturity',
    label: 'Maturity radar',
    description: 'Self-assessment scoring and exports',
  },
  {
    id: 'table',
    label: 'Risk table',
    description: 'Spreadsheet view for faster scanning and edits',
  },
]

function App() {
  const {
    risks,
    allRisks,
    stats,
    filters,
    categories,
    settings,
    riskScoreSnapshots,
    maturityAssessments,
    dataSyncStatus,
    dataSyncError,
    actions,
  } = useRiskManagement()
  const toast = useToast()
  const authStatus = useAuthStore((s) => s.status)
  const workspaceId = useAuthStore((s) => s.workspaceId)
  const syncFromApi = actions.syncFromApi
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [viewingRisk, setViewingRisk] = useState<Risk | null>(null)
  const [matrixSelection, setMatrixSelection] = useState<MatrixSelection | null>(null)
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [isDeletingRisk, setIsDeletingRisk] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const [isRiskFormDirty, setIsRiskFormDirty] = useState(false)
  const [riskDraft, setRiskDraft] = useState<Partial<RiskFormValues> | null>(null)
  const [createDefaults, setCreateDefaults] = useState<Partial<RiskFormValues> | null>(null)
  const [createTemplateId, setCreateTemplateId] = useState('')
  const [pendingView, setPendingView] = useState<DashboardWorkspaceView | null>(null)
  const [returnView, setReturnView] = useState<DashboardWorkspaceView>('overview')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportVariant, setExportVariant] = useState<CSVExportVariant>('standard')
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false)
  const [pdfRegisterScope, setPdfRegisterScope] = useState<'filtered' | 'all'>('filtered')
  const [selectedPrivacyRiskId, setSelectedPrivacyRiskId] = useState('')
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false)
  const [reminderSummary, setReminderSummary] = useState<{
    overdue: number
    dueSoon: number
  } | null>(null)
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

  useEffect(() => {
    void syncFromApi().catch((error: unknown) => {
      toast.notify({
        title: 'Failed to load workspace data',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'danger',
      })
    })
  }, [authStatus, syncFromApi, toast, workspaceId])

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
    const encryption = getEncryptionStatus()
    if (encryption.available && encryption.enabled && !encryption.unlocked) return
    actions.seedDemoData()
  }, [actions])

  useEffect(() => {
    const encryption = getEncryptionStatus()
    if (encryption.available && encryption.enabled && !encryption.unlocked) return
    if (!settings.reminders.enabled) {
      setReminderSummary(null)
      return
    }

    const nowMs = Date.now()
    const lastTriggeredMs = settings.reminders.lastTriggeredAt
      ? Date.parse(settings.reminders.lastTriggeredAt)
      : NaN
    const frequencyMs = getFrequencyMs(settings.reminders.frequency)

    if (Number.isFinite(lastTriggeredMs) && nowMs - lastTriggeredMs < frequencyMs) {
      return
    }

    const summary = computeReminderSummary(allRisks, nowMs)
    if (summary.overdue === 0 && summary.dueSoon === 0) return

    let sentNotification = false
    if (
      settings.reminders.preferNotifications &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification?.permission === 'granted'
    ) {
      try {
        const message =
          summary.overdue > 0
            ? `${summary.overdue} risk${summary.overdue === 1 ? '' : 's'} overdue.`
            : `${summary.dueSoon} risk${summary.dueSoon === 1 ? '' : 's'} due within 7 days.`
        new window.Notification('Easy Risk Register reminder', {
          body: message,
        })
        sentNotification = true
      } catch {
        sentNotification = false
      }
    }

    actions.updateReminderSettings({ lastTriggeredAt: new Date(nowMs).toISOString() })

    if (!sentNotification) {
      setReminderSummary({ overdue: summary.overdue, dueSoon: summary.dueSoon })
    }
  }, [
    actions,
    allRisks,
    settings.reminders.enabled,
    settings.reminders.frequency,
    settings.reminders.lastTriggeredAt,
    settings.reminders.preferNotifications,
  ])

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
      setPendingView(nextView as DashboardWorkspaceView)
      setIsDiscardConfirmOpen(true)
      return
    }

    if (activeView === 'new') {
      leaveNewRiskView(nextView as DashboardWorkspaceView)
      return
    }

    setActiveView(nextView)
  }

  const leaveNewRiskView = (nextView: DashboardWorkspaceView) => {
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
    setReturnView(activeView === 'new' ? 'overview' : (activeView as DashboardWorkspaceView))
    setIsRiskFormDirty(false)
    setCreateDefaults(null)
    setCreateTemplateId('')

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
    setCreateDefaults(null)
    setCreateTemplateId('')
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

  const handleSubmit = async (values: RiskFormValues) => {
    formModalDidSubmitRef.current = true
    const durationMs =
      formModalOpenedAtRef.current === null ? null : Date.now() - formModalOpenedAtRef.current

    try {
      if (editingRisk) {
        const updated = await actions.updateRisk(editingRisk.id, values)
        if (!updated) {
          throw new Error('Risk not found (it may have been deleted).')
        }
        toast.notify({
          title: 'Risk updated',
          description: 'Your changes are saved.',
          variant: 'success',
        })
      } else {
        await actions.addRisk(values)
        clearRiskDraft()
        setRiskDraft(null)
        setCreateDefaults(null)
        setCreateTemplateId('')
        toast.notify({
          title: 'Risk added',
          description: 'Your new risk is now visible in the workspace.',
          variant: 'success',
        })
      }
    } catch (error) {
      toast.notify({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'danger',
      })
      return
    }

    trackEvent('risk_modal_submit', {
      mode: editingRisk ? 'edit' : 'create',
      durationMs,
      wasDraft: formModalOpenedFromDraftRef.current,
      view: activeView,
    })

    setEditingRisk(null)
    setIsRiskFormDirty(false)
    setCreateDefaults(null)
    formModalOpenedAtRef.current = null
    formModalModeRef.current = null
    formModalOpenedFromDraftRef.current = false

    setActiveView(returnView)
  }

  const handleDelete = (id: string) => {
    const risk = allRisks.find((entry) => entry.id === id)
    setDeleteConfirm({ id, title: risk?.title ?? 'this risk' })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm || isDeletingRisk) return

    setIsDeletingRisk(true)
    try {
      await actions.deleteRisk(deleteConfirm.id)
      toast.notify({
        title: 'Risk deleted',
        description: 'The risk has been removed from the workspace.',
        variant: 'success',
      })

      if (editingRisk?.id === deleteConfirm.id) {
        setEditingRisk(null)
        setIsRiskFormDirty(false)
      }
      setDeleteConfirm(null)
    } catch (error) {
      toast.notify({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'danger',
      })
    } finally {
      setIsDeletingRisk(false)
    }
  }

  const handleEditRisk = (risk: Risk) => {
    startEditRisk(risk)
  }

  const handleViewRisk = (risk: Risk) => {
    // Prefer direct editing rather than opening a read-only modal.
    handleCloseDetailModal()
    startEditRisk(risk)
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

  const handleMatrixSelect = (selection: MatrixSelection) => {
    setMatrixSelection((current) => {
      const isSameCell =
        current &&
        current.probability === selection.probability &&
        current.impact === selection.impact

      if (isSameCell) return null
      return selection
    })
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  const handleExportPdf = () => {
    setIsPdfExportModalOpen(true)
  }

  const handleDownloadRegisterPdf = () => {
    const generatedAtIso = new Date().toISOString()
    const matrixFilterLabel = matrixSelection
      ? `Likelihood ${matrixSelection.probability} × Impact ${matrixSelection.impact}`
      : undefined
    const reportRisks = pdfRegisterScope === 'all' ? allRisks : visibleRisks
    const html = buildRiskRegisterReportHtml({
      risks: reportRisks,
      filters,
      generatedAtIso,
      matrixFilterLabel,
    })

    const opened = openReportWindow(html, 'Risk register report')
    if (!opened) {
      toast.notify({
        title: 'Unable to open PDF export',
        description: 'Your browser blocked the popup. Allow popups and try again.',
        variant: 'warning',
      })
      return
    }

    toast.notify({
      title: 'Report opened',
      description: 'If the print dialog does not open, press Ctrl+P / Cmd+P to “Save as PDF”.',
      variant: 'info',
    })
    setIsPdfExportModalOpen(false)
  }

  const handleDownloadPrivacyPdf = () => {
    const risk = allRisks.find((item) => item.id === selectedPrivacyRiskId)
    if (!risk) {
      toast.notify({
        title: 'Select a risk',
        description: 'Choose a risk that has a privacy incident checklist attached.',
        variant: 'info',
      })
      return
    }

    const html = buildPrivacyIncidentChecklistReportHtml({
      risk,
      generatedAtIso: new Date().toISOString(),
    })

    const opened = openReportWindow(html, 'Privacy incident checklist report')
    if (!opened) {
      toast.notify({
        title: 'Unable to open PDF export',
        description: 'Your browser blocked the popup. Allow popups and try again.',
        variant: 'warning',
      })
      return
    }

    toast.notify({
      title: 'Report opened',
      description: 'If the print dialog does not open, press Ctrl+P / Cmd+P to “Save as PDF”.',
      variant: 'info',
    })
    setIsPdfExportModalOpen(false)
  }

  const handleDownloadExport = () => {
    const csvContent = actions.exportToCSV(exportVariant)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const suffix = exportVariant === 'audit_pack' ? '-audit-pack' : ''
    link.download = `risk-register${suffix}-${new Date().toISOString().split('T')[0]}.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 250)
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

  const templateSelectOptions = useMemo(
    () => [
      { value: '', label: 'Start from scratch' },
      ...CYBER_RISK_TEMPLATES.map((template) => ({ value: template.id, label: template.label })),
    ],
    [],
  )

  const selectedTemplate = useMemo(
    () => CYBER_RISK_TEMPLATES.find((template) => template.id === createTemplateId) ?? null,
    [createTemplateId],
  )

  const applySelectedTemplate = () => {
    if (!selectedTemplate) return

    if (isRiskFormDirty && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Applying a template will replace the current form content. Continue?',
      )
      if (!confirmed) return
    }

    setCreateDefaults({
      ...selectedTemplate.risk,
      threatType: selectedTemplate.threatType,
      templateId: selectedTemplate.id,
      status: 'open',
    })

    clearRiskDraft()
    setRiskDraft(null)

    toast.notify({
      title: 'Template applied',
      description: `Prefilled the form with: ${selectedTemplate.label}.`,
      variant: 'success',
    })

    trackEvent('risk_template_apply', {
      templateId: selectedTemplate.id,
    })
  }

  const tableEmptyState = useMemo(() => {
    if (matrixSelection && risks.length > 0) {
      return {
        title: 'No risks in this matrix cell',
        description: 'Clear the matrix selection or adjust filters to reveal more risks.',
      }
    }

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

  const privacyIncidentRisks = useMemo(
    () =>
      allRisks.filter((risk) =>
        risk.checklists.some((checklist) => checklist.templateId === 'checklist_privacy_incident_ndb_v1'),
      ),
    [allRisks],
  )

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
          onSettings={() => requestNavigate('settings')}
        />

        <div id="main-content" className="flex flex-1 flex-col gap-8">
          <SectionHeader
            eyebrow="Easy Risk Register"
            title="Risk management workspace"
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
                  variant="secondary"
                  onClick={handleExportPdf}
                  aria-label="Export PDF report"
                >
                  Export PDF
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
                <AuthControls />
              </div>
            }
          />

          {authStatus !== 'authenticated' ? (
            <div className="rr-panel p-4 text-sm text-text-low">
              Sign in to load and save risks in your workspace.
            </div>
          ) : dataSyncStatus === 'loading' ? (
            <div className="rr-panel p-4">
              <p className="text-sm text-text-low">Loading workspace risks…</p>
            </div>
          ) : dataSyncStatus === 'error' ? (
            <div className="rr-panel flex flex-wrap items-center justify-between gap-3 border border-status-danger/30 bg-status-danger/5 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-high">Failed to load workspace data</p>
                <p className="text-sm text-text-low">{dataSyncError || 'Please try again.'}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => syncFromApi()}>
                Retry
              </Button>
            </div>
          ) : null}

          {!settings.onboardingDismissed ? (
            <OnboardingCard
              onStart={() => startCreateRisk()}
              onDismiss={() => actions.updateSettings({ onboardingDismissed: true })}
            />
          ) : null}

          {reminderSummary ? (
            <ReminderBanner
              overdue={reminderSummary.overdue}
              dueSoon={reminderSummary.dueSoon}
              onView={() => {
                setReminderSummary(null)
                setActiveView('table')
              }}
              onDismiss={() => setReminderSummary(null)}
            />
          ) : null}

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
                {!editingRisk ? (
                  <div className="mb-5 rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex-1">
                        <Select
                          label="Start from a cyber template (optional)"
                          helperText="Choose a common cyber risk to prefill likelihood, impact, and mitigations."
                          options={templateSelectOptions}
                          value={createTemplateId}
                          onChange={(value) => setCreateTemplateId(value)}
                          placeholder="Start from scratch"
                        />
                        {selectedTemplate ? (
                          <p className="mt-2 text-xs text-text-low">
                            {selectedTemplate.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!selectedTemplate}
                          onClick={applySelectedTemplate}
                        >
                          Use template
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!createDefaults && !createTemplateId}
                          onClick={() => {
                            setCreateDefaults(null)
                            setCreateTemplateId('')
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <RiskForm
                  mode={editingRisk ? 'edit' : 'create'}
                  categories={categories}
                  defaultValues={editingRisk ?? createDefaults ?? riskDraft ?? undefined}
                  onSubmit={handleSubmit}
                  onAddCategory={actions.addCategory}
                  onCancel={() => requestNavigate(returnView)}
                  onSaveDraft={!editingRisk ? handleSaveDraft : undefined}
                  onDirtyChange={setIsRiskFormDirty}
                  showTooltips={settings.tooltipsEnabled}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>
          ) : activeView === 'settings' ? (
            <div className="rr-panel p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-text-low">Preferences</p>
                  <h2 className="text-2xl font-bold text-text-high">Settings</h2>
                  <p className="mt-2 text-sm text-text-low">Settings are stored locally in your browser.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestNavigate(returnView)}
                  className="text-text-low hover:text-text-high"
                >
                  ← Back
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-text-high">Education</p>
                  <label className="flex items-start gap-3 text-sm text-text-low">
                    <input
                      type="checkbox"
                      checked={settings.tooltipsEnabled}
                      onChange={(event) => actions.updateSettings({ tooltipsEnabled: event.target.checked })}
                      className="mt-1"
                    />
                    <span>Show field tooltips</span>
                  </label>

                  <label className="flex items-start gap-3 text-sm text-text-low">
                    <input
                      type="checkbox"
                      checked={!settings.onboardingDismissed}
                      onChange={(event) =>
                        actions.updateSettings({ onboardingDismissed: !event.target.checked })
                      }
                      className="mt-1"
                    />
                    <span>Show onboarding tips</span>
                  </label>
                </div>

                <div className="space-y-3 border-t border-border-faint pt-5">
                  <p className="text-sm font-semibold text-text-high">Reminders</p>
                  <label className="flex items-start gap-3 text-sm text-text-low">
                    <input
                      type="checkbox"
                      checked={settings.reminders.enabled}
                      onChange={(event) => actions.updateReminderSettings({ enabled: event.target.checked })}
                      className="mt-1"
                    />
                    <span>Enable reminders for due/review dates</span>
                  </label>

                  <Select
                    label="Frequency"
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    value={settings.reminders.frequency}
                    onChange={(value) =>
                      actions.updateReminderSettings({ frequency: value as ReminderFrequency })
                    }
                    disabled={!settings.reminders.enabled}
                  />

                  <label className="flex items-start gap-3 text-sm text-text-low">
                    <input
                      type="checkbox"
                      checked={settings.reminders.preferNotifications}
                      onChange={(event) =>
                        actions.updateReminderSettings({ preferNotifications: event.target.checked })
                      }
                      disabled={!settings.reminders.enabled}
                      className="mt-1"
                    />
                    <span>Use desktop notifications when allowed (falls back to in-app banners)</span>
                  </label>

                  {'Notification' in window ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-faint bg-surface-secondary/10 p-3 text-sm text-text-low">
                      <span>
                        Notification permission: <span className="font-semibold text-text-high">{window.Notification.permission}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await window.Notification.requestPermission()
                            toast.notify({
                              title: 'Notification permission updated',
                              description: `Current permission: ${window.Notification.permission}`,
                              variant: 'info',
                            })
                          } catch {
                            toast.notify({
                              title: 'Unable to request permission',
                              description: 'Your browser blocked the permission request.',
                              variant: 'warning',
                            })
                          }
                        }}
                      >
                        Request permission
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-text-low">
                      Desktop notifications are not supported by this browser. Reminders will show as in-app banners.
                    </p>
                  )}
                </div>

                <div className="space-y-4 border-t border-border-faint pt-5">
                  <p className="text-sm font-semibold text-text-high">Visualizations</p>

                  <label className="flex items-start gap-3 text-sm text-text-low">
                    <input
                      type="checkbox"
                      checked={settings.visualizations.scoreHistoryEnabled}
                      onChange={(event) =>
                        actions.updateSettings({
                          visualizations: {
                            ...settings.visualizations,
                            scoreHistoryEnabled: event.target.checked,
                          },
                        })
                      }
                      className="mt-1"
                    />
                    <span>
                      Enable score history (needed for trend charts). If disabled, trend charts are unavailable; existing history stays on this device.
                    </span>
                  </label>

                  <Select
                    label="Default trend view"
                    options={[
                      { value: 'overall_exposure', label: 'Overall exposure (sum/average)' },
                      { value: 'recent_changes', label: 'Recently changed risks' },
                    ]}
                    value={settings.visualizations.defaultTrendMode}
                    onChange={(value) =>
                      actions.updateSettings({
                        visualizations: {
                          ...settings.visualizations,
                          defaultTrendMode: value as any,
                        },
                      })
                    }
                    disabled={!settings.visualizations.scoreHistoryEnabled}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="History retention"
                      options={[
                        { value: 'days', label: 'Keep last N days' },
                        { value: 'count', label: 'Keep last N snapshots per risk' },
                      ]}
                      value={settings.visualizations.scoreHistoryRetention.mode}
                      onChange={(value) =>
                        actions.updateSettings({
                          visualizations: {
                            ...settings.visualizations,
                            scoreHistoryRetention: {
                              ...settings.visualizations.scoreHistoryRetention,
                              mode: value as any,
                            },
                          },
                        })
                      }
                      disabled={!settings.visualizations.scoreHistoryEnabled}
                    />

                    <Input
                      type="number"
                      label={settings.visualizations.scoreHistoryRetention.mode === 'days' ? 'Days' : 'Snapshots'}
                      min={1}
                      max={10000}
                      value={settings.visualizations.scoreHistoryRetention.value}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value)
                        if (!Number.isFinite(nextValue)) return
                        actions.updateSettings({
                          visualizations: {
                            ...settings.visualizations,
                            scoreHistoryRetention: {
                              ...settings.visualizations.scoreHistoryRetention,
                              value: Math.max(1, Math.min(Math.floor(nextValue), 10_000)),
                            },
                          },
                        })
                      }}
                      disabled={!settings.visualizations.scoreHistoryEnabled}
                      helperText={
                        settings.visualizations.scoreHistoryRetention.mode === 'days'
                          ? 'Older snapshots are removed automatically.'
                          : 'Each risk retains up to N snapshots; older snapshots are removed automatically.'
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
                    <p className="text-sm font-semibold text-text-high">Maturity self-assessment</p>
                    <p className="mt-1 text-xs text-text-low">
                      Optional and offline-only. This is a self-assessment to support planning and reporting—it's not a certification.
                    </p>

                    <label className="mt-3 flex items-start gap-3 text-sm text-text-low">
                      <input
                        type="checkbox"
                        checked={settings.visualizations.maturityEnabled}
                        onChange={(event) =>
                          actions.updateSettings({
                            visualizations: {
                              ...settings.visualizations,
                              maturityEnabled: event.target.checked,
                            },
                          })
                        }
                        className="mt-1"
                      />
                      <span>Enable maturity radar</span>
                    </label>

                    <div className="mt-3">
                      <Select
                        label="Default framework preset"
                        options={[
                          { value: 'acsc_essential_eight', label: 'ACSC Essential Eight (inspired)' },
                          { value: 'nist_csf', label: 'NIST CSF (inspired)' },
                        ]}
                        value={settings.visualizations.maturityFrameworkPreset}
                        onChange={(value) =>
                          actions.updateSettings({
                            visualizations: {
                              ...settings.visualizations,
                              maturityFrameworkPreset: value as any,
                            },
                          })
                        }
                        disabled={!settings.visualizations.maturityEnabled}
                      />
                    </div>
                  </div>
                </div>

                <IntegrationSettingsPanel />

                <EncryptionSettingsPanel />
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

              {matrixSelection && (
                <div className="rr-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-text-high">
                  <div>
                    <span className="font-semibold text-text-high">Matrix filter active:</span>{' '}
                    Likelihood {matrixSelection.probability} x Impact {matrixSelection.impact}{' '}
                    <span className="text-text-low">({matrixSelection.severity})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={clearMatrixSelection}
                    >
                      Clear matrix filter
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={handleResetFilters}>
                      Reset all filters
                    </Button>
                  </div>
                </div>
              )}

              {activeView === 'overview' ? (
                <div className="flex flex-col gap-6">
                  <RiskMatrix
                    risks={visibleRisks}
                    onSelect={(selection) =>
                      handleMatrixSelect({
                        probability: selection.probability,
                        impact: selection.impact,
                        severity: selection.severity,
                      })
                    }
                  />

                  {matrixSelection ? (
                    <div className="rr-panel p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-text-high">
                            Risks in selected cell: {visibleRisks.length}
                          </p>
                          <p className="mt-1 text-xs text-text-low">
                            Showing a quick preview. Open the risk table to review and edit.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => requestNavigate('table')}
                        >
                          Open filtered risk table
                        </Button>
                      </div>

                      <ul className="mt-4 grid gap-2" aria-label="Risks in selected matrix cell (preview)">
                        {visibleRisks
                          .slice()
                          .sort((a, b) => b.riskScore - a.riskScore)
                          .slice(0, 8)
                          .map((risk) => (
                            <li
                              key={risk.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-faint bg-surface-secondary/20 px-3 py-2 text-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleEditRisk(risk)}
                                className="font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary rounded-md"
                                aria-label={`View or edit risk: ${risk.title}`}
                              >
                                {risk.title}
                              </button>
                              <span className="text-xs text-text-low">
                                Score {risk.riskScore} ({risk.probability}×{risk.impact})
                              </span>
                            </li>
                          ))}
                      </ul>

                      {visibleRisks.length > 8 ? (
                        <p className="mt-3 text-xs text-text-low">
                          Showing 8 of {visibleRisks.length}. Open the table to see all.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

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
              ) : activeView === 'dashboard' ? (
                <div className="flex flex-col gap-6">
                  <ComprehensiveDashboard
                    risks={visibleRisks}
                    snapshots={riskScoreSnapshots}
                    filters={filters}
                    matrixFilterLabel={
                      matrixSelection
                        ? `Likelihood ${matrixSelection.probability} x Impact ${matrixSelection.impact}`
                        : undefined
                    }
                    historyEnabled={settings.visualizations.scoreHistoryEnabled}
                    defaultTrendMode={settings.visualizations.defaultTrendMode}
                    onDrillDown={({ filters: drillFilters }) => {
                      actions.setFilters({ ...drillFilters })
                      requestNavigate('table')
                    }}
                  />
                </div>
              ) : activeView === 'maturity' ? (
                <div className="flex flex-col gap-6">
                  <MaturityAssessmentPanel
                    settings={settings.visualizations}
                    assessments={maturityAssessments}
                    onCreate={actions.createMaturityAssessment}
                    onUpdateDomain={actions.updateMaturityDomain}
                    onDelete={actions.deleteMaturityAssessment}
                  />
                </div>
              ) : (
                <RiskTable
                  risks={matrixSelection ? visibleRisks : risks}
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
        onAttachChecklistTemplate={actions.attachChecklistTemplate}
        onToggleChecklistItem={actions.toggleChecklistItem}
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
        isOpen={Boolean(deleteConfirm)}
        onClose={() => {
          if (isDeletingRisk) return
          setDeleteConfirm(null)
        }}
        title="Delete risk?"
        eyebrow="Confirm delete"
        description="This action cannot be undone."
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeletingRisk}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              aria-busy={isDeletingRisk}
            >
              {isDeletingRisk ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-text-low">
          <p>
            You are about to delete <span className="font-semibold text-text-high">{deleteConfirm?.title}</span>.
          </p>
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

      <Modal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        title="Export PDF"
        eyebrow="Reporting"
        description="Exports open a print-friendly report. In the print dialog, choose “Save as PDF”."
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-high">Risk register</p>
            <div role="radiogroup" aria-label="Risk register PDF scope" className="space-y-2">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="pdfRegisterScope"
                  value="filtered"
                  checked={pdfRegisterScope === 'filtered'}
                  onChange={() => setPdfRegisterScope('filtered')}
                  className="mt-1"
                />
                <span className="text-sm text-text-low">
                  Current view (applies filters{matrixSelection ? ' and matrix selection' : ''})
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="pdfRegisterScope"
                  value="all"
                  checked={pdfRegisterScope === 'all'}
                  onChange={() => setPdfRegisterScope('all')}
                  className="mt-1"
                />
                <span className="text-sm text-text-low">All risks (ignores filters)</span>
              </label>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleDownloadRegisterPdf}>
                Export register PDF
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-faint pt-5">
            <p className="text-sm font-semibold text-text-high">Privacy incident / checklist</p>
            <Select
              label="Select risk"
              options={[
                { value: '', label: 'Choose a risk' },
                ...privacyIncidentRisks.map((risk) => ({ value: risk.id, label: risk.title })),
              ]}
              value={selectedPrivacyRiskId}
              onChange={setSelectedPrivacyRiskId}
              placeholder="Choose a risk"
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={handleDownloadPrivacyPdf}
                disabled={!selectedPrivacyRiskId}
              >
                Export checklist PDF
              </Button>
            </div>
            {!privacyIncidentRisks.length ? (
              <p className="text-xs text-text-low">
                No risks currently have the privacy incident checklist attached.
              </p>
            ) : null}
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

      <EncryptionUnlockGate />
    </div>
  )
}

export default App
