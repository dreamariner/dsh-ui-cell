// spinner：kit 自有组件（功能对齐 shadcn spinner，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './spinner.css'

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 方边长（px），默认 16。 */
  size?: number
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = 16, className, style, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label="loading"
      className={clsx(css.spinner, className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  ),
)
Spinner.displayName = 'Spinner'
