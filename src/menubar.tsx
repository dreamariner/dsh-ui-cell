// menubar：kit 自有组件（功能对齐 shadcn menubar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 kit 的官方行为模块。
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './menubar.css'
import { Menu, type MenuEntry } from './menu.tsx'

export interface MenubarEntry {
  id: string
  label: ReactNode
  items: readonly MenuEntry[]
}

/** 顶栏菜单：点击展开，悬停切换（已有展开时）。 */
export function Menubar({ entries, onSelect, className }: { entries: MenubarEntry[]; onSelect?: (id: string) => void; className?: string }) {
  const [openId, setOpenId] = useState<string | undefined>()
  return (
    <div role="menubar" className={clsx(css.menubar, className)}>
      {entries.map((entry) => (
        <Menu
          key={entry.id}
          open={openId === entry.id}
          align="start"
          side="bottom"
          anchor={
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={openId === entry.id || undefined}
              data-open={openId === entry.id || undefined}
              className={css.entry}
              onClick={() => setOpenId((prev) => (prev === entry.id ? undefined : entry.id))}
              onMouseEnter={() => { if (openId !== undefined) setOpenId(entry.id) }}
            >
              {entry.label}
            </button>
          }
          items={entry.items}
          onSelect={(id) => { setOpenId(undefined); onSelect?.(id) }}
          onClose={() => setOpenId(undefined)}
        />
      ))}
    </div>
  )
}
