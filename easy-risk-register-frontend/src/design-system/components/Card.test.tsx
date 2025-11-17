import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'

describe('Card components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card>Test Card Content</Card>)
      expect(screen.getByText('Test Card Content')).toBeInTheDocument()
    })

    it('applies base card classes', () => {
      render(<Card>Test Card</Card>)
      const card = screen.getByText('Test Card')
      expect(card).toHaveClass('rounded-2xl', 'border', 'bg-surface-primary', 'shadow-card-soft')
    })

    it('applies custom class names', () => {
      render(<Card className="custom-class">Test Card</Card>)
      const card = screen.getByText('Test Card')
      expect(card).toHaveClass('custom-class')
    })

    it('passes additional props to the card element', () => {
      render(
        <Card data-testid="test-card" aria-label="test card">
          Test Card
        </Card>
      )
      const card = screen.getByTestId('test-card')
      expect(card).toHaveAttribute('aria-label', 'test card')
    })
  })

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <CardHeader>Test Header</CardHeader>
        </Card>
      )
      expect(screen.getByText('Test Header')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <Card>
          <CardHeader>Test Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Test Header')
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'border-b', 'px-6', 'py-5')
    })

    it('applies custom class names', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Test Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Test Header')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders as a heading element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Test Title')
      expect(title.tagName).toBe('H3') // CardTitle renders as an h3
    })

    it('applies correct styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-text-high')
    })

    it('applies custom class names', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Test Description')
      expect(description).toHaveClass('text-sm', 'text-text-low')
    })

    it('applies custom class names', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-description">Test Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Test Description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <CardContent>Test Content</CardContent>
        </Card>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <Card>
          <CardContent>Test Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Test Content')
      expect(content).toHaveClass('px-6', 'py-5')
    })

    it('applies custom class names', () => {
      render(
        <Card>
          <CardContent className="custom-content">Test Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Test Content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      )
      expect(screen.getByText('Test Footer')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <Card>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Test Footer')
      expect(footer).toHaveClass(
        'flex',
        'flex-col',
        'gap-3',
        'border-t',
        'px-6',
        'py-5',
        'sm:flex-row',
        'sm:items-center',
        'sm:justify-between'
      )
    })

    it('applies custom class names', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Test Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Test Footer')
      expect(footer).toHaveClass('custom-footer')
    })
  })
})