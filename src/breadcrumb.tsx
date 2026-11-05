// breadcrumb：kit 自有组件（功能对齐 shadcn breadcrumb，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './breadcrumb.css'

export const Breadcrumb = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={clsx(css.breadcrumb, className)} {...props} />
  ),
)
Breadcrumb.displayName = 'Breadcrumb'

export const BreadcrumbList = forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={clsx(css.list, className)} {...props} />
  ),
)
BreadcrumbList.displayName = 'BreadcrumbList'

export const BreadcrumbItem = forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={clsx(css.item, className)} {...props} />
  ),
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => (
    <a ref={ref} className={clsx(css.link, className)} {...props} />
  ),
)
BreadcrumbLink.displayName = 'BreadcrumbLink'

export const BreadcrumbPage = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} role="link" aria-disabled="true" aria-current="page" className={clsx(css.page, className)} {...props} />
  ),
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

export function BreadcrumbSeparator({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <li role="presentation" aria-hidden="true" className={clsx(css.separator, className)}>
      {children ?? '/'}
    </li>
  )
}
