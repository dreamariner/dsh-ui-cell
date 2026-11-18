// navigation-menu：本仓自有组件（功能对齐 shadcn navigation-menu，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。
//
// 当前指示（下划线）的归属（2026-11-19，issue 025）：双模式，与 Sidebar 的收起态同一套约定 ——
//   受控：任一条目声明 current: true → 以声明为准（路由是真相的消费端用这个）；
//   非受控：传 defaultCurrentId 起步，点击条目自迁移（声明了才迁移，子菜单选中不迁移父项）。
// 此前只有受控声明，演示与最简用法点条目下划线纹丝不动，像坏了。
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './navigation-menu.css'
import { Menu, type MenuEntry } from './menu.tsx'

export interface NavigationMenuItem {
  id: string
  label: ReactNode
  /** 链接目标；提供则渲染为 <a>。 */
  href?: string
  /** 当前页标识（下划线高亮）。任一条目声明 current 即进入受控模式，以声明为准。 */
  current?: boolean
  /** 下拉子菜单（可选，官方 Menu 渲染）。 */
  children?: readonly MenuEntry[]
}

/** 顶部导航：链接 + 当前指示 + 可选下拉（简化版，无 mega panel）。 */
export function NavigationMenu({ items, onNavigate, defaultCurrentId, className }: {
  items: NavigationMenuItem[]
  onNavigate?: (id: string) => void
  /** 非受控起步的当前项 id；点击条目（id 在 items 里）自迁移。 */
  defaultCurrentId?: string
  className?: string
}) {
  const [openId, setOpenId] = useState<string | undefined>()
  const [internalCurrentId, setInternalCurrentId] = useState(defaultCurrentId)
  const controlled = items.some(item => item.current)
  const currentId = controlled ? items.find(item => item.current)!.id : internalCurrentId
  const navigate = (id: string) => {
    // 子菜单选中的 id 不在顶层条目里 → 下划线留在父项（父项才是「当前页」）
    if (!controlled && items.some(item => item.id === id)) setInternalCurrentId(id)
    onNavigate?.(id)
  }
  return (
    <nav className={clsx(css.nav, className)}>
      {items.map((item) => {
        const isCurrent = item.id === currentId
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
                  data-current={isCurrent || undefined}
                  className={clsx(css.item, css.button)}
                  onClick={() => setOpenId((prev) => (prev === item.id ? undefined : item.id))}
                >
                  {item.label}
                </button>
              }
              items={item.children}
              onSelect={(id) => { setOpenId(undefined); navigate(id) }}
              onClose={() => setOpenId(undefined)}
            />
          )
        }
        return (
          <a
            key={item.id}
            href={item.href ?? '#'}
            aria-current={isCurrent ? 'page' : undefined}
            data-current={isCurrent || undefined}
            className={css.item}
            onClick={(event) => { if (item.href === undefined) { event.preventDefault(); navigate(item.id) } }}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
