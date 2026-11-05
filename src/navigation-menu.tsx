// navigation-menu：kit 自有组件（功能对齐 shadcn navigation-menu，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 kit 的官方行为模块。
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './navigation-menu.css'
import { Menu, type MenuEntry } from './menu.tsx'

export interface NavigationMenuItem {
  id: string
  label: ReactNode
  /** 链接目标；提供则渲染为 <a>。 */
  href?: string
  /** 当前页标识（下划线高亮）。 */
  current?: boolean
  /** 下拉子菜单（可选，官方 Menu 渲染）。 */
  children?: readonly MenuEntry[]
}

/** 顶部导航：链接 + 当前指示 + 可选下拉（简化版，无 mega panel）。 */
export function NavigationMenu({ items, onNavigate, className }: { items: NavigationMenuItem[]; onNavigate?: (id: string) => void; className?: string }) {
  const [openId, setOpenId] = useState<string | undefined>()
  return (
    <nav className={clsx(css.nav, className)}>
      {items.map((item) => {
        if (item.children !== undefined) {
          return (
            <Menu
              key={item.id}
              open={openId === item.id}
              side="bottom"
              align="start"
              anchor={
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openId === item.id || undefined}
                  data-current={item.current || undefined}
                  className={clsx(css.item, css.button)}
                  onClick={() => setOpenId((prev) => (prev === item.id ? undefined : item.id))}
                >
                  {item.label}
                </button>
              }
              items={item.children}
              onSelect={(id) => { setOpenId(undefined); onNavigate?.(id) }}
              onClose={() => setOpenId(undefined)}
            />
          )
        }
        return (
          <a
            key={item.id}
            href={item.href ?? '#'}
            aria-current={item.current ? 'page' : undefined}
            data-current={item.current || undefined}
            className={css.item}
            onClick={(event) => { if (item.href === undefined) { event.preventDefault(); onNavigate?.(item.id) } }}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
