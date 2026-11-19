// resizable：本仓自有组件（功能对齐 shadcn resizable，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
//
// 拖动契约（2026-11-18 修，issue 016）：
//
// 1. **分隔条跟着光标走**：百分比是按「光标落在分隔条中心」反解出来的，不是按光标
//    落在分隔条左边缘。左栏宽度用 flex-basis 百分比给，而 flex-basis 的百分比按
//    **容器宽**算（不是按两栏之间的轨道宽算，轨道要减掉分隔条那几像素），
//    所以反解时：分母用容器宽，分子先减掉分隔条半宽 —— 两者必须配套，
//    否则分隔条与光标之间会差出一个固定偏移。
//    左栏**不能再吃 flex-grow**：grow 把剩余空间按比例分给两栏，于是「状态 45%」
//    渲染出来是 71.9%，拖动时越拖越偏（实测：光标往左拖 80px，分隔条反而往右挪 20px）。
//
// 2. **只按住时才改布局**：指针捕获（setPointerCapture）保证光标移出分隔条、
//    甚至移出窗口时事件仍然送到它，pointerup 一定收得到；再补 pointercancel 与
//    窗口失焦两条兜底。松手之后鼠标怎么动都不再改布局（实测：原先在窗口外松开时
//    页面收不到 pointerup，之后每次移动鼠标面板都在跟着变）。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Resizable } from './resizable.tsx'
//   <Resizable left={…} right={…} initialLeftPercent={50} />
//   props：left / right / initialLeftPercent / minLeftPercent / maxLeftPercent / className
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
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
    const dividerRef = useRef<HTMLDivElement | null>(null)
    const [leftPercent, setLeftPercent] = useState(initialLeftPercent)
    const [dragging, setDragging] = useState(false)
    // 拖动标记用 ref：pointermove 回调读的是当下的值，不能等 state 提交
    const draggingRef = useRef(false)

    /** 光标横坐标 → 左栏百分比（让分隔条中心正对光标）。 */
    const percentAt = useCallback((clientX: number): number | null => {
      const root = rootRef.current
      if (root === null) return null
      const rect = root.getBoundingClientRect()
      if (rect.width <= 0) return null
      const dividerWidth = dividerRef.current?.getBoundingClientRect().width ?? 0
      // 分隔条中心 = 容器左沿 + 左栏宽 + 分隔条半宽 → 反解左栏宽
      const leftWidth = clientX - rect.left - dividerWidth / 2
      const percent = (leftWidth / rect.width) * 100
      return Math.max(minLeftPercent, Math.min(maxLeftPercent, percent))
    }, [minLeftPercent, maxLeftPercent])

    const endDrag = useCallback(() => {
      draggingRef.current = false
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }, [])

    // 拖动期间的全局兜底：指针在窗口外松开时页面收不到 pointerup，
    // 窗口失焦（切标签页、弹系统框）同理 —— 不收尾的话，之后每次移动鼠标
    // 都会继续改布局。
    useEffect(() => {
      if (!dragging) return
      const finish = () => { endDrag() }
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
      window.addEventListener('blur', finish)
      return () => {
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
        window.removeEventListener('blur', finish)
      }
    }, [dragging, endDrag])

    // 组件在拖动中被卸载：光标与文本选中态要还原
    useEffect(() => () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }, [])

    const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault() // 别在拖动时选中文本，也别触发原生拖拽
      draggingRef.current = true
      setDragging(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      // 指针捕获：光标移出分隔条（乃至移出窗口）后事件仍送到它，松手一定收得到
      event.currentTarget.setPointerCapture(event.pointerId)
    }, [])

    const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      const percent = percentAt(event.clientX)
      if (percent !== null) setLeftPercent(percent)
    }, [percentAt])

    const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      endDrag()
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    }, [endDrag])

    return (
      <div ref={(node) => { rootRef.current = node; if (typeof ref === 'function') ref(node); else if (ref !== null && typeof ref === 'object') ref.current = node }} className={clsx(css.resizable, className)}>
        <div
          className={css.pane}
          style={{ flexBasis: `${leftPercent}%`, flexGrow: 0, flexShrink: 0 }}
        >{left}</div>
        <div
          ref={dividerRef}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPercent)}
          aria-valuemin={minLeftPercent}
          aria-valuemax={maxLeftPercent}
          className={css.divider}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        />
        <div className={css.pane}>{right}</div>
      </div>
    )
  },
)
Resizable.displayName = 'Resizable'
