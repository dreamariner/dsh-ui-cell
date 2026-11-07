// context-menu：本仓自有组件（功能对齐 shadcn context-menu，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。
import { useRef, useState, type ReactNode } from 'react'
import css from './context-menu.css'
import { Menu, type MenuEntry } from './menu.tsx'

export interface ContextMenuProps {
  items: readonly MenuEntry[]
  onSelect?: (id: string) => void
  /** 右键目标（包一层 span 接 onContextMenu）。 */
  children: ReactNode
  disabled?: boolean
}

/** 右键菜单：包住目标元素，官方 Menu 的 contextual 模式在指针处弹出。 */
export function ContextMenu({ items, onSelect, children, disabled = false }: ContextMenuProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | undefined>()
  const rootRef = useRef<HTMLSpanElement>(null)
  return (
    <span
      ref={rootRef}
      className={css.root}
      onContextMenu={(event) => {
        if (disabled) return
        event.preventDefault()
        setPoint({ x: event.clientX, y: event.clientY })
      }}
    >
      {children}
      {point !== undefined && (
        <Menu
          open
          contextual
          portal
          anchor={<span />}
          items={items}
          getAnchorRect={() => {
            const rect = new DOMRect(point.x, point.y, 0, 0)
            return rect
          }}
          onSelect={(id) => { setPoint(undefined); onSelect?.(id) }}
          onClose={() => setPoint(undefined)}
        />
      )}
    </span>
  )
}
