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
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Sheet } from './sheet.tsx'
//   <Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
//   内容
//   props：open / onOpenChange / side / title / footer / width / radius / container / children
// ────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './sheet.css'
import { useModalLayer } from './use-modal-layer.ts'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion.ts'
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
   * 面板圆角（覆盖「靠内容侧」两角的 --dsw-radius-panel，贴边侧仍是直角）。
   * 数字按 px；字符串原样引用（可传 token：'var(--dsw-radius-lg)'）。
   * 缺省 = 主题档位（28px）。小屏抽屉 / 局部容器里 28px 嫌大时用这个收小。
   */
  radius?: number | string
  /**
   * 限定容器（可选）：面板**portal 到这个元素内部**，并只在它占的范围内展开。
   *
   * ⚠ 典型用法：插件面板里的详情抽屉要限制在**自己那个页签**里 ——
   *   ① 不覆盖整个窗口（对话区、别的侧栏照常用）；
   *   ② 页签被宿主切走 / 隐藏时，抽屉跟着一起消失（它在这个页签的 DOM 子树里）。
   *   缺省 = 整个视口（portal 到 document.body）。
   *
   * 实现：DOM 挂到容器里，但**定位仍用视口坐标**（position: fixed + 量容器的矩形）——
   *   若改用 absolute，容器内部滚动时抽屉会跟着滚走（它是滚动内容的一部分）。
   */
  container?: HTMLElement | null
  children: ReactNode
}

/** 各方向「靠内容侧」的两个圆角角位（贴边侧是直角，不在内）。 */
const RADIUS_CORNERS: Record<SheetSide, readonly ('borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomLeftRadius' | 'borderBottomRightRadius')[]> = {
  right: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
  left: ['borderTopRightRadius', 'borderBottomRightRadius'],
  bottom: ['borderTopLeftRadius', 'borderTopRightRadius'],
  top: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
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
 * 系统「减少动态效果」开关：见共享条目 use-prefers-reduced-motion。
 *
 * 开启后样式表把动画关掉（animation: none），也就不会有 animationend 事件，
 * 组件侧必须自己判断：这时关面板直接卸载，不要留一个不动的面板在屏幕上。
 */

/** 侧滑/底滑面板：portal + modal 层级栈（Escape 只归最上层），mask 点击关闭。 */
export function Sheet({
  open, onOpenChange, side = 'right', title, footer, width, radius, container, children,
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
  // 容器给了就挂进容器（DOM 归属跟着页签走：页签隐藏 / 切走，抽屉一起消失），
  // 没给就挂 document.body（整个视口）。
  const target = container ?? document.body
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
        style={(() => {
          // inline style 只放「消费端给了的」覆盖项：宽度（侧滑时）与圆角（只覆盖
          // 靠内容侧的两角 —— inline 长属性优先于样式表的 side 规则，贴边侧不受影响）。
          const style: Record<string, string> = {}
          if (width !== undefined && (side === 'right' || side === 'left')) {
            style.width = typeof width === 'number' ? `${width}px` : width
          }
          if (radius !== undefined) {
            const value = typeof radius === 'number' ? `${radius}px` : radius
            for (const corner of RADIUS_CORNERS[side]) style[corner] = value
          }
          return Object.keys(style).length > 0 ? style : undefined
        })()}
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
    target,
  )
}
