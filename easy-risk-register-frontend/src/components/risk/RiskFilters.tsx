import type { ChangeEvent } from 'react'

import type { RiskFilters } from '../../types/risk'
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
  ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

  return (
    <div className="rr-panel p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search risks..."
          value={filters.search}
          onChange={handleInput('search')}
          className="rr-input flex-1 min-w-[200px]"
        />

        <select
          value={filters.category}
          onChange={handleInput('category')}
          className="rr-select min-w-[160px]"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={handleInput('status')}
          className="rr-select min-w-[140px]"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.severity}
          onChange={handleInput('severity')}
          className="rr-select min-w-[140px]"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onReset}
          className="ml-auto"
        >
          Reset
        </Button>
      </div>

      {activeFilterChips.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
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
      ) : null}
    </div>
  )
}
