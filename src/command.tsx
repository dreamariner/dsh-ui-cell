// command：本仓自有组件（功能对齐 shadcn command，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './command.css'

export interface CommandItem {
  id: string
  label: string
  /** 右侧提示（快捷键或分组名）。 */
  hint?: string
}

export interface CommandProps {
  items: CommandItem[]
  onSelect?: (id: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

/** 命令面板列表：输入过滤 + 上下键高亮 + Enter 选中（可见性由调用方控制）。 */
export const Command = forwardRef<HTMLDivElement, CommandProps>(
  ({ items, onSelect, placeholder = '输入命令或搜索…', emptyText = '无匹配命令', className }, ref) => {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const filtered = query === ''
      ? items
      : items.filter((item) => (item.label + ' ' + (item.hint ?? '')).toLowerCase().includes(query.toLowerCase()))
    const activeId = filtered[Math.min(active, filtered.length - 1)]?.id
    return (
      <div ref={ref} className={clsx(css.command, className)}>
        <input
          className={css.input}
          value={query}
          placeholder={placeholder}
          onChange={(event) => { setQuery(event.target.value); setActive(0) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (event.key === 'Enter' && activeId !== undefined) { onSelect?.(activeId) }
          }}
        />
        <div className={css.list} role="listbox">
          {filtered.length === 0
            ? <div className={css.none}>{emptyText}</div>
            : filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={index === active}
                data-active={index === active || undefined}
                className={css.item}
                onMouseEnter={() => setActive(index)}
                onClick={() => onSelect?.(item.id)}
              >
                <span className={css.label}>{item.label}</span>
                {item.hint !== undefined && <span className={css.hint}>{item.hint}</span>}
              </button>
            ))}
        </div>
      </div>
    )
  },
)
Command.displayName = 'Command'
