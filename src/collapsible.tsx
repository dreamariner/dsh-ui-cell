// collapsible：本仓自有组件（功能对齐 shadcn collapsible，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
//
// 展开收起动画（2026-11-18 起，issue 020）：内容区照本仓自有 Accordion 的同一套手法 ——
// 常驻 DOM + grid-template-rows 0fr↔1fr 过渡（此前是 {open && children} 瞬间挂载/卸载，
// 只转箭头不动内容；issue 015 的文档早就写了 Collapsible 走 grid 过渡，这次把代码补上）。
// 常驻挂载（Accordion 同款）而不是 sheet/disclosure-row 的相位状态机：
// 不需要卸载时序、没有「动画没播完就卸载」的兜底问题，降级也只是 transition: none。
// 代价是收起后 children 仍留在 DOM（状态保留，与 Accordion 一致），所以收起态加 inert
// （焦点不进入视觉上隐藏的内容；React 18 下 inert 要以空串转发，布尔会被丢）。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Collapsible } from './collapsible.tsx'
//   <Collapsible trigger="高级选项" open={open} onOpenChange={setOpen}>
//   内容
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './collapsible.css'

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 折叠区的触发器内容（通常一行标题）。 */
  trigger: ReactNode
  children: ReactNode
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ defaultOpen = false, open: openProp, onOpenChange, trigger, children, className, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultOpen)
    const open = openProp ?? uncontrolled
    const setOpen = (next: boolean) => { setUncontrolled(next); onOpenChange?.(next) }
    return (
      <div ref={ref} data-open={open || undefined} className={clsx(css.collapsible, className)} {...props}>
        <button type="button" aria-expanded={open} className={css.trigger} onClick={() => setOpen(!open)}>
          <svg className={css.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
          </svg>
          {trigger}
        </button>
        <div className={css.content} {...(open ? {} : { inert: '' })}>
          <div className={css.contentInner}>{children}</div>
        </div>
      </div>
    )
  },
)
Collapsible.displayName = 'Collapsible'
