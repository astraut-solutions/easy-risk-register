import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { StatCard } from '../../../src/design-system'

describe('StatCard', () => {
  it('renders label correctly', () => {
    render(<StatCard label="Test Label" value="Test Value" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('renders value correctly', () => {
    render(<StatCard label="Test Label" value="42" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<StatCard label="Test Label" value="42" description="Test description" />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<StatCard label="Test Label" value="42" />)
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <StatCard 
        label="Test Label" 
        value="42" 
        icon={<span data-testid="test-icon">Icon</span>} 
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('does not render icon when not provided', () => {
    render(<StatCard label="Test Label" value="42" />)
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })

  it('applies brand accent by default', () => {
    render(<StatCard label="Test Label" value="42" />)
    const valueElement = screen.getByText('42')
    expect(valueElement).toHaveClass('text-brand-primary')
  })

  it('applies different accent styles correctly', () => {
    const accentEntries: Array<['brand' | 'success' | 'warning' | 'danger', string]> = [
      ['brand', 'text-brand-primary'],
      ['success', 'text-status-success'],
      ['warning', 'text-status-warning'],
      ['danger', 'text-status-danger'],
    ]

    accentEntries.forEach(([accent, klass]) => {
      render(<StatCard label="Test Label" value="42" accent={accent} />)
      expect(screen.getByText('42')).toHaveClass(klass)
      cleanup()
    })
  })

  it('applies custom class names', () => {
    const { container } = render(<StatCard label="Test Label" value="42" className="custom-class" />)
    const card = container.firstElementChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })

  it('passes additional props to the card element', () => {
    render(<StatCard label="Test Label" value="42" data-testid="stat-card" />)
    expect(screen.getByTestId('stat-card')).toBeInTheDocument()
  })

  it('renders with correct base styles', () => {
    const { container } = render(<StatCard label="Test Label" value="42" />)
    const card = container.firstElementChild as HTMLElement
    expect(card).toHaveClass(
      'flex',
      'h-full',
      'rounded-2xl',
      'border',
      'border-border-faint',
      'bg-gradient-to-br',
      'from-surface-primary',
      'to-surface-secondary/60',
      'p-6',
      'shadow-sm'
    )
  })

  it('has correct text classes for label', () => {
    render(<StatCard label="Test Label" value="42" />)
    const labelElement = screen.getByText('Test Label')
    expect(labelElement).toHaveClass(
      'text-xs',
      'font-semibold',
      'uppercase',
      'tracking-wide',
      'text-text-low'
    )
  })

  it('has correct text classes for value', () => {
    render(<StatCard label="Test Label" value="42" />)
    const valueElement = screen.getByText('42')
    expect(valueElement).toHaveClass(
      'mt-3',
      'text-3xl',
      'font-semibold',
      'text-text-high'
    )
  })

  it('has correct text classes for description', () => {
    render(<StatCard label="Test Label" value="42" description="Test description" />)
    const descriptionElement = screen.getByText('Test description')
    expect(descriptionElement).toHaveClass(
      'mt-4',
      'line-clamp-2',
      'text-sm',
      'text-text-low'
    )
  })

  it('renders all elements together', () => {
    render(
      <StatCard 
        label="Total Risks" 
        value={123} 
        description="Risks tracked this month" 
        accent="success"
        icon={<span data-testid="test-icon">Icon</span>}
        className="w-full"
      />
    )

    expect(screen.getByText('Total Risks')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('Risks tracked this month')).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('accepts numeric values', () => {
    render(<StatCard label="Test Label" value={99} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('accepts string values', () => {
    render(<StatCard label="Test Label" value="100%" />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
