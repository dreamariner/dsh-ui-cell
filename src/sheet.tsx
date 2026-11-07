// sheet：本仓自有组件（功能对齐 shadcn sheet，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。（drawer 功能合并：side bottom 即抽屉形态）

import { forwardRef, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import css from './sheet.css'
import { useModalLayer } from './use-modal-layer.ts'
import { IconCloseOutlineRegular } from './icons.tsx'

export type SheetSide = 'right' | 'left' | 'bottom' | 'top'

export interface SheetProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  side?: SheetSide
  title?: ReactNode
  footer?: ReactNode
  /** 面板宽度（right/left 时生效），默认 380px。 */
  width?: number | string
  children: ReactNode
}

/** 侧滑/底滑面板：portal + modal 层级栈（Escape 只归最上层），mask 点击关闭。 */
export function Sheet({ open, onOpenChange, side = 'right', title, footer, width, children }: SheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useModalLayer(dialogRef, open, () => onOpenChange?.(false))
  if (!open) return null
  return createPortal(
    <div className={css.root} data-side={side}>
      <div className={css.mask} onClick={() => onOpenChange?.(false)} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={css.panel}
        style={width !== undefined && (side === 'right' || side === 'left') ? { width: typeof width === 'number' ? width + 'px' : width } : undefined}
      >
        <div className={css.header}>
          <div className={css.title}>{title}</div>
          <button type="button" aria-label="关闭" className={css.close} onClick={() => onOpenChange?.(false)}>
            <IconCloseOutlineRegular size={16} />
          </button>
        </div>
        <div className={css.body}>{children}</div>
        {footer !== undefined && <div className={css.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
