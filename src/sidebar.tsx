// sidebar：本仓自有组件（功能对齐 shadcn sidebar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './sidebar.css'

export interface SidebarProps {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** 收起为窄条（只显示图标位）。 */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** 收起态宽度（px）。 */
  collapsedWidth?: number
  /** 展开态宽度（px）。 */
  width?: number
  className?: string
}

/** 侧栏壳：Header/Content/Footer 三段 + 收起态（布局语义，内容自理）。 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ header, children, footer, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, collapsedWidth = 48, width = 240, className }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultCollapsed)
    const collapsed = collapsedProp ?? uncontrolled
    const setCollapsed = (next: boolean) => { setUncontrolled(next); onCollapsedChange?.(next) }
    return (
      <aside
        ref={ref}
        data-collapsed={collapsed || undefined}
        className={clsx(css.sidebar, className)}
        style={{ width: (collapsed ? collapsedWidth : width) + 'px' }}
      >
        {header !== undefined && <div className={css.header}>{header}</div>}
        <div className={css.content}>{children}</div>
        {footer !== undefined && <div className={css.footer}>{footer}</div>}
      </aside>
    )
  },
)
Sidebar.displayName = 'Sidebar'
