import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from './SectionHeader'

describe('SectionHeader', () => {
  it('renders title correctly', () => {
    render(<SectionHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    render(<SectionHeader title="Test Title" eyebrow="Test Eyebrow" />)
    expect(screen.getByText('Test Eyebrow')).toBeInTheDocument()
  })

  it('does not render eyebrow when not provided', () => {
    render(<SectionHeader title="Test Title" />)
    expect(screen.queryByText('Test Eyebrow')).not.toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<SectionHeader title="Test Title" description="Test Description" />)
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<SectionHeader title="Test Title" />)
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <SectionHeader 
        title="Test Title" 
        actions={<button data-testid="test-action">Action</button>} 
      />
    )
    expect(screen.getByTestId('test-action')).toBeInTheDocument()
  })

  it('does not render actions when not provided', () => {
    render(<SectionHeader title="Test Title" />)
    expect(screen.queryByTestId('test-action')).not.toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(<SectionHeader title="Test Title" className="custom-class" />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('custom-class')
  })

  it('passes additional props to the header element', () => {
    render(<SectionHeader title="Test Title" data-testid="section-header" />)
    expect(screen.getByTestId('section-header')).toBeInTheDocument()
  })

  it('renders with correct base styles', () => {
    render(<SectionHeader title="Test Title" />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass(
      'flex',
      'flex-col',
      'gap-4',
      'text-text-mid',
      'md:flex-row',
      'md:items-end'
    )
  })

  it('renders all elements together', () => {
    render(
      <SectionHeader 
        title="Main Title"
        eyebrow="Section"
        description="Description text"
        actions={<button>Action Button</button>}
      />
    )

    expect(screen.getByText('Section')).toBeInTheDocument()
    expect(screen.getByText('Main Title')).toBeInTheDocument()
    expect(screen.getByText('Description text')).toBeInTheDocument()
    expect(screen.getByText('Action Button')).toBeInTheDocument()
  })

  it('has correct heading level', () => {
    render(<SectionHeader title="Test Title" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Test Title')
  })
})