// alert：kit 自有组件（功能对齐 shadcn alert，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './alert.css'

export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  icon?: ReactNode
}

/** 语义提示条：左边框取状态色，文案区 Title/Description。 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', icon, className, children, ...props }, ref) => (
    <div ref={ref} data-variant={variant} role="alert" className={clsx(css.alert, className)} {...props}>
      {icon !== undefined && <span className={css.icon}>{icon}</span>}
      <div className={css.body}>{children}</div>
    </div>
  ),
)
Alert.displayName = 'Alert'

export const AlertTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (<h5 ref={ref} className={clsx(css.title, className)} {...props} />),
)
AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (<p ref={ref} className={clsx(css.description, className)} {...props} />),
)
AlertDescription.displayName = 'AlertDescription'
