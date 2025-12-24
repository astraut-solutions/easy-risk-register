import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useForm, useFieldArray } from 'react-hook-form'
import { RiskForm } from '../../../src/components/risk/RiskForm'

// Mock react-hook-form
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')
  return {
    ...actual,
    useForm: vi.fn(),
    useFieldArray: vi.fn(() => ({
      fields: [],
      append: vi.fn(),
      remove: vi.fn(),
      move: vi.fn(),
    })),
    Controller: ({ name, defaultValue, render }: any) =>
      render({
        field: {
          name,
          value: defaultValue,
          onChange: vi.fn(),
          onBlur: vi.fn(),
        },
      }),
  }
})

// Simple utility to ensure mocked form controls have stable IDs
let mockFieldCounter = 0
const getMockFieldId = () => `mock-field-${mockFieldCounter++}`

// Mock design system components
vi.mock('../../../src/design-system', async () => {
  const actual = await vi.importActual('../../../src/design-system')
  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button {...props} data-testid="mock-button">
        {children}
      </button>
    ),
    Input: ({ label, helperText, error, id, ...props }: any) => {
      const inputId = id ?? getMockFieldId()
      return (
        <div data-testid="mock-input">
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...props} />
          {helperText && <small>{helperText}</small>}
          {error && <p role="alert">{error}</p>}
        </div>
      )
    },
    Select: ({ label, options = [], error, helperText, id, ...props }: any) => {
      const selectId = id ?? getMockFieldId()
      return (
        <div data-testid="mock-select">
          {label && <label htmlFor={selectId}>{label}</label>}
          <select id={selectId} {...props}>
            {options.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {helperText && <small>{helperText}</small>}
          {error && <p role="alert">{error}</p>}
        </div>
      )
    },
    Textarea: ({ label, helperText, error, id, ...props }: any) => {
      const textAreaId = id ?? getMockFieldId()
      return (
        <div data-testid="mock-textarea">
          {label && <label htmlFor={textAreaId}>{label}</label>}
          <textarea id={textAreaId} {...props} />
          {helperText && <small>{helperText}</small>}
          {error && <p role="alert">{error}</p>}
        </div>
      )
    },
  }
})

// Mock utils
const mockUseForm = {
  register: vi.fn(),
  handleSubmit: vi.fn((onValid) => onValid),
  watch: vi.fn((name?: string) => {
    if (typeof name === 'string') return 'open'
    return {
      title: 'Test risk',
      description: 'Test description',
      category: 'Security',
      status: 'open',
      probability: 3,
      impact: 3,
    }
  }),
  getValues: vi.fn(() => ({})),
  reset: vi.fn(),
  setValue: vi.fn(),
  control: {},
  formState: { errors: {}, isSubmitting: false, isValid: true },
}

describe('RiskForm', () => {
  const defaultProps = {
    categories: ['Security', 'Operational', 'Compliance'],
    onSubmit: vi.fn(),
  }

  beforeEach(() => {
    mockFieldCounter = 0
    vi.mocked(useForm).mockReturnValue(mockUseForm)
    vi.mocked(useFieldArray).mockReturnValue({
      fields: [],
      append: vi.fn(),
      remove: vi.fn(),
      move: vi.fn(),
    } as any)
  })

  it('renders all form fields', () => {
    render(<RiskForm {...defaultProps} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /likelihood/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /impact/i })).toBeInTheDocument()
    expect(screen.getByText('Details (optional)')).toBeInTheDocument()
  })

  it('collapses optional details by default', () => {
    render(<RiskForm {...defaultProps} />)

    const summary = screen.getByText('Details (optional)')
    const details = summary.closest('details')

    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')
  })

  it('displays correct mode button text', () => {
    const { rerender } = render(<RiskForm {...defaultProps} mode="create" />)
    expect(screen.getByText('Add risk')).toBeInTheDocument()

    rerender(<RiskForm {...defaultProps} mode="edit" />)
    expect(screen.getByText('Update risk')).toBeInTheDocument()
  })

  it('shows risk score calculation', () => {
    vi.mocked(mockUseForm.watch).mockReturnValue({ probability: 4, impact: 3 })
    render(<RiskForm {...defaultProps} />)

    // With probability 4 and impact 3, risk score should be 12
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('explains severity and recommends a next step', () => {
    vi.mocked(mockUseForm.watch).mockReturnValue({ probability: 4, impact: 3 })
    render(<RiskForm {...defaultProps} />)

    expect(screen.getByText(/Score > 6 is high severity/i)).toBeInTheDocument()
    expect(screen.getByText(/Recommended next step/i)).toBeInTheDocument()
    expect(screen.getByText(/Assign an owner and set a due date/i)).toBeInTheDocument()
  })

  it('shows different severity levels', () => {
    // Test low severity
    vi.mocked(mockUseForm.watch).mockReturnValue({ probability: 1, impact: 2 })
    render(<RiskForm {...defaultProps} />)
    expect(screen.getByText('LOW')).toBeInTheDocument()

    // Test medium severity
    vi.mocked(mockUseForm.watch).mockReturnValue({ probability: 2, impact: 3 })
    render(<RiskForm {...defaultProps} />)
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()

    // Test high severity
    vi.mocked(mockUseForm.watch).mockReturnValue({ probability: 4, impact: 3 })
    render(<RiskForm {...defaultProps} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('submits form with correct values', async () => {
    const mockSubmit = vi.fn()
    vi.mocked(mockUseForm.handleSubmit).mockImplementation((fn) => {
      return vi.fn(() => fn({ 
        title: 'Test Risk', 
        description: 'Test Description', 
        probability: 3, 
        impact: 4,
        category: 'Security',
        mitigationPlan: 'Test plan',
        status: 'open',
        owner: '',
        ownerTeam: '',
        dueDate: '',
        reviewDate: '',
        riskResponse: 'treat',
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        notes: '',
        evidence: [],
        mitigationSteps: [],
      }))
    })

    render(<RiskForm {...defaultProps} onSubmit={mockSubmit} />)

    const submitButton = screen.getByText('Add risk')
    const form = submitButton.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Risk',
          description: 'Test Description',
          probability: 3,
          impact: 4,
          category: 'Security',
          mitigationPlan: 'Test plan',
          status: 'open',
          riskResponse: 'treat',
          evidence: [],
          mitigationSteps: [],
        }),
      )
    })
  })

  it('resets form after successful create submission', async () => {
    const resetSpy = vi.fn()
    const mockUseFormWithReset = {
      ...mockUseForm,
      reset: resetSpy,
      formState: { errors: {}, isSubmitting: false, isValid: true },
    }
    vi.mocked(useForm).mockReturnValue(mockUseFormWithReset)
    vi.mocked(mockUseFormWithReset.handleSubmit).mockImplementation((fn) => {
      return vi.fn(() => fn({ 
        title: 'Test Risk', 
        description: 'Test Description', 
        probability: 3, 
        impact: 4,
        category: 'Security',
        mitigationPlan: 'Test plan',
        status: 'open'
      }))
    })

    render(<RiskForm {...defaultProps} mode="create" onSubmit={() => {}} />)

    const submitButton = screen.getByText('Add risk')
    const form = submitButton.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith({
        title: '',
        description: '',
        probability: 3,
        impact: 3,
        category: 'Security',
        threatType: 'other',
        templateId: undefined,
        mitigationPlan: '',
        status: 'open',
        owner: '',
        ownerTeam: '',
        dueDate: '',
        reviewDate: '',
        reviewCadence: undefined,
        riskResponse: 'treat',
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        notes: '',
        evidence: [],
        mitigationSteps: [],
      })
    })
  })

  it('does not reset form after edit submission', async () => {
    const resetSpy = vi.fn()
    const mockUseFormWithReset = {
      ...mockUseForm,
      reset: resetSpy,
      formState: { errors: {}, isSubmitting: false, isValid: true },
    }
    vi.mocked(useForm).mockReturnValue(mockUseFormWithReset)
    vi.mocked(mockUseFormWithReset.handleSubmit).mockImplementation((fn) => {
      return vi.fn(() => fn({ 
        title: 'Test Risk', 
        description: 'Test Description', 
        probability: 3, 
        impact: 4,
        category: 'Security',
        mitigationPlan: 'Test plan',
        status: 'open'
      }))
    })

    render(<RiskForm {...defaultProps} mode="edit" onSubmit={() => {}} />)

    const submitButton = screen.getByText('Update risk')
    const form = submitButton.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(resetSpy).not.toHaveBeenCalled()
    })
  })

  it('shows cancel button in edit mode', () => {
    const mockCancel = vi.fn()
    render(<RiskForm {...defaultProps} mode="edit" onCancel={mockCancel} />)

    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not show cancel button in create mode', () => {
    render(<RiskForm {...defaultProps} mode="create" />)

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const mockCancel = vi.fn()
    render(<RiskForm {...defaultProps} mode="edit" onCancel={mockCancel} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockCancel).toHaveBeenCalled()
  })

  it('disables submit button when form is submitting', () => {
    const mockUseFormSubmitting = {
      ...mockUseForm,
      formState: { errors: {}, isSubmitting: true, isValid: true },
    }
    vi.mocked(useForm).mockReturnValue(mockUseFormSubmitting)

    render(<RiskForm {...defaultProps} />)

    const submitButton = screen.getByText('Add risk')
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button until the form is valid', () => {
    const mockUseFormInvalid = {
      ...mockUseForm,
      formState: { errors: {}, isSubmitting: false, isValid: false },
      watch: vi.fn(() => ({ title: '', description: '', category: '', status: '' })),
    }
    vi.mocked(useForm).mockReturnValue(mockUseFormInvalid)

    render(<RiskForm {...defaultProps} />)

    const submitButton = screen.getByText('Add risk')
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/Complete required fields/i)).toBeInTheDocument()
  })

  it('shows validation errors when required fields are empty', () => {
    const mockUseFormWithErrors = {
      ...mockUseForm,
      formState: {
        errors: {
          title: { message: 'Add a short, specific title (e.g., “Supply chain disruption”).' },
          category: { message: 'Select a category.' },
          description: { message: 'Add 2–3 sentences describing context and business impact.' },
        },
        isSubmitting: false,
      },
    }
    vi.mocked(useForm).mockReturnValue(mockUseFormWithErrors)

    render(<RiskForm {...defaultProps} />)

    expect(
      screen.getByText('Add a short, specific title (e.g., “Supply chain disruption”).'),
    ).toBeInTheDocument()
    expect(screen.getByText('Select a category.')).toBeInTheDocument()
    expect(
      screen.getByText('Add 2–3 sentences describing context and business impact.'),
    ).toBeInTheDocument()
  })
})
