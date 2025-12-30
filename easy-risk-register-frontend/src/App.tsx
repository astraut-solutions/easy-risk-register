import { type ChangeEvent, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'

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
import { exportRisksToCSV, type CSVExportVariant, type ReminderFrequency } from './stores/riskStore'
import { DEFAULT_FILTERS, computeRiskStats, getRiskSeverity } from './utils/riskCalculations'
import { Button, Input, Modal, SectionHeader, Select } from './design-system'
import { cn } from './utils/cn'
import { useToast } from './components/feedback/ToastProvider'
import { apiFetch, apiGetBlob, type ApiError } from './services/apiClient'
import { playbookService } from './services/playbookService'
import { MetricsModal } from './components/feedback/MetricsModal'
import { isAnalyticsEnabled, setAnalyticsEnabled, trackEvent } from './utils/analytics'
import { buildRiskDefaultsFromCyberTemplate, CYBER_RISK_TEMPLATES } from './constants/cyber'
import { CyberTemplatePickerModal } from './components/risk/CyberTemplatePickerModal'
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
import { EndToEndEncryptionSettingsPanel } from './components/privacy/EndToEndEncryptionSettingsPanel'
import { IntegrationSettingsPanel } from './components/integrations/IntegrationSettingsPanel'
import { EncryptionUnlockGate } from './components/privacy/EncryptionUnlockGate'
import { AuthControls } from './components/auth/AuthControls'
import { useAuthStore } from './stores/authStore'

const RiskDashboardCharts = lazy(() => import('./components/risk/RiskDashboardCharts'))
const MaturityAssessmentPanel = lazy(() =>
  import('./components/maturity/MaturityAssessmentPanel').then((mod) => ({
    default: mod.MaturityAssessmentPanel,
  })),
)

type MatrixSelection = {
  probability: number
  impact: number
  severity: RiskSeverity
}

type DashboardView = 'overview' | 'dashboard' | 'maturity' | 'table' | 'new' | 'settings'

type DashboardWorkspaceView = Exclude<DashboardView, 'new'>

const RISK_FORM_DRAFT_KEY = 'easy-risk-register:risk-form-draft'

type CsvPreview = {
  headers: string[]
  rows: Array<Record<string, string>>
  rowCount: number
  parseErrors: string[]
}

type CsvImportRowError = { row: number; field: string; error: string }
type CsvImportApiResponse = { imported: number; skipped: number; errors?: CsvImportRowError[] }

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
    dataLastSyncedAt,
    readOnlyMode,
    readOnlyReason,
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
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [pendingView, setPendingView] = useState<DashboardWorkspaceView | null>(null)
  const [returnView, setReturnView] = useState<DashboardWorkspaceView>('overview')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportVariant, setExportVariant] = useState<CSVExportVariant>('standard')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importCsvText, setImportCsvText] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null)
  const [importApiResult, setImportApiResult] = useState<CsvImportApiResponse | null>(null)
  const [importApiError, setImportApiError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false)
  const [pdfRegisterScope, setPdfRegisterScope] = useState<'filtered' | 'all'>('filtered')
  const [selectedPrivacyRiskId, setSelectedPrivacyRiskId] = useState('')
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false)
  const [reminderSummary, setReminderSummary] = useState<{
    overdue: number
    dueSoon: number
  } | null>(null)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dashboardPdfExporterRef = useRef<null | (() => void)>(null)
  const maturityPdfExporterRef = useRef<null | (() => void)>(null)
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

  const lastViewRef = useRef<DashboardView | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const from = lastViewRef.current
    if (from === null) {
      lastViewRef.current = activeView
      trackEvent('view_change', { from: null, to: activeView })
      return
    }

    if (from === activeView) return
    lastViewRef.current = activeView
    trackEvent('view_change', { from, to: activeView })
  }, [activeView])

  useEffect(() => {
    void syncFromApi().catch((error: unknown) => {
      toast.notify({
        title: 'Failed to load workspace data',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'danger',
      })
    })
  }, [authStatus, syncFromApi, toast, workspaceId])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (!settings.visualizations.maturityEnabled) return
    if (activeView !== 'maturity') return

    void actions.loadMaturityAssessments?.().catch(() => {
      // best-effort: the panel will show empty state if unavailable
    })
  }, [activeView, actions, authStatus, settings.visualizations.maturityEnabled])

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
    const snoozedUntilMs = settings.reminders.snoozedUntil
      ? Date.parse(settings.reminders.snoozedUntil)
      : NaN
    if (Number.isFinite(snoozedUntilMs) && snoozedUntilMs > nowMs) {
      setReminderSummary(null)
      return
    }

    const lastTriggeredMs = settings.reminders.lastTriggeredAt
      ? Date.parse(settings.reminders.lastTriggeredAt)
      : NaN
    const frequencyMs = getFrequencyMs(settings.reminders.frequency)

    if (Number.isFinite(lastTriggeredMs) && nowMs - lastTriggeredMs < frequencyMs) {
      return
    }

    const sendNotification = (overdue: number, dueSoon: number) => {
      if (!settings.reminders.preferNotifications) return false
      if (typeof window === 'undefined' || !('Notification' in window)) return false
      if (window.Notification?.permission !== 'granted') return false

      try {
        const message =
          overdue > 0
            ? `${overdue} risk${overdue === 1 ? '' : 's'} overdue.`
            : `${dueSoon} risk${dueSoon === 1 ? '' : 's'} due within 7 days.`

        new window.Notification('Easy Risk Register reminder', { body: message })
        return true
      } catch {
        return false
      }
    }

    const hydrateFromApi = async () => {
      try {
        const res = await apiFetch('/api/reminders', { method: 'GET' })
        if (!res.ok) {
          const fallback = computeReminderSummary(allRisks, nowMs)
          if (fallback.overdue === 0 && fallback.dueSoon === 0) return { overdue: 0, dueSoon: 0 }
          return { overdue: fallback.overdue, dueSoon: fallback.dueSoon }
        }

        const data = (await res.json().catch(() => null)) as any
        const remindersEnabled = Boolean(data?.remindersEnabled)
        if (!remindersEnabled) return { overdue: 0, dueSoon: 0 }

        const counts = data?.counts
        const overdue = Number(counts?.due ?? 0)
        const dueSoon = Number(counts?.dueSoon ?? 0)
        return { overdue: Number.isFinite(overdue) ? overdue : 0, dueSoon: Number.isFinite(dueSoon) ? dueSoon : 0 }
      } catch {
        const fallback = computeReminderSummary(allRisks, nowMs)
        return { overdue: fallback.overdue, dueSoon: fallback.dueSoon }
      }
    }

    void hydrateFromApi().then(({ overdue, dueSoon }) => {
      if (overdue === 0 && dueSoon === 0) return

      const sentNotification = sendNotification(overdue, dueSoon)
      actions.updateReminderSettings({ lastTriggeredAt: new Date(nowMs).toISOString() })

      if (!sentNotification) {
        setReminderSummary({ overdue, dueSoon })
      }
    })

  }, [
    actions,
    allRisks,
    settings.reminders.enabled,
    settings.reminders.frequency,
    settings.reminders.lastTriggeredAt,
    settings.reminders.preferNotifications,
    settings.reminders.snoozedUntil,
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
    if (risk.e2eeLocked) {
      toast.notify({
        title: 'Encrypted risk locked',
        description: 'Unlock end-to-end encryption in Settings to view or edit encrypted fields.',
        variant: 'warning',
      })
      setActiveView('settings')
      return
    }

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
    const isCreate = !editingRisk
    const fromTemplate = Boolean(values.templateId)

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
        trackEvent('risk_updated', { view: activeView })
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
        trackEvent('risk_created', { view: activeView, fromTemplate, wasDraft: formModalOpenedFromDraftRef.current })
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
      mode: isCreate ? 'create' : 'edit',
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

    if (authStatus === 'authenticated' && !isOnline) {
      toast.notify({
        title: 'Not saved',
        description: 'You are offline. Reconnect to delete risks from the workspace.',
        variant: 'danger',
      })
      return
    }

    setIsDeletingRisk(true)
    try {
      await actions.deleteRisk(deleteConfirm.id)
      toast.notify({
        title: 'Risk deleted',
        description: 'The risk has been removed from the workspace.',
        variant: 'success',
      })
      trackEvent('risk_deleted', { view: activeView })

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

  const downloadBlob = (opts: { blob: Blob; filename: string }) => {
    const url = URL.createObjectURL(opts.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = opts.filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 250)
  }

  const describeApiError = (error: unknown): string => {
    if (!error || typeof error !== 'object') return 'Unexpected error'
    const err = error as Partial<ApiError>
    const message = typeof err.message === 'string' && err.message.trim() ? err.message.trim() : 'Unexpected error'
    return err.requestId ? `${message} (requestId: ${err.requestId})` : message
  }

  const buildRisksPdfPath = () => {
    const params = new URLSearchParams()

    if (pdfRegisterScope === 'filtered') {
      if (filters.search.trim()) params.set('q', filters.search.trim().slice(0, 200))
      if (filters.category !== 'all') params.set('category', filters.category)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.threatType !== 'all') params.set('threatType', filters.threatType)
      if (filters.checklistStatus !== 'all') params.set('checklistStatus', filters.checklistStatus)

      if (filters.severity !== 'all') {
        if (filters.severity === 'low') params.set('maxScore', '8')
        if (filters.severity === 'medium') {
          params.set('minScore', '9')
          params.set('maxScore', '15')
        }
        if (filters.severity === 'high') params.set('minScore', '16')
      }

      if (matrixSelection) {
        params.set('probability', String(matrixSelection.probability))
        params.set('impact', String(matrixSelection.impact))
      }
    }

    const query = params.toString()
    return query ? `/api/exports/risks.pdf?${query}` : '/api/exports/risks.pdf'
  }

  const handleDownloadRegisterPdf = async () => {
    if (isPdfDownloading) return
    setIsPdfDownloading(true)
    try {
      const path = buildRisksPdfPath()
      const { blob, filename } = await apiGetBlob(path)
      downloadBlob({
        blob,
        filename: filename || `risk-register-${new Date().toISOString().split('T')[0]}.pdf`,
      })
      trackEvent('export_pdf_download', {
        kind: 'risk_register',
        outcome: 'success',
        scope: pdfRegisterScope,
        filterMeta: {
          hasSearch: Boolean(filters.search.trim()),
          category: filters.category !== 'all',
          status: filters.status !== 'all',
          threatType: filters.threatType !== 'all',
          checklistStatus: filters.checklistStatus !== 'all',
          severity: filters.severity !== 'all',
          matrix: Boolean(matrixSelection),
        },
      })
      setIsPdfExportModalOpen(false)
    } catch (error) {
      trackEvent('export_pdf_download', { kind: 'risk_register', outcome: 'error' })
      toast.notify({
        title: 'Unable to export PDF',
        description: describeApiError(error),
        variant: 'warning',
      })
    } finally {
      setIsPdfDownloading(false)
    }
  }

  const handleOpenRegisterPrintView = () => {
    const generatedAtIso = new Date().toISOString()
    const matrixFilterLabel = matrixSelection
      ? `Likelihood ${matrixSelection.probability} x Impact ${matrixSelection.impact}`
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
      trackEvent('export_print_view_open', { kind: 'risk_register', outcome: 'blocked_popup' })
      toast.notify({
        title: 'Unable to open report',
        description: 'Your browser blocked the popup. Allow popups and try again.',
        variant: 'warning',
      })
      return
    }
    trackEvent('export_print_view_open', { kind: 'risk_register', outcome: 'success', scope: pdfRegisterScope })
    setIsPdfExportModalOpen(false)
  }

  const handleDownloadPrivacyPdf = async () => {
    const risk = allRisks.find((item) => item.id === selectedPrivacyRiskId)
    if (!risk) {
      toast.notify({
        title: 'Select a risk',
        description: 'Choose a risk that has a privacy incident checklist attached.',
        variant: 'info',
      })
      return
    }

    if (isPdfDownloading) return
    setIsPdfDownloading(true)
    try {
      const { blob, filename } = await apiGetBlob(
        `/api/exports/privacy-incident.pdf?riskId=${encodeURIComponent(risk.id)}`,
      )
      downloadBlob({
        blob,
        filename: filename || `privacy-incident-${risk.id}-${new Date().toISOString().split('T')[0]}.pdf`,
      })
      trackEvent('export_pdf_download', { kind: 'privacy_incident', outcome: 'success' })
      setIsPdfExportModalOpen(false)
    } catch (error) {
      trackEvent('export_pdf_download', { kind: 'privacy_incident', outcome: 'error' })
      toast.notify({
        title: 'Unable to export PDF',
        description: describeApiError(error),
        variant: 'warning',
      })
    } finally {
      setIsPdfDownloading(false)
    }
  }

  const handleOpenPrivacyPrintView = async () => {
    const risk = allRisks.find((item) => item.id === selectedPrivacyRiskId)
    if (!risk) return

    try {
      const playbooks = await playbookService.listRiskPlaybooks(risk.id).catch(() => [])
      const html = buildPrivacyIncidentChecklistReportHtml({
        risk,
        generatedAtIso: new Date().toISOString(),
        playbooks,
      })

      const opened = openReportWindow(html, 'Privacy incident checklist report')
      if (!opened) {
        trackEvent('export_print_view_open', { kind: 'privacy_incident', outcome: 'blocked_popup' })
        toast.notify({
          title: 'Unable to open report',
          description: 'Your browser blocked the popup. Allow popups and try again.',
          variant: 'warning',
        })
        return
      }
      trackEvent('export_print_view_open', { kind: 'privacy_incident', outcome: 'success' })
      setIsPdfExportModalOpen(false)
    } catch (error) {
      toast.notify({
        title: 'Unable to open report',
        description: describeApiError(error),
        variant: 'warning',
      })
    }
  }

  const handleExportDashboardPdf = () => {
    const exporter = dashboardPdfExporterRef.current
    if (exporter) {
      exporter()
      setIsPdfExportModalOpen(false)
      return
    }

    toast.notify({
      title: 'Dashboard charts export',
      description: 'Open Dashboard charts and click “Export dashboard PDF” to include chart images.',
      variant: 'info',
    })
    requestNavigate('dashboard')
    setIsPdfExportModalOpen(false)
  }

  const handleExportMaturityPdf = () => {
    const exporter = maturityPdfExporterRef.current
    if (exporter) {
      exporter()
      setIsPdfExportModalOpen(false)
      return
    }

    toast.notify({
      title: 'Maturity export',
      description: 'Open Maturity radar and click "Export PDF" to include the current chart image.',
      variant: 'info',
    })
    requestNavigate('maturity')
    setIsPdfExportModalOpen(false)
  }

  const handleDownloadExport = () => {
    const csvContent = exportRisksToCSV(visibleRisks, exportVariant)
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
    trackEvent('export_csv', {
      variant: exportVariant,
      count: visibleRisks.length,
      hasMatrixSelection: Boolean(matrixSelection),
    })
  }

  const resetImportState = () => {
    setImportFileName(null)
    setImportCsvText(null)
    setImportPreview(null)
    setImportApiResult(null)
    setImportApiError(null)
    setIsImporting(false)
  }

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    resetImportState()
    setImportFileName(file.name)

    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const content = loadEvent.target?.result
      if (typeof content === 'string') {
        setImportCsvText(content)

        const parsed = Papa.parse<Record<string, string>>(content, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => (typeof value === 'string' ? value.trim() : String(value ?? '')),
        })

        const parseErrors = (parsed.errors ?? []).slice(0, 10).map((err) => err.message || 'CSV parse error')
        const headers = (parsed.meta?.fields ?? []).filter(
          (field): field is string => typeof field === 'string' && field.trim().length > 0,
        )
        const rowsRaw = Array.isArray(parsed.data) ? parsed.data : []
        const rows = rowsRaw.slice(0, 5).map((row) => row ?? {})

        setImportPreview({
          headers,
          rows,
          rowCount: rowsRaw.length,
          parseErrors,
        })

        trackEvent('import_csv_parsed', {
          rowCount: rowsRaw.length,
          headerCount: headers.length,
          parseErrorCount: parseErrors.length,
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (!importCsvText || isImporting) return
    if (authStatus !== 'authenticated') {
      toast.notify({
        title: 'Sign in required',
        description: 'Sign in to import risks into your workspace.',
        variant: 'info',
      })
      return
    }

    if (!isOnline) {
      const message = 'You are offline. Reconnect to import risks into the workspace.'
      setImportApiError(message)
      toast.notify({ title: 'Import blocked', description: message, variant: 'danger' })
      return
    }

    setIsImporting(true)
    setImportApiResult(null)
    setImportApiError(null)
    trackEvent('import_csv_submit', { rowCount: importPreview?.rowCount ?? null })

    try {
      const res = await apiFetch('/api/imports/risks.csv', {
        method: 'POST',
        headers: { 'content-type': 'text/csv; charset=utf-8' },
        body: importCsvText,
      })

      const raw = await res.text().catch(() => '')
      const parsedJson = (() => {
        if (!raw) return null
        try {
          return JSON.parse(raw) as any
        } catch {
          return null
        }
      })()

      if (!res.ok) {
        const message =
          typeof parsedJson?.error === 'string'
            ? parsedJson.error
            : raw || res.statusText || 'Import failed'
        setImportApiError(message)
        if (Array.isArray(parsedJson?.details)) {
          setImportApiResult({
            imported: 0,
            skipped: (importPreview?.rowCount ?? 0) || 0,
            errors: parsedJson.details as CsvImportRowError[],
          })
        }

        toast.notify({
          title: 'CSV import failed',
          description: message,
          variant: 'danger',
        })
        trackEvent('import_csv_result', { outcome: 'error', status: res.status })
        return
      }

      const result = (parsedJson ?? {}) as CsvImportApiResponse
      setImportApiResult(result)

      await syncFromApi()

      toast.notify({
        title: 'CSV import complete',
        description: `Imported ${result.imported ?? 0} risk${result.imported === 1 ? '' : 's'}.`,
        variant: 'success',
      })
      trackEvent('import_csv_result', {
        outcome: 'success',
        imported: result.imported ?? null,
        skipped: result.skipped ?? null,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Import failed. Please try again.'
      setImportApiError(message)
      toast.notify({ title: 'CSV import failed', description: message, variant: 'danger' })
      trackEvent('import_csv_result', { outcome: 'error' })
    } finally {
      setIsImporting(false)
    }
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

  const visibleStats = useMemo(() => computeRiskStats(visibleRisks), [visibleRisks])

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

    setCreateDefaults(buildRiskDefaultsFromCyberTemplate(selectedTemplate, new Date().toISOString()))

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
  }, [matrixSelection, risks.length, stats.total])

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
                  onClick={() => {
                    resetImportState()
                    setIsImportModalOpen(true)
                    trackEvent('import_csv_open', { source: 'topbar' })
                    window.setTimeout(() => fileInputRef.current?.click(), 0)
                  }}
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
                      trackEvent('analytics_enabled', { source: 'topbar_metrics_button' })
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

          {authStatus === 'authenticated' && (!isOnline || readOnlyMode) ? (
            <div className="rr-panel flex flex-wrap items-center justify-between gap-3 border border-status-warning/30 bg-status-warning/5 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-high">Read-only mode</p>
                <p className="text-sm text-text-low">
                  {!isOnline ? 'You are offline. Changes will not be saved.' : readOnlyReason || 'Backend unavailable.'}
                </p>
                {dataLastSyncedAt ? (
                  <p className="text-xs text-text-low">
                    Last updated: {new Date(dataLastSyncedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              {isOnline ? (
                <Button size="sm" variant="secondary" onClick={() => syncFromApi()}>
                  Retry sync
                </Button>
              ) : null}
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
              onSnooze={(days) => {
                const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
                setReminderSummary(null)
                actions.updateReminderSettings({ snoozedUntil: until })
                toast.notify({
                  title: 'Reminders snoozed',
                  description: `Snoozed for ${days === 1 ? '1 day' : `${days} days`}.`,
                  variant: 'info',
                })
              }}
              onDisable={() => {
                setReminderSummary(null)
                actions.updateReminderSettings({ enabled: false, snoozedUntil: null })
                toast.notify({
                  title: 'Reminders disabled',
                  description: 'You can re-enable reminders in Settings.',
                  variant: 'info',
                })
              }}
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
                        <Button type="button" variant="ghost" onClick={() => setIsTemplatePickerOpen(true)}>
                          Browse & preview
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
                  riskId={editingRisk?.id}
                  onSubmit={handleSubmit}
                  onAddCategory={actions.addCategory}
                  onLoadChecklists={actions.loadRiskChecklists}
                  onAttachChecklistTemplate={actions.attachChecklistTemplate}
                  onToggleChecklistItem={actions.toggleChecklistItem}
                  onCancel={() => requestNavigate(returnView)}
                  onSaveDraft={!editingRisk ? handleSaveDraft : undefined}
                  onDirtyChange={setIsRiskFormDirty}
                  showTooltips={settings.tooltipsEnabled}
                  writeBlockedReason={authStatus === 'authenticated' && !isOnline ? 'Offline: changes will not be saved.' : null}
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
                  <p className="mt-2 text-sm text-text-low">Settings sync to your workspace (with local fallback).</p>
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
                      onChange={(event) =>
                        actions.updateReminderSettings({
                          enabled: event.target.checked,
                          ...(event.target.checked ? {} : { snoozedUntil: null }),
                        })
                      }
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

                  {settings.reminders.enabled ? (
                    <div className="grid gap-2 rounded-2xl border border-border-faint bg-surface-secondary/10 p-3 text-sm text-text-low">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Snooze until:{' '}
                          <span className="font-semibold text-text-high">
                            {settings.reminders.snoozedUntil && Number.isFinite(Date.parse(settings.reminders.snoozedUntil))
                              ? new Date(settings.reminders.snoozedUntil).toLocaleString()
                              : 'Not snoozed'}
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              actions.updateReminderSettings({
                                snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                              })
                            }
                          >
                            Snooze 1 day
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              actions.updateReminderSettings({
                                snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                              })
                            }
                          >
                            Snooze 1 week
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => actions.updateReminderSettings({ snoozedUntil: null })}
                            disabled={!settings.reminders.snoozedUntil}
                          >
                            Clear snooze
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-text-low">
                        Snooze temporarily hides reminder banners and suppresses reminder notifications.
                      </p>
                    </div>
                  ) : null}

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
                      Optional. Saved to your workspace for tracking over time. Self-assessment only-it does not represent certification, compliance, or legal advice.
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

                <EndToEndEncryptionSettingsPanel />
              </div>
            </div>
          ) : (
            <>
              <RiskSummaryCards stats={visibleStats} />

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
                    onSelect={(selection) => {
                      handleMatrixSelect({
                        probability: selection.probability,
                        impact: selection.impact,
                        severity: selection.severity,
                      })
                      requestNavigate('table')
                    }}
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
                                Score {risk.riskScore} ({risk.probability}×{risk.impact}) ·{' '}
                                {(risk.severity ?? getRiskSeverity(risk.riskScore)).toUpperCase()}
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
                  <Suspense
                    fallback={
                      <div className="rr-panel p-4">
                        <p className="text-sm text-text-low">Loading dashboard charts.</p>
                      </div>
                    }
                  >
                    <RiskDashboardCharts
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
                      registerPdfExporter={(exporter) => {
                        dashboardPdfExporterRef.current = exporter
                      }}
                      onDrillDown={({ filters: drillFilters }) => {
                        actions.setFilters({ ...filters, ...drillFilters })
                        requestNavigate('table')
                      }}
                    />
                  </Suspense>
                </div>
              ) : activeView === 'maturity' ? (
                <div className="flex flex-col gap-6">
                  <Suspense
                    fallback={
                      <div className="rr-panel p-4">
                        <p className="text-sm text-text-low">Loading maturity assessment.</p>
                      </div>
                    }
                  >
                    <MaturityAssessmentPanel
                      settings={settings.visualizations}
                      assessments={maturityAssessments}
                      onCreate={actions.createMaturityAssessment}
                      onUpdateDomain={actions.updateMaturityDomain}
                      onDelete={actions.deleteMaturityAssessment}
                      registerPdfExporter={(exporter) => {
                        maturityPdfExporterRef.current = exporter
                      }}
                    />
                  </Suspense>
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
        isOpen={isImportModalOpen}
        onClose={() => {
          if (isImporting) return
          setIsImportModalOpen(false)
          resetImportState()
        }}
        title="Import CSV"
        eyebrow="Import/Export"
        description="Uploads a CSV into your workspace. Review the preview first; the server validates rows and blocks spreadsheet injection patterns."
        size="md"
      >
        <div className="space-y-5">
          {authStatus !== 'authenticated' ? (
            <div className="rounded-2xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm text-text-low">
              Sign in to import risks into your workspace.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-faint bg-surface-secondary/40 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-high">Selected file</p>
              <p className="text-sm text-text-low">{importFileName ?? 'No file selected yet.'}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {importFileName ? 'Choose another' : 'Choose CSV'}
            </Button>
          </div>

          {importPreview ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-high">Preview</p>
                <p className="text-xs text-text-low">
                  {importPreview.rowCount} row{importPreview.rowCount === 1 ? '' : 's'} detected
                </p>
              </div>

              {importPreview.parseErrors.length ? (
                <div className="rounded-2xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-text-low">
                  <p className="font-semibold text-text-high">CSV parse warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {importPreview.parseErrors.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="overflow-auto rounded-2xl border border-border-faint">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-surface-secondary/60 text-text-low">
                    <tr>
                      {(importPreview.headers.length ? importPreview.headers : Object.keys(importPreview.rows?.[0] ?? {}))
                        .slice(0, 10)
                        .map((header) => (
                          <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold">
                            {header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-faint">
                    {importPreview.rows.map((row, idx) => {
                      const keys = (importPreview.headers.length ? importPreview.headers : Object.keys(row)).slice(0, 10)
                      return (
                        <tr key={idx} className="text-text-high">
                          {keys.map((key) => (
                            <td key={key} className="max-w-[220px] truncate px-3 py-2 text-text-low" title={row?.[key] ?? ''}>
                              {row?.[key] ?? ''}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {importApiError ? (
            <div className="rounded-2xl border border-status-danger/30 bg-status-danger/5 p-3 text-sm text-text-low">
              <p className="font-semibold text-text-high">Import error</p>
              <p className="mt-1">{importApiError}</p>
            </div>
          ) : null}

          {importApiResult?.errors?.length ? (
            <div className="space-y-2 rounded-2xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-text-low">
              <p className="font-semibold text-text-high">Row errors (showing first {Math.min(importApiResult.errors.length, 50)})</p>
              <ul className="list-disc space-y-1 pl-5">
                {importApiResult.errors.slice(0, 50).map((err, idx) => (
                  <li key={`${err.row}-${err.field}-${idx}`}>
                    Row {err.row}: {err.field} — {err.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                if (isImporting) return
                setIsImportModalOpen(false)
                resetImportState()
              }}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmImport}
              disabled={!importCsvText || authStatus !== 'authenticated'}
              aria-busy={isImporting}
            >
              {isImporting ? 'Importing.' : 'Import to workspace'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        title="Export PDF"
        eyebrow="Reporting"
        description="Downloads PDFs for your current workspace. Dashboard charts exports include chart images via a print-friendly report."
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={handleOpenRegisterPrintView} disabled={isPdfDownloading}>
                Open print view
              </Button>
              <Button variant="secondary" onClick={handleDownloadRegisterPdf} disabled={isPdfDownloading}>
                Download register PDF
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-faint pt-5">
            <p className="text-sm font-semibold text-text-high">Dashboard charts</p>
            <p className="text-xs text-text-low">Exports the current charts selection with embedded chart images.</p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleExportDashboardPdf}>
                Export dashboard PDF
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-faint pt-5">
            <p className="text-sm font-semibold text-text-high">Maturity self-assessment</p>
            <p className="text-xs text-text-low">Exports the selected maturity assessment with an embedded radar chart image.</p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleExportMaturityPdf}>
                Export maturity PDF
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={handleOpenPrivacyPrintView}
                disabled={!selectedPrivacyRiskId || isPdfDownloading}
              >
                Open print view
              </Button>
              <Button
                variant="secondary"
                onClick={handleDownloadPrivacyPdf}
                disabled={!selectedPrivacyRiskId || isPdfDownloading}
              >
                Download checklist PDF
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
        accept=".csv,text/csv"
        onChange={handleImport}
        className="hidden"
      />

      <MetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
      />

      <CyberTemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        templates={CYBER_RISK_TEMPLATES}
        selectedTemplateId={createTemplateId}
        onSelectTemplateId={setCreateTemplateId}
        onApplySelected={() => {
          applySelectedTemplate()
          setIsTemplatePickerOpen(false)
        }}
      />

      <EncryptionUnlockGate />
    </div>
  )
}

export default App
