import type { ChangeEvent } from 'react'

import type { RiskFilters } from '../../types/risk'
import { CHECKLIST_STATUS_OPTIONS, THREAT_TYPE_OPTIONS } from '../../constants/cyber'
import { Button, Select } from '../../design-system'

interface RiskFiltersProps {
  filters: RiskFilters
  categories: string[]
  onChange: (updates: Partial<RiskFilters>) => void
  onReset: () => void
}

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Mitigated', value: 'mitigated' },
  { label: 'Closed', value: 'closed' },
]

const severityOptions = [
  { label: 'All severities', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

const threatTypeOptions = [
  { label: 'All threat types', value: 'all' },
  ...THREAT_TYPE_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
]

const checklistStatusOptions = [
  { label: 'All checklist statuses', value: 'all' },
  ...CHECKLIST_STATUS_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
]

export const RiskFiltersBar = ({
  filters,
  categories,
  onChange,
  onReset,
}: RiskFiltersProps) => {
  const handleInput =
    (key: keyof RiskFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value as RiskFilters[typeof key]
      onChange({ [key]: value })
    }

  const handleSelect =
    (key: keyof RiskFilters) =>
    (value: string) => {
      onChange({ [key]: value as RiskFilters[typeof key] })
    }

  const categoryOptions = [
    { label: 'All categories', value: 'all' },
    ...categories.map((category) => ({ label: category, value: category })),
  ]

  const activeFilterChips = [
    filters.search
      ? {
          key: 'search',
          label: `Search: ${filters.search}`,
          onClear: () => onChange({ search: '' }),
        }
      : null,
    filters.category !== 'all'
      ? {
          key: 'category',
          label: `Category: ${filters.category}`,
          onClear: () => onChange({ category: 'all' }),
        }
      : null,
    filters.status !== 'all'
      ? {
          key: 'status',
          label: `Status: ${statusOptions.find((option) => option.value === filters.status)?.label ?? filters.status}`,
          onClear: () => onChange({ status: 'all' }),
        }
      : null,
    filters.severity !== 'all'
      ? {
          key: 'severity',
          label: `Severity: ${severityOptions.find((option) => option.value === filters.severity)?.label ?? filters.severity}`,
          onClear: () => onChange({ severity: 'all' }),
        }
      : null,
    filters.threatType !== 'all'
      ? {
          key: 'threatType',
          label: `Threat: ${threatTypeOptions.find((option) => option.value === filters.threatType)?.label ?? filters.threatType}`,
          onClear: () => onChange({ threatType: 'all' }),
        }
      : null,
    filters.checklistStatus !== 'all'
      ? {
          key: 'checklistStatus',
          label: `Checklist: ${checklistStatusOptions.find((option) => option.value === filters.checklistStatus)?.label ?? filters.checklistStatus}`,
          onClear: () => onChange({ checklistStatus: 'all' }),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

  return (
    <div className="rr-panel p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
        <div className="md:col-span-1 xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Search</p>
          <input
            type="search"
            placeholder="Search risks..."
            value={filters.search}
            onChange={handleInput('search')}
            className="rr-input w-full"
            aria-label="Search risks"
          />
        </div>

        <div className="xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Category</p>
          <Select
            label="Category"
            labelVisibility="sr-only"
            name="category"
            options={categoryOptions}
            value={filters.category}
            onChange={handleSelect('category')}
            placeholder="All categories"
          />
        </div>

        <div className="xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Threat type</p>
          <Select
            label="Threat type"
            labelVisibility="sr-only"
            name="threatType"
            options={threatTypeOptions}
            value={filters.threatType}
            onChange={handleSelect('threatType')}
            placeholder="All threat types"
          />
        </div>

        <div className="xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Status</p>
          <Select
            label="Status"
            labelVisibility="sr-only"
            name="status"
            options={statusOptions}
            value={filters.status}
            onChange={handleSelect('status')}
            placeholder="All statuses"
          />
        </div>

        <div className="xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Severity</p>
          <Select
            label="Severity"
            labelVisibility="sr-only"
            name="severity"
            options={severityOptions}
            value={filters.severity}
            onChange={handleSelect('severity')}
            placeholder="All severities"
          />
        </div>

        <div className="xl:col-span-1">
          <p className="mb-1 text-xs font-semibold text-text-low md:sr-only">Checklist status</p>
          <Select
            label="Checklist status"
            labelVisibility="sr-only"
            name="checklistStatus"
            options={checklistStatusOptions}
            value={filters.checklistStatus}
            onChange={handleSelect('checklistStatus')}
            placeholder="All checklist statuses"
          />
        </div>
      </div>

      {activeFilterChips.length ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilterChips.map((chip) => (
              <li key={chip.key}>
                <Button
                  type="button"
                  size="sm"
                  variant="subtle"
                  onClick={chip.onClear}
                  className="h-8 max-w-[min(320px,100%)] rounded-full px-3 text-xs"
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <span className="truncate">{chip.label}</span>
                  <span aria-hidden="true" className="ml-2 text-text-muted">
                    ×
                  </span>
                </Button>
              </li>
            ))}
          </ul>

          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-end">
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}

