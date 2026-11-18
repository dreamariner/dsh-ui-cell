// sidebar：本仓自有组件（功能对齐 shadcn sidebar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
//
// 收起态经 Context 下发（2026-11-19，issue 028，对应 shadcn 的 useSidebar()）：
// 槽内内容（header/footer 里的任意组件）与 SidebarNav 都能自动感知收起态，
// 消费端不必把 collapsed 逐层传两遍；显式 prop 仍可覆盖 context。
import { createContext, forwardRef, useContext, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './sidebar.css'

/** Sidebar 的收起态上下文：不在 Sidebar 里时为 undefined。 */
const SidebarCollapsedContext = createContext<boolean | undefined>(undefined)

/**
 * 读取所在 Sidebar 的收起态（对应 shadcn 的 useSidebar 的 collapsed 部分）。
 * 不在 Sidebar 内时返回 undefined，调用方自行决定缺省值。
 */
export function useSidebarCollapsed(): boolean | undefined {
  return useContext(SidebarCollapsedContext)
}

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
      <SidebarCollapsedContext.Provider value={collapsed}>
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
      </SidebarCollapsedContext.Provider>
    )
  },
)
Sidebar.displayName = 'Sidebar'
