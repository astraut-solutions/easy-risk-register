import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskFiltersBar } from './RiskFilters'
import type { RiskFilters } from '../../types/risk'

const baseFilters: RiskFilters = {
  search: '',
  category: 'all',
  status: 'all',
  severity: 'all',
}

const categories = ['Security', 'Compliance']

describe('RiskFiltersBar', () => {
  it('renders all filter controls with the provided values', () => {
    render(
      <RiskFiltersBar
        filters={{ ...baseFilters, search: 'phishing', category: 'Security', status: 'open', severity: 'high' }}
        categories={categories}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Search risks...')).toHaveValue('phishing')
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('Security')
    expect(selects[1]).toHaveValue('open')
    expect(selects[2]).toHaveValue('high')
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

    const [, statusSelect, severitySelect] = screen.getAllByRole('combobox')

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
