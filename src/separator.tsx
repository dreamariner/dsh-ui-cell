// separator：本仓自有组件（功能对齐 shadcn separator，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './separator.css'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => (
    <div ref={ref} role="separator" aria-orientation={orientation} className={clsx(css.separator, css[orientation], className)} {...props} />
  ),
)
Separator.displayName = 'Separator'
