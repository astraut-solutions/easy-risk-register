import { forwardRef } from 'react'
import type { HTMLAttributes, TableHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  caption?: string
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, caption, children, ...props }, ref) => (
    <div className="w-full">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {caption && (
          <caption className="mt-4 text-sm text-text-low text-center">
            {caption}
          </caption>
        )}
        {children}
      </table>
    </div>
  ),
)
Table.displayName = 'Table'

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props}>
    {children}
  </thead>
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  >
    {children}
  </tbody>
))
TableBody.displayName = 'TableBody'

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-surface-secondary font-medium', className)}
    {...props}
  >
    {children}
  </tfoot>
))
TableFooter.displayName = 'TableFooter'

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border-faint transition-colors hover:bg-surface-secondary data-[state=selected]:bg-surface-tertiary',
      className
    )}
    {...props}
  >
    {children}
  </tr>
))
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-semibold text-text-high [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  >
    {children}
  </th>
))
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle text-text-mid [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  >
    {children}
  </td>
))
TableCell.displayName = 'TableCell'

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, children, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-text-low', className)}
    {...props}
  >
    {children}
  </caption>
))
TableCaption.displayName = 'TableCaption'
