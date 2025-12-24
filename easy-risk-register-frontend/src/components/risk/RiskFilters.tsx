import type { ChangeEvent } from 'react'

import type { RiskFilters } from '../../types/risk'
import { CHECKLIST_STATUS_OPTIONS, THREAT_TYPE_OPTIONS } from '../../constants/cyber'
import { Button } from '../../design-system'

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
          <input
            type="search"
            placeholder="Search risks..."
            value={filters.search}
            onChange={handleInput('search')}
            className="rr-input w-full"
          />
        </div>

        <div className="xl:col-span-1">
          <select
            value={filters.category}
            onChange={handleInput('category')}
            className="rr-select w-full"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <select
            value={filters.threatType}
            onChange={handleInput('threatType')}
            className="rr-select w-full"
          >
            {threatTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <select
            value={filters.status}
            onChange={handleInput('status')}
            className="rr-select w-full"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <select
            value={filters.severity}
            onChange={handleInput('severity')}
            className="rr-select w-full"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <select
            value={filters.checklistStatus}
            onChange={handleInput('checklistStatus')}
            className="rr-select w-full"
          >
            {checklistStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

      </div>

      {activeFilterChips.length ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilterChips.map((chip) => (
            <Button
              key={chip.key}
              type="button"
              size="sm"
              variant="subtle"
              onClick={chip.onClear}
              className="h-8 rounded-full px-3 text-xs"
              aria-label={`Remove filter: ${chip.label}`}
            >
              <span className="truncate">{chip.label}</span>
              <span aria-hidden="true" className="ml-2 text-text-muted">
                ×
              </span>
            </Button>
          ))}
          </div>

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
