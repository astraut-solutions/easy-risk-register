import { type ChangeEvent, useEffect, useRef, useState } from 'react'

import { RiskSummaryCards } from './components/risk/RiskSummaryCards'
import { RiskForm, type RiskFormValues } from './components/risk/RiskForm'
import { RiskList } from './components/risk/RiskList'
import { RiskMatrix } from './components/risk/RiskMatrix'
import { RiskFiltersBar } from './components/risk/RiskFilters'
import { useRiskManagement } from './services/riskService'
import type { Risk } from './types/risk'
import { DEFAULT_FILTERS, getRiskSeverity } from './utils/riskCalculations'
import { Button, SectionHeader } from './design-system'

function App() {
  const { risks, stats, filters, categories, actions } = useRiskManagement()
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    actions.seedDemoData()
  }, [actions])

  const handleSubmit = (values: RiskFormValues) => {
    if (editingRisk) {
      actions.updateRisk(editingRisk.id, values)
      setEditingRisk(null)
      return
    }
    actions.addRisk(values)
  }

  const handleDelete = (id: string) => {
    actions.deleteRisk(id)
    if (editingRisk?.id === id) {
      setEditingRisk(null)
    }
  }

  const handleMatrixSelect = (riskIds: string[]) => {
    if (!riskIds.length) return
    const selected = risks.find((risk) => risk.id === riskIds[0])
    if (!selected) return
    actions.setFilters({
      ...filters,
      severity: getRiskSeverity(selected.riskScore),
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
        actions.importFromCSV(content)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="min-h-screen bg-surface-tertiary text-text-mid">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Easy Risk Register"
          title="Risk management workspace"
          description="Capture, score, and prioritize the threats that matter most. Data stays private in your browser while mirroring the clarity of our enterprise design language."
          actions={
            <>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                Import CSV
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                Export CSV
              </Button>
            </>
          }
        />

        <RiskSummaryCards stats={stats} />

        <div className="grid gap-8 lg:grid-cols-[minmax(340px,380px)_1fr]">
          <RiskForm
            mode={editingRisk ? 'edit' : 'create'}
            categories={categories}
            defaultValues={editingRisk ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setEditingRisk(null)}
          />

          <div className="space-y-5">
            <RiskFiltersBar
              filters={filters}
              categories={categories}
              onChange={actions.setFilters}
              onReset={() => actions.setFilters({ ...DEFAULT_FILTERS })}
            />

            <RiskMatrix risks={risks} onSelect={handleMatrixSelect} />

            <RiskList
              risks={risks}
              onEdit={(risk) => setEditingRisk(risk)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

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
