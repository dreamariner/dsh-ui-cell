// skeleton：本仓自有组件（功能对齐 shadcn skeleton，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './skeleton.css'

export const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={clsx(css.skeleton, className)} {...props} />
  ),
)
Skeleton.displayName = 'Skeleton'
