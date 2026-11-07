// resizable：本仓自有组件（功能对齐 shadcn resizable，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './resizable.css'

export interface ResizableProps {
  left: ReactNode
  right: ReactNode
  /** 初始左栏百分比（10~90），默认 50。 */
  initialLeftPercent?: number
  /** 左栏宽度约束。 */
  minLeftPercent?: number
  maxLeftPercent?: number
  className?: string
}

/** 双栏拖拽分割（水平）：pointer 拖动分隔条更新左栏占比。 */
export const Resizable = forwardRef<HTMLDivElement, ResizableProps>(
  ({ left, right, initialLeftPercent = 50, minLeftPercent = 20, maxLeftPercent = 80, className }, ref) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [leftPercent, setLeftPercent] = useState(initialLeftPercent)
    const dragging = useRef(false)
    const onPointerMove = useCallback((event: PointerEvent) => {
      if (!dragging.current || rootRef.current === null) return
      const rect = rootRef.current.getBoundingClientRect()
      const percent = ((event.clientX - rect.left) / rect.width) * 100
      setLeftPercent(Math.max(minLeftPercent, Math.min(maxLeftPercent, percent)))
    }, [minLeftPercent, maxLeftPercent])
    const stop = useCallback(() => {
      dragging.current = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stop)
      document.body.style.cursor = ''
    }, [onPointerMove])
    const startDrag = () => {
      dragging.current = true
      document.body.style.cursor = 'col-resize'
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', stop)
    }
    return (
      <div ref={(node) => { rootRef.current = node; if (typeof ref === 'function') ref(node); else if (ref !== null && typeof ref === 'object') ref.current = node }} className={clsx(css.resizable, className)}>
        <div className={css.pane} style={{ flexBasis: leftPercent + '%' }}>{left}</div>
        <div
          role="separator"
          aria-orientation="vertical"
          className={css.divider}
          onPointerDown={startDrag}
        />
        <div className={css.pane}>{right}</div>
      </div>
    )
  },
)
Resizable.displayName = 'Resizable'
