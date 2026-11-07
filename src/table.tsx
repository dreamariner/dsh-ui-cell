// table：本仓自有组件（功能对齐 shadcn table，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './table.css'

export const Table = forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className={css.wrapper}>
      <table ref={ref} className={clsx(css.table, className)} {...props} />
    </div>
  ),
)
Table.displayName = 'Table'

export const TableHeader = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (<thead ref={ref} className={clsx(css.header, className)} {...props} />),
)
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (<tbody ref={ref} className={clsx(css.body, className)} {...props} />),
)
TableBody.displayName = 'TableBody'

export const TableRow = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (<tr ref={ref} className={clsx(css.row, className)} {...props} />),
)
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (<th ref={ref} className={clsx(css.head, className)} {...props} />),
)
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (<td ref={ref} className={clsx(css.cell, className)} {...props} />),
)
TableCell.displayName = 'TableCell'

export const TableCaption = forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (<caption ref={ref} className={clsx(css.caption, className)} {...props} />),
)
TableCaption.displayName = 'TableCaption'
