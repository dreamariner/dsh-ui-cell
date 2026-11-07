// popover：本仓自有组件（功能对齐 shadcn popover，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。
import { forwardRef, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import css from './popover.css'
import { useAnchoredPosition } from './use-anchored-position.ts'
import { useDismissOnOutsidePointer } from './use-dismiss-on-outside-pointer.ts'

export interface PopoverProps {
  /** 触发器（会被包进测量锚点）。 */
  trigger: ReactNode
  /** 浮层内容（body-portaled，fixed 定位）。 */
  content: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'bottom' | 'right'
  align?: 'start' | 'end'
  /** 与锚点的间距（px）。 */
  gap?: number
}

export function Popover({ trigger, content, open: openProp, defaultOpen = false, onOpenChange, side = 'bottom', align = 'start', gap = 6 }: PopoverProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = (next: boolean) => { setUncontrolled(next); onOpenChange?.(next) }
  const rootRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const position = useAnchoredPosition({ open, anchorRef: rootRef, panelRef, side, align, gap, margin: 8 })
  useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef)
  return (
    <span ref={rootRef} className={css.root}>
      <span className={css.trigger} onClick={() => setOpen(!open)}>{trigger}</span>
      {open && createPortal(
        <div ref={panelRef} className={css.content} style={position ?? undefined}>{content}</div>,
        document.body,
      )}
    </span>
  )
}
