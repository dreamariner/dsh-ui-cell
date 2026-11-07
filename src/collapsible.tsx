// collapsible：本仓自有组件（功能对齐 shadcn collapsible，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './collapsible.css'

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 折叠区的触发器内容（通常一行标题）。 */
  trigger: ReactNode
  children: ReactNode
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ defaultOpen = false, open: openProp, onOpenChange, trigger, children, className, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultOpen)
    const open = openProp ?? uncontrolled
    const setOpen = (next: boolean) => { setUncontrolled(next); onOpenChange?.(next) }
    return (
      <div ref={ref} data-open={open || undefined} className={clsx(css.collapsible, className)} {...props}>
        <button type="button" aria-expanded={open} className={css.trigger} onClick={() => setOpen(!open)}>
          <svg className={css.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
          </svg>
          {trigger}
        </button>
        {open && <div className={css.content}>{children}</div>}
      </div>
    )
  },
)
Collapsible.displayName = 'Collapsible'
