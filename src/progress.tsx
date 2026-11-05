// progress：kit 自有组件（功能对齐 shadcn progress，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './progress.css'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0 到 100；缺省视为 indeterminate（来回滑动）。 */
  value?: number
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className, ...props }, ref) => {
    const indeterminate = value === undefined
    const clamped = indeterminate ? undefined : Math.min(100, Math.max(0, value))
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={clsx(css.progress, indeterminate && css.indeterminate, className)}
        {...props}
      >
        <div className={css.indicator} style={indeterminate ? undefined : { transform: `scaleX(${(clamped ?? 0) / 100})` }} />
      </div>
    )
  },
)
Progress.displayName = 'Progress'
