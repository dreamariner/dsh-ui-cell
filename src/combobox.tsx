// combobox：kit 自有组件（功能对齐 shadcn combobox，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 kit 的官方行为模块。
import { forwardRef, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import css from './combobox.css'
import { useAnchoredPosition } from './use-anchored-position.ts'
import { useDismissOnOutsidePointer } from './use-dismiss-on-outside-pointer.ts'
import { IconChevronDownOutlineRegular } from './icons.tsx'

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  /** 输入为空时是否显示全部选项（默认显示）。 */
  emptyQueryShowsAll?: boolean
  disabled?: boolean
}

/** 可输入过滤的下拉选择：原生 select 语义的手工实现（输入 + 锚定列表）。 */
export function Combobox({ value: valueProp, defaultValue = '', onValueChange, options, placeholder = '输入以筛选…', disabled = false }: ComboboxProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const filtered = query === ''
    ? options
    : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
  const selected = options.find((option) => option.value === value)
  const position = useAnchoredPosition({ open, anchorRef: rootRef, panelRef, side: 'bottom', align: 'start', gap: 4, margin: 8, minWidthFromAnchor: true })
  useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef)
  const commit = (option: ComboboxOption) => {
    setUncontrolled(option.value)
    onValueChange?.(option.value)
    setQuery('')
    setOpen(false)
  }
  return (
    <span ref={rootRef} className={clsx(css.root, disabled && css.disabled)}>
      <span className={css.wrap} onClick={() => !disabled && setOpen(!open)}>
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? inputId + '-list' : undefined}
          className={css.input}
          value={open ? query : selected?.label ?? ''}
          placeholder={open ? placeholder : (placeholder && !selected ? placeholder : '')}
          disabled={disabled}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (event.key === 'Enter' && filtered[active] !== undefined) { event.preventDefault(); commit(filtered[active]) }
            else if (event.key === 'Escape') { setQuery(''); setOpen(false) }
          }}
        />
        <IconChevronDownOutlineRegular size={14} className={css.chevron} />
      </span>
      {open && createPortal(
        <div ref={panelRef} className={css.list} role="listbox" id={inputId + '-list'} style={position ?? undefined}>
          {filtered.length === 0
            ? <div className={css.none}>无匹配项</div>
            : filtered.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-active={index === active || undefined}
                className={css.option}
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(option)}
              >
                {option.label}
              </button>
            ))}
        </div>,
        document.body,
      )}
    </span>
  )
}
