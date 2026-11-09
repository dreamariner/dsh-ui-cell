// sheet：本仓自有组件（功能对齐 shadcn sheet，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 本仓的官方行为模块。（drawer 功能合并：side bottom 即抽屉形态）
//
// ⚠ **开合都要有动画**：挂载与「开合相位」分开管。
//   官方 Modal 那类写法是 `if (!open) return null`：open 一变 false，面板瞬间从 DOM 消失，
//   出场动画永远没机会播（用户看到的就是「关面板没有动画」）。
//   这里改成相位状态机：
//     open  → phase='open'（滑入 + 遮罩淡入）
//     close → phase='closed'，DOM 留着播出场动画，播完（animationend）才卸载
//   遮罩淡入淡出与面板滑入滑出都由 CSS 的 data-state 驱动（见 sheet.css）。
//
// ⚠ **相位必须在渲染期切**（见下面那段 prevOpen 比较）：若改用 effect 切相位，
//   DOM 会比 open 晚一个提交才出现，于是 useModalLayer 的 layout effect 跑在
//   DOM 出现之前 → 层级栈不注册 → **Escape 关不掉、焦点也不进对话框**。

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  /**
   * 限定容器（可选）：面板只在这个元素占的范围内展开，**不覆盖整个窗口**。
   *
   * ⚠ 典型用法：插件面板里的详情抽屉要限制在**自己那个页签**里，
   *   免得遮住宿主应用的其他区域（对话区、别的侧栏），打开抽屉时那些区域还能用。
   *   缺省 = 整个视口（portal 到 document.body + position: fixed）。
   *
   * 实现：容器只用来**量边界**（getBoundingClientRect），DOM 仍然 portal 到
   *   document.body 且用 position: fixed 定位 —— 这样容器内部滚动时抽屉不会跟着滚走
   *   （若 portal 进容器并用 absolute，它会被容器的滚动内容带着走）。
   */
  container?: HTMLElement | null
  children: ReactNode
}

/** 容器在视口里的矩形（抽屉的展开范围）。 */
interface SheetBounds {
  left: number
  top: number
  width: number
  height: number
}

/**
 * 出场兜底时长（毫秒）。
 *
 * ⚠ 正常路径是 animationend 触发卸载；这个定时器只兜底「动画没跑」的情况
 *   （样式被覆盖、元素不可见）。取值要大于官方 --ds-transition-duration，
 *   否则它会在动画播完前先到，把出场动画截断。
 */
const LEAVE_FALLBACK_MS = 800

/**
 * 系统「减少动态效果」开关。
 *
 * 开启后样式表把动画关掉（animation: none），也就不会有 animationend 事件，
 * 组件侧必须自己判断：这时关面板直接卸载，不要留一个不动的面板在屏幕上。
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = (): void => { setReduced(query.matches) }
    sync()
    query.addEventListener('change', sync)
    return () => { query.removeEventListener('change', sync) }
  }, [])
  return reduced
}

/** 侧滑/底滑面板：portal + modal 层级栈（Escape 只归最上层），mask 点击关闭。 */
export function Sheet({
  open, onOpenChange, side = 'right', title, footer, width, container, children,
}: SheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  // mounted 管 DOM 在不在，phase 管播哪段动画（写进 data-state）。
  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<'open' | 'closed'>(open ? 'open' : 'closed')
  const [prevOpen, setPrevOpen] = useState(open)
  // 限定容器的边界（视口坐标）：给了 container 才量，缺省是整个视口。
  const [bounds, setBounds] = useState<SheetBounds | null>(null)

  // 渲染期同步（React 官方「按 props 调整 state」写法）：
  // open 变化的**同一次提交**里就切相位、挂载 DOM。
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setMounted(true)
      setPhase('open')
    } else if (reducedMotion) {
      // 降级路径：不要动画，直接卸载（否则会留一个不动的面板在屏幕上）。
      setMounted(false)
      setPhase('closed')
    } else {
      // 出场段：DOM 留着播动画，播完由 animationend 卸载。
      setPhase('closed')
    }
  }

  // 出场兜底：动画事件没来（样式被覆盖、元素不可见）时也要卸载。
  useEffect(() => {
    if (phase !== 'closed' || !mounted) return
    const timer = window.setTimeout(() => { setMounted(false) }, LEAVE_FALLBACK_MS)
    return () => { window.clearTimeout(timer) }
  }, [phase, mounted])

  useModalLayer(dialogRef, open, () => onOpenChange?.(false))

  // 量容器的边界：容器滚动、窗口缩放都要跟着变（用捕获阶段监听 scroll，
  // 内层容器的滚动事件不冒泡到 window，捕获才收得到）。
  useLayoutEffect(() => {
    if (container === null || container === undefined) {
      setBounds(null)
      return
    }
    const update = (): void => {
      const rect = container.getBoundingClientRect()
      setBounds({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [container])

  if (!mounted) return null
  return createPortal(
    <div
      className={css.root}
      data-side={side}
      data-state={phase}
      style={bounds === null ? undefined : {
        left: bounds.left,
        top: bounds.top,
        right: 'auto',
        bottom: 'auto',
        width: bounds.width,
        height: bounds.height,
      }}
    >
      <div className={css.mask} onClick={() => onOpenChange?.(false)} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={css.panel}
        onAnimationEnd={(event) => {
          // 只认面板自己的动画结束（子元素的动画也会冒泡上来）。
          if (event.target !== event.currentTarget) return
          if (phase === 'closed') setMounted(false)
        }}
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
