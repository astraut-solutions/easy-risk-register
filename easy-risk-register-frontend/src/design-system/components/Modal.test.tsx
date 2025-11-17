import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Modal } from './Modal'

// Mock framer-motion to prevent animation-related issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => (
        <div data-motion-component="div" {...props}>
          {children}
        </div>
      ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('Modal', () => {
  beforeEach(() => {
    // Reset any global DOM state before each test
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // Clean up DOM after each test
    cleanup()
  })

  it('renders correctly when isOpen is true', () => {
    render(<Modal isOpen onClose={() => {}}>Test Modal Content</Modal>)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Test Modal Content</Modal>)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders children correctly when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <div>Test Content</div>
      </Modal>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onCloseSpy = vi.fn()
    render(<Modal isOpen onClose={onCloseSpy} title="Test Modal">Test Content</Modal>)

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(onCloseSpy).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onCloseSpy = vi.fn()
    render(<Modal isOpen onClose={onCloseSpy}>Test Content</Modal>)

    const backdrop = screen.getByRole('dialog').parentElement
    fireEvent.click(backdrop!)

    expect(onCloseSpy).toHaveBeenCalled()
  })

  it('renders title when provided', () => {
    render(<Modal isOpen onClose={() => {}} title="Test Title">Test Content</Modal>)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('does not render header when title is not provided', () => {
    render(<Modal isOpen onClose={() => {}}>Test Content</Modal>)

    // Check that the header section isn't present
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test Title" eyebrow="Test Eyebrow">
        Test Content
      </Modal>
    )

    expect(screen.getByText('Test Eyebrow')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test Title" description="Test Description">
        Test Content
      </Modal>
    )

    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders header aside content when provided', () => {
    render(
      <Modal
        isOpen
        onClose={() => {}}
        title="Test Title"
        headerAside={<div data-testid="header-aside">Header Aside</div>}
      >
        Test Content
      </Modal>
    )

    expect(screen.getByTestId('header-aside')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Modal isOpen onClose={() => {}} size="lg">Test Content</Modal>)

    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('max-w-[720px]')

    // Test different size
    rerender(<Modal isOpen onClose={() => {}} size="md">Test Content</Modal>)
    expect(modalContent).toHaveClass('max-w-lg')
  })

  it('applies custom class names', () => {
    render(<Modal isOpen onClose={() => {}} className="custom-modal">Test Content</Modal>)

    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('custom-modal')
  })

  it('has correct ARIA attributes when title is provided', () => {
    render(<Modal isOpen onClose={() => {}} title="Test Title">Test Content</Modal>)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('has correct ARIA attributes when title is not provided', () => {
    render(<Modal isOpen onClose={() => {}}>Test Content</Modal>)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
  })

  it('has correct backdrop styling', () => {
    render(<Modal isOpen onClose={() => {}}>Test Content</Modal>)

    const backdrop = screen.getByRole('dialog').parentElement
    expect(backdrop).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-start',
      'justify-center',
      'overflow-y-auto',
      'bg-black/45',
      'px-4',
      'py-10',
      'backdrop-blur-sm'
    )
  })

  it('has correct modal container styling', () => {
    render(<Modal isOpen onClose={() => {}}>Test Content</Modal>)

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass(
      'relative',
      'z-10',
      'flex',
      'max-h-[95vh]',
      'w-full',
      'flex-col',
      'overflow-hidden',
      'rounded-[32px]',
      'border',
      'border-border-subtle/60',
      'bg-surface-primary',
      'shadow-[0px_18px_55px_rgba(15,23,42,0.28)]'
    )
  })

  it('renders content in scrollable area', () => {
    render(<Modal isOpen onClose={() => {}}>Test Content</Modal>)

    const contentArea = screen.getByText('Test Content').closest('div')
    expect(contentArea).toHaveClass('flex-1', 'overflow-y-auto', 'px-5', 'pb-5', 'pt-3')
  })

  it('renders close button with proper ARIA label', () => {
    render(<Modal isOpen onClose={() => {}} title="Test Title">Test Content</Modal>)

    const closeButton = screen.getByText('Close')
    expect(closeButton).toHaveAttribute('aria-label', 'Close modal')
  })

  it('renders close button with proper styling', () => {
    render(<Modal isOpen onClose={() => {}} title="Test Title">Test Content</Modal>)

    const closeButton = screen.getByText('Close')
    expect(closeButton).toHaveClass('rounded-full', 'border', 'px-3', 'py-1', 'text-text-low')
  })
})