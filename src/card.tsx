// card：本仓自有组件（功能对齐 shadcn card，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './card.css'

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (<div ref={ref} className={clsx(css.card, className)} {...props} />),
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (<div ref={ref} className={clsx(css.header, className)} {...props} />),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (<h3 ref={ref} className={clsx(css.title, className)} {...props} />),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (<p ref={ref} className={clsx(css.description, className)} {...props} />),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (<div ref={ref} className={clsx(css.content, className)} {...props} />),
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (<div ref={ref} className={clsx(css.footer, className)} {...props} />),
)
CardFooter.displayName = 'CardFooter'
