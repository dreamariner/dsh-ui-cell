// sidebar-nav：本仓自有组件（对齐 shadcn sidebar 的菜单族精简版：SidebarMenu +
// MenuItem + GroupLabel + Badge 合成一个导航列表，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
//
// 与 Sidebar（布局壳）的分工：壳只管宽度与三段结构，导航条目归本组件
// （选中态、分组标题、徽标、收起态的图标化）。收起态自动从 Sidebar 的
// Context 读（issue 028，消费端不用再传一遍）；显式 collapsed prop 仍可覆盖
// （独立于壳使用、或消费端就是要锁死某个态时用）。收起时文字隐藏、
// 徽标缩成圆点、item 靠 title 保悬浮提示。
// 语义：<nav> + 按钮，选中项 aria-current="true"；不搞 roving tabindex
// （竖排导航逐项 Tab 是标准做法，shadcn 同款）。
import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { useSidebarCollapsed } from './sidebar.tsx'
import css from './sidebar-nav.css'

/** 一个导航条目。 */
export interface SidebarNavItem {
  /** 选中值（调用方的路由/页签名）。 */
  value: string
  /** 条目文字（收起态下作为 title 悬浮提示）。 */
  label: string
  /** 左侧图标（收起态下唯一可见的部分）。 */
  icon?: ReactNode
  /** 右侧徽标（数字或短文字；收起态缩成圆点）。 */
  badge?: ReactNode
  /** 禁用（不可选，悬停无反馈）。 */
  disabled?: boolean
}

/** 一组导航条目（label 可选，作分组标题）。 */
export interface SidebarNavGroup {
  label?: string
  items: readonly SidebarNavItem[]
}

export interface SidebarNavProps {
  /** 扁平条目（便捷用法；与 groups 二选一或混用不上，groups 优先）。 */
  items?: readonly SidebarNavItem[]
  /** 分组条目（带可选标题）。 */
  groups?: readonly SidebarNavGroup[]
  /** 当前选中值（受控）。 */
  value?: string
  /** 初始选中值（非受控）。 */
  defaultValue?: string
  /** 选中回调（点已选中项不触发）。 */
  onSelect?: (value: string) => void
  /** 收起态：只显示图标。缺省自动读所在 Sidebar 的收起态（Context），显式给值则覆盖。 */
  collapsed?: boolean
  /** 无障碍名（整个导航的 aria-label）。 */
  label: string
  className?: string
}

export const SidebarNav = forwardRef<HTMLElement, SidebarNavProps>(
  ({ items, groups, value: valueProp, defaultValue, onSelect, collapsed: collapsedProp, label, className }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue)
    const value = valueProp ?? uncontrolled
    // 收起态三层：显式 prop > Sidebar 的 Context > 缺省展开（独立使用时）。
    const collapsed = collapsedProp ?? useSidebarCollapsed() ?? false
    const sections = groups ?? (items !== undefined ? [{ items }] : [])
    return (
      <nav ref={ref} aria-label={label} data-collapsed={collapsed || undefined} className={clsx(css.nav, className)}>
        {sections.map((group, gi) => (
          <div key={group.label ?? gi} className={css.group}>
            {group.label !== undefined && !collapsed
              ? <div className={css.groupLabel}>{group.label}</div>
              : null}
            {group.items.map((item) => {
              const active = item.value === value
              return (
                <button
                  key={item.value}
                  type="button"
                  className={css.item}
                  title={item.label}
                  aria-current={active || undefined}
                  aria-disabled={item.disabled || undefined}
                  disabled={item.disabled}
                  onClick={() => { if (!active && !item.disabled) { setUncontrolled(item.value); onSelect?.(item.value) } }}
                >
                  {item.icon !== undefined && <span aria-hidden="true" className={css.icon}>{item.icon}</span>}
                  {!collapsed && <span className={css.itemText}>{item.label}</span>}
                  {item.badge !== undefined && (
                    collapsed
                      ? <span aria-hidden="true" className={css.badgeDot} />
                      : <span className={css.badge}>{item.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    )
  },
)
SidebarNav.displayName = 'SidebarNav'
