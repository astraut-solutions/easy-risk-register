import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table'

describe('Table components', () => {
  describe('Table', () => {
    it('renders children correctly', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </Table>
      )
      expect(screen.getByText('Test Cell')).toBeInTheDocument()
    })

    it('applies correct base classes', () => {
      render(<Table>Test Table</Table>)
      const table = screen.getByRole('table')
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm')
    })

    it('renders with caption when provided', () => {
      render(
        <Table caption="Test caption">
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </Table>
      )
      expect(screen.getByText('Test caption')).toBeInTheDocument()
    })

    it('applies custom class names', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </Table>
      )
      const table = screen.getByRole('table')
      expect(table).toHaveClass('custom-table')
    })

    it('passes additional props to the table element', () => {
      render(
        <Table data-testid="test-table" aria-label="test table">
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </Table>
      )
      const table = screen.getByTestId('test-table')
      expect(table).toHaveAttribute('aria-label', 'test table')
    })

    it('wraps table in overflow container', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </Table>
      )
      const tableContainer = screen.getByText('Test Cell').closest('div')
      expect(tableContainer).toHaveClass('w-full', 'overflow-auto')
    })
  })

  describe('TableHeader', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Test Header</th>
            </tr>
          </TableHeader>
        </table>
      )
      expect(screen.getByText('Test Header')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <TableHeader>Test Header Content</TableHeader>
        </table>
      )
      const header = screen.getByText('Test Header Content')
      expect(header).toHaveClass('[&_tr]:border-b')
    })

    it('applies custom class names', () => {
      render(
        <table>
          <TableHeader className="custom-header">Test Header Content</TableHeader>
        </table>
      )
      const header = screen.getByText('Test Header Content')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('TableBody', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </TableBody>
        </table>
      )
      expect(screen.getByText('Test Cell')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <TableBody>Test Body Content</TableBody>
        </table>
      )
      const body = screen.getByText('Test Body Content')
      expect(body).toHaveClass('[&_tr:last-child]:border-0')
    })

    it('applies custom class names', () => {
      render(
        <table>
          <TableBody className="custom-body">Test Body Content</TableBody>
        </table>
      )
      const body = screen.getByText('Test Body Content')
      expect(body).toHaveClass('custom-body')
    })
  })

  describe('TableFooter', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Test Footer</td>
            </tr>
          </TableFooter>
        </table>
      )
      expect(screen.getByText('Test Footer')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <TableFooter>Test Footer Content</TableFooter>
        </table>
      )
      const footer = screen.getByText('Test Footer Content')
      expect(footer).toHaveClass('bg-surface-secondary', 'font-medium')
    })

    it('applies custom class names', () => {
      render(
        <table>
          <TableFooter className="custom-footer">Test Footer Content</TableFooter>
        </table>
      )
      const footer = screen.getByText('Test Footer Content')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('TableRow', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Test Cell</td>
            </TableRow>
          </tbody>
        </table>
      )
      expect(screen.getByText('Test Cell')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <tbody>
            <TableRow>Test Row Content</TableRow>
          </tbody>
        </table>
      )
      const row = screen.getByText('Test Row Content')
      expect(row).toHaveClass(
        'border-b',
        'border-border-faint',
        'transition-colors',
        'hover:bg-surface-secondary',
        'data-[state=selected]:bg-surface-tertiary'
      )
    })

    it('applies custom class names', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row">Test Row Content</TableRow>
          </tbody>
        </table>
      )
      const row = screen.getByText('Test Row Content')
      expect(row).toHaveClass('custom-row')
    })

    it('passes additional props to the row element', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="test-row" data-state="selected">
              Test Row Content
            </TableRow>
          </tbody>
        </table>
      )
      const row = screen.getByTestId('test-row')
      expect(row).toHaveAttribute('data-state', 'selected')
    })
  })

  describe('TableHead', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Test Header</TableHead>
            </tr>
          </thead>
        </table>
      )
      expect(screen.getByText('Test Header')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Test Header</TableHead>
            </tr>
          </thead>
        </table>
      )
      const header = screen.getByText('Test Header')
      expect(header).toHaveClass(
        'h-12',
        'px-4',
        'text-left',
        'align-middle',
        'font-semibold',
        'text-text-high',
        '[&:has([role=checkbox])]:pr-0'
      )
    })

    it('applies custom class names', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head">Test Header</TableHead>
            </tr>
          </thead>
        </table>
      )
      const header = screen.getByText('Test Header')
      expect(header).toHaveClass('custom-head')
    })

    it('passes additional props to the header element', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="test-head" scope="col">
                Test Header
              </TableHead>
            </tr>
          </thead>
        </table>
      )
      const header = screen.getByTestId('test-head')
      expect(header).toHaveAttribute('scope', 'col')
    })
  })

  describe('TableCell', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Test Cell</TableCell>
            </tr>
          </tbody>
        </table>
      )
      expect(screen.getByText('Test Cell')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Test Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      )
      const cell = screen.getByText('Test Cell Content')
      expect(cell).toHaveClass('p-4', 'align-middle', 'text-text-mid', '[&:has([role=checkbox])]:pr-0')
    })

    it('applies custom class names', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Test Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      )
      const cell = screen.getByText('Test Cell Content')
      expect(cell).toHaveClass('custom-cell')
    })

    it('passes additional props to the cell element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="test-cell" align="center">
                Test Cell Content
              </TableCell>
            </tr>
          </tbody>
        </table>
      )
      const cell = screen.getByTestId('test-cell')
      expect(cell).toHaveAttribute('align', 'center')
    })
  })

  describe('TableCaption', () => {
    it('renders children correctly', () => {
      render(
        <table>
          <caption>
            <TableCaption>Test Caption</TableCaption>
          </caption>
        </table>
      )
      expect(screen.getByText('Test Caption')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(
        <table>
          <caption>
            <TableCaption>Test Caption Content</TableCaption>
          </caption>
        </table>
      )
      const caption = screen.getByText('Test Caption Content')
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-text-low')
    })

    it('applies custom class names', () => {
      render(
        <table>
          <caption>
            <TableCaption className="custom-caption">Test Caption Content</TableCaption>
          </caption>
        </table>
      )
      const caption = screen.getByText('Test Caption Content')
      expect(caption).toHaveClass('custom-caption')
    })
  })
})