import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies neutral tone by default', () => {
    render(<Badge>Neutral Badge</Badge>)
    const badge = screen.getByText('Neutral Badge')
    expect(badge).toHaveClass('border-border-subtle', 'bg-surface-secondary', 'text-text-mid')
  })

  it('applies different tones correctly', () => {
    const tones: ('neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand')[] = [
      'neutral',
      'success',
      'warning',
      'danger',
      'info',
      'brand'
    ]

    tones.forEach(tone => {
      render(<Badge tone={tone}>{tone}</Badge>)
      expect(screen.getByText(tone)).toBeInTheDocument()
      render(<Badge tone={tone}>{tone}</Badge>) // Render again to clear
    })
  })

  it('applies subtle variant by default', () => {
    render(<Badge>Subtle Badge</Badge>)
    const badge = screen.getByText('Subtle Badge')
    expect(badge).toHaveClass('border-border-subtle', 'bg-surface-secondary', 'text-text-mid')
  })

  it('applies solid variant when subtle is false', () => {
    render(<Badge subtle={false}>Solid Badge</Badge>)
    const badge = screen.getByText('Solid Badge')
    expect(badge).toHaveClass('bg-text-mid', 'text-white')
  })

  it('applies custom class names', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders with correct base styles', () => {
    render(<Badge>Base Badge</Badge>)
    const badge = screen.getByText('Base Badge')
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'px-3',
      'py-1',
      'text-xs',
      'font-semibold',
      'uppercase',
      'tracking-wide'
    )
  })

  it('applies subtle styles for success tone', () => {
    render(<Badge tone="success">Success Badge</Badge>)
    const badge = screen.getByText('Success Badge')
    expect(badge).toHaveClass('border-status-success/30', 'bg-status-success/10', 'text-status-success')
  })

  it('applies solid styles for success tone when subtle is false', () => {
    render(<Badge tone="success" subtle={false}>Success Badge</Badge>)
    const badge = screen.getByText('Success Badge')
    expect(badge).toHaveClass('bg-status-success', 'text-white')
  })

  it('applies subtle styles for warning tone', () => {
    render(<Badge tone="warning">Warning Badge</Badge>)
    const badge = screen.getByText('Warning Badge')
    expect(badge).toHaveClass('border-status-warning/30', 'bg-status-warning/10', 'text-status-warning')
  })

  it('applies subtle styles for danger tone', () => {
    render(<Badge tone="danger">Danger Badge</Badge>)
    const badge = screen.getByText('Danger Badge')
    expect(badge).toHaveClass('border-status-danger/30', 'bg-status-danger/10', 'text-status-danger')
  })

  it('applies subtle styles for info tone', () => {
    render(<Badge tone="info">Info Badge</Badge>)
    const badge = screen.getByText('Info Badge')
    expect(badge).toHaveClass('border-status-info/30', 'bg-status-info/10', 'text-status-info')
  })

  it('applies subtle styles for brand tone', () => {
    render(<Badge tone="brand">Brand Badge</Badge>)
    const badge = screen.getByText('Brand Badge')
    expect(badge).toHaveClass('border-brand-primary/40', 'bg-brand-primary-light', 'text-brand-primary')
  })

  it('passes additional props to the span element', () => {
    render(
      <Badge data-testid="test-badge" aria-label="test badge">
        Test Badge
      </Badge>
    )
    const badge = screen.getByTestId('test-badge')
    expect(badge).toHaveAttribute('aria-label', 'test badge')
  })

  it('has correct semantic attributes', () => {
    render(<Badge>Test Badge</Badge>)
    const badge = screen.getByText('Test Badge')
    expect(badge.tagName).toBe('SPAN')
  })
})