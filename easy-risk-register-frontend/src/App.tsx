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
import { DEFAULT_FILTERS, getRiskSeverity } from './utils/riskCalculations'
import { Button, Modal, SectionHeader } from './design-system'
import { cn } from './utils/cn'
import { useToast } from './components/feedback/ToastProvider'

type MatrixSelection = {
  probability: number
  impact: number
  severity: RiskSeverity
}

type DashboardView = 'overview' | 'table'

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    actions.seedDemoData()
  }, [actions])

  useEffect(() => {
    if (activeView === 'table' && matrixSelection) {
      setMatrixSelection(null)
    }
  }, [activeView, matrixSelection])

  const handleSubmit = (values: RiskFormValues) => {
    if (editingRisk) {
      actions.updateRisk(editingRisk.id, values)
    } else {
      actions.addRisk(values)
    }
    setEditingRisk(null)
    setIsFormModalOpen(false)
  }

  const handleDelete = (id: string) => {
    actions.deleteRisk(id)
    if (editingRisk?.id === id) {
      setEditingRisk(null)
      setIsFormModalOpen(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingRisk(null)
    setIsFormModalOpen(true)
  }

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk)
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
    setEditingRisk(null)
    setIsFormModalOpen(false)
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
    const csvContent = actions.exportToCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `risk-register-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
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
            defaultValues={editingRisk ?? undefined}
            onSubmit={handleSubmit}
            onAddCategory={actions.addCategory}
            onCancel={handleCloseModal}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}

export default App
