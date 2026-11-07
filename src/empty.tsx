// empty：本仓自有组件（功能对齐 shadcn empty，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './empty.css'

export const Empty = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(css.empty, className)} {...props} />
  ),
)
Empty.displayName = 'Empty'

export function EmptyMedia({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(css.media, className)}>{children}</div>
}

export const EmptyTitle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(css.title, className)} {...props} />
  ),
)
EmptyTitle.displayName = 'EmptyTitle'

export const EmptyDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={clsx(css.description, className)} {...props} />
  ),
)
EmptyDescription.displayName = 'EmptyDescription'

export function EmptyContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(css.content, className)}>{children}</div>
}
