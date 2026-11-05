// item：kit 自有组件（功能对齐 shadcn item，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './item.css'

export const Item = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(css.item, className)} {...props} />
  ),
)
Item.displayName = 'Item'

export function ItemMedia({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(css.media, className)}>{children}</div>
}

export const ItemContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(css.content, className)} {...props} />
  ),
)
ItemContent.displayName = 'ItemContent'

export const ItemTitle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(css.title, className)} {...props} />
  ),
)
ItemTitle.displayName = 'ItemTitle'

export const ItemDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={clsx(css.description, className)} {...props} />
  ),
)
ItemDescription.displayName = 'ItemDescription'

export function ItemActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(css.actions, className)}>{children}</div>
}
