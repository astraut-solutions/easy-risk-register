import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskFiltersBar } from '../../../src/components/risk/RiskFilters'
import type { RiskFilters } from '../../../src/types/risk'

vi.mock('../../../src/design-system', async () => {
  const actual = await vi.importActual<typeof import('../../../src/design-system')>(
    '../../../src/design-system',
  )

  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button {...props} data-testid="mock-button">
        {children}
      </button>
    ),
    Select: ({ options = [], value, onChange, name }: any) => (
      <select
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  }
})

const baseFilters: RiskFilters = {
  search: '',
  category: 'all',
  threatType: 'all',
  status: 'all',
  severity: 'all',
  checklistStatus: 'all',
}

const categories = ['Security', 'Compliance']

describe('RiskFiltersBar', () => {
  it('renders all filter controls with the provided values', () => {
    render(
      <RiskFiltersBar
        filters={{
          ...baseFilters,
          search: 'phishing',
          category: 'Security',
          threatType: 'phishing',
          status: 'open',
          severity: 'high',
          checklistStatus: 'in_progress',
        }}
        categories={categories}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Search risks...')).toHaveValue('phishing')
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('Security') // category
    expect(selects[1]).toHaveValue('phishing') // threat type
    expect(selects[2]).toHaveValue('open') // status
    expect(selects[3]).toHaveValue('high') // severity
    expect(selects[4]).toHaveValue('in_progress') // checklist status
  })

  it('calls onChange when the search input changes', () => {
    const handleChange = vi.fn()
    render(
      <RiskFiltersBar filters={baseFilters} categories={categories} onChange={handleChange} onReset={vi.fn()} />
    )

    fireEvent.change(screen.getByPlaceholderText('Search risks...'), { target: { value: 'identity' } })
    expect(handleChange).toHaveBeenCalledWith({ search: 'identity' })
  })

  it('populates category options from props', () => {
    render(
      <RiskFiltersBar filters={baseFilters} categories={categories} onChange={vi.fn()} onReset={vi.fn()} />
    )

    expect(screen.getByRole('option', { name: 'Security' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Compliance' })).toBeInTheDocument()
  })

  it('updates select filters and calls onChange with the correct keys', () => {
    const handleChange = vi.fn()
    render(
      <RiskFiltersBar filters={baseFilters} categories={categories} onChange={handleChange} onReset={vi.fn()} />
    )

    const [, , statusSelect, severitySelect] = screen.getAllByRole('combobox')

    fireEvent.change(statusSelect, { target: { value: 'mitigated' } })
    fireEvent.change(severitySelect, { target: { value: 'medium' } })

    expect(handleChange).toHaveBeenNthCalledWith(1, { status: 'mitigated' })
    expect(handleChange).toHaveBeenNthCalledWith(2, { severity: 'medium' })
  })

  it('invokes onReset when the reset button is clicked', () => {
    const handleReset = vi.fn()
    render(
      <RiskFiltersBar filters={baseFilters} categories={categories} onChange={vi.fn()} onReset={handleReset} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(handleReset).toHaveBeenCalled()
  })
})
