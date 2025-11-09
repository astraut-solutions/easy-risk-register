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

  return (
    <div className="rr-panel flex flex-wrap gap-3 p-4">
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

      <Button type="button" size="sm" variant="ghost" onClick={onReset}>
        Reset
      </Button>
    </div>
  )
}
