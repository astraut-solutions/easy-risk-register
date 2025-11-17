import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('renders with label when provided', () => {
    render(<Textarea label="Test Label" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders without label when not provided', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('applies error styling and message when error prop is provided', () => {
    render(<Textarea error="Error message" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('border-status-danger')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('does not show error when error prop is not provided', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).not.toHaveClass('border-status-danger')
    expect(textarea).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('shows helper text when provided and no error', () => {
    render(<Textarea helperText="Helper text" />)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })

  it('does not show helper text when error is present', () => {
    render(<Textarea helperText="Helper text" error="Error message" />)
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(<Textarea className="custom-class" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('custom-class')
  })

  it('passes additional props to the textarea element', () => {
    render(<Textarea data-testid="test-textarea" placeholder="Test placeholder" />)
    const textarea = screen.getByTestId('test-textarea')
    expect(textarea).toHaveAttribute('placeholder', 'Test placeholder')
  })

  it('renders with correct base styles', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass(
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
      'disabled:opacity-50',
      'resize-y'
    )
  })

  it('is disabled when disabled prop is provided', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('has the correct ID when id prop is provided', () => {
    render(<Textarea id="test-id" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('id', 'test-id')
  })

  it('associates label with textarea using htmlFor attribute', () => {
    render(<Textarea id="test-id" label="Test Label" />)
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-id')
  })

  it('has correct ARIA attributes', () => {
    render(<Textarea label="Test Label" helperText="Helper text" error="Error message" />)
    const textarea = screen.getByLabelText('Test Label')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts and renders value prop', () => {
    render(<Textarea value="Test value" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('Test value')
  })

  it('accepts and renders rows prop', () => {
    render(<Textarea rows={5} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('can be used as a controlled component', () => {
    render(<Textarea value="Controlled value" onChange={() => {}} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('Controlled value')
  })
})
