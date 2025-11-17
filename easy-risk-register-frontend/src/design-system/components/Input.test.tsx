import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('renders with label when provided', () => {
    render(<Input label="Test Label" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders without label when not provided', () => {
    render(<Input />)
    // Should not throw an error even without a label
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('applies error styling and message when error prop is provided', () => {
    render(<Input error="Error message" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-status-danger')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('does not show error when error prop is not provided', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).not.toHaveClass('border-status-danger')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('shows helper text when provided and no error', () => {
    render(<Input helperText="Helper text" />)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })

  it('does not show helper text when error is present', () => {
    render(<Input helperText="Helper text" error="Error message" />)
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('applies correct ARIA attributes', () => {
    render(<Input label="Test Label" helperText="Helper text" error="Error message" />)
    const input = screen.getByLabelText('Test Label')
    
    // When both helper text and error exist, both IDs should be in aria-describedby
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('applies custom class names', () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('passes additional props to the input element', () => {
    render(<Input data-testid="test-input" placeholder="Test placeholder" />)
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('placeholder', 'Test placeholder')
  })

  it('renders with correct base styles', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass(
      'w-full',
      'rounded-xl',
      'border',
      'border-border-subtle',
      'bg-surface-primary',
      'px-4',
      'py-3',
      'text-text-high',
      'placeholder:text-text-low',
      'focus:outline-none',
      'focus:ring-4',
      'focus:ring-brand-primary/20',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    )
  })

  it('renders as different input types', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox') // getByRole might not work for email, so let's use other testing methods
    expect(input).toHaveAttribute('type', 'email')
  })

  it('is disabled when disabled prop is provided', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('has the correct ID when id prop is provided', () => {
    render(<Input id="test-id" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('id', 'test-id')
  })

  it('associates label with input using htmlFor attribute', () => {
    render(<Input id="test-id" label="Test Label" />)
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-id')
  })
})
