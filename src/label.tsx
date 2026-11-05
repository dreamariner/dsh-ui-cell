// label：kit 自有组件（功能对齐 shadcn label，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './label.css'

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={clsx(css.label, className)} {...props} />
  ),
)
Label.displayName = 'Label'
