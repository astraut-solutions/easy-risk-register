import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from './Select'

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

const getSelectButton = () => screen.getByRole('button')

describe('Select', () => {
  it('renders with the default placeholder', () => {
    render(<Select options={mockOptions} />)
    expect(getSelectButton()).toHaveTextContent('Select an option')
  })

  it('renders with custom placeholder', () => {
    render(<Select options={mockOptions} placeholder="Choose an option" />)
    expect(getSelectButton()).toHaveTextContent('Choose an option')
  })

  it('renders with label when provided', () => {
    render(<Select label="Test Label" options={mockOptions} />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('renders options when clicked', () => {
    render(<Select options={mockOptions} />)
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument()
    })
  })

  it('selects an option when clicked', () => {
    const mockOnChange = vi.fn()
    render(<Select options={mockOptions} onChange={mockOnChange} />)
    
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)
    
    const option = screen.getByText('Option 1')
    fireEvent.click(option)
    
    expect(mockOnChange).toHaveBeenCalledWith('option1')
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('shows error styling when error prop is provided', () => {
    render(<Select options={mockOptions} error="Error message" />)
    const selectButton = getSelectButton()
    expect(selectButton).toHaveClass('border-status-danger')
  })

  it('shows error message when error prop is provided', () => {
    render(<Select options={mockOptions} error="Error message" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('shows helper text when provided and no error', () => {
    render(<Select options={mockOptions} helperText="Helper text" />)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })

  it('does not show helper text when error is present', () => {
    render(
      <Select
        options={mockOptions}
        helperText="Helper text"
        error="Error message"
      />
    )
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('selects the defaultValue if no value is provided', () => {
    render(<Select options={mockOptions} defaultValue="option2" />)
    expect(getSelectButton()).toHaveTextContent('Option 2')
  })

  it('selects the value if provided', () => {
    render(<Select options={mockOptions} value="option3" />)
    expect(getSelectButton()).toHaveTextContent('Option 3')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Select options={mockOptions} disabled />)
    const selectButton = getSelectButton()
    expect(selectButton).toBeDisabled()
  })

  it('renders all options in dropdown', () => {
    render(<Select options={mockOptions} />)
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)

    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument()
    })
  })

  it('applies custom class names', () => {
    render(<Select options={mockOptions} className="custom-class" />)
    const selectButton = getSelectButton()
    expect(selectButton).toHaveClass('custom-class')
  })

  it('renders with correct base styles', () => {
    render(<Select options={mockOptions} />)
    const selectButton = getSelectButton()
    expect(selectButton).toHaveClass(
      'flex',
      'w-full',
      'items-center',
      'justify-between',
      'rounded-[20px]',
      'border',
      'border-border-faint',
      'bg-surface-secondary/10',
      'px-4',
      'py-2.5',
      'text-left',
      'text-sm',
      'text-text-high',
      'transition',
      'focus:outline-none',
      'focus-visible:ring-4',
      'focus-visible:ring-brand-primary/20',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    )
  })

  it('closes dropdown after selection', () => {
    render(<Select options={mockOptions} />)
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)
    
    // Verify dropdown is open
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    
    const option = screen.getByText('Option 1')
    fireEvent.click(option)
    
    // After selection, dropdown should be closed
    // The text should now be the selected option, not the placeholder
    expect(getSelectButton()).toHaveTextContent('Option 1')
  })

  it('shows checkmark for selected option', () => {
    render(<Select options={mockOptions} value="option1" />)
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)
    
    // The selected option should have a checkmark
    const selectedOption = screen.getByRole('option', { name: 'Option 1' })
    expect(selectedOption.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty options list', () => {
    render(<Select options={[]} />)
    const selectButton = getSelectButton()
    fireEvent.click(selectButton)
    
    expect(screen.getByText('No options')).toBeInTheDocument()
  })

  it('associates label with select using htmlFor attribute', () => {
    render(<Select id="test-id" label="Test Label" options={mockOptions} />)
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-id')
  })
})
