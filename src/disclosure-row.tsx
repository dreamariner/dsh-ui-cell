// DisclosureRow: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/DisclosureRow.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
//
// ⚠ **本仓侧改动（2026-11-18 起，issue 015）**：内容区的展开收起改为相位状态机。
//   上游是 `{open && children}`：内容瞬间挂载/卸载 —— 展开时「啪」地出现、收起时「啪」地消失，
//   观感硬；本仓自有的 Accordion / Collapsible 走的是 grid-template-rows 过渡，手感对不上。
//   这里沿用 issue 008 的相位状态机（sheet 同一套范式）：
//     open  → phase='open'（内容展开 + 淡入）
//     close → phase='closed'，DOM 留着播出场动画，播完（animationend）才卸载
//   相位切换在渲染期做（React 官方「按 props 调整 state」写法）。
//   偏离登记在 registry 的 upstream 字段：DSH 升级 re-diff 时保留本仓这段。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { DisclosureRow } from './disclosure-row.tsx'
//   <DisclosureRow icon={…} title="记忆条目" open={open} expandable
//   onToggle={() => setOpen(!open)}>
//   props：icon / title / open / expandable / onToggle / running / expandOnRowClick / previewChevron / keepContentWhenOpen / collapsedContent / headerAccessory / children / className / rowClassName / contentClassName / contentLayoutClassName / leadingClassName / chevronClassName / titleClassName
// ────────────────────────────────────────────────────────────────────────

import { memo, useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { IconChevronDownOutlineRegular, IconChevronUpOutlineRegular } from './icons.tsx'
import { TextShimmer } from './text-shimmer.tsx'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion.ts'
import css from './disclosure-row.css'

/**
 * 出场兜底时长（毫秒）。
 *
 * 正常路径是 animationend 触发卸载；这个定时器只兜底「动画没跑」的情况
 * （样式被覆盖、元素不可见）。取值要大于本组件的过渡时长（200ms），
 * 否则它会在动画播完前先到，把出场动画截断。
 */
const LEAVE_FALLBACK_MS = 400

/** Shared 24px process row: tertiary text and icons, secondary on hover. */
export interface DisclosureRowProps {
  icon: ReactNode
  title: string
  open: boolean
  expandable: boolean
  onToggle: () => void
  /** Animate the complete header while its owning operation is running. */
  running?: boolean | undefined
  /** Makes the title row the disclosure target; with an accessory, it shrinks to its content width. */
  expandOnRowClick?: boolean | undefined
  /** Replaces the collapsed icon with a chevron while the row is hovered. */
  previewChevron?: boolean | undefined
  /** Keeps `collapsedContent` inline while open. */
  keepContentWhenOpen?: boolean | undefined
  collapsedContent?: ReactNode
  /** Independent action beside the title, outside the disclosure target and shimmer. */
  headerAccessory?: ReactNode
  children?: ReactNode
  className?: string | undefined
  rowClassName?: string | undefined
  /** Sizing class for the header text area, beside the leading icon. */
  contentClassName?: string | undefined
  /** Layout class shared by the header text and its decorative copy. */
  contentLayoutClassName?: string | undefined
  leadingClassName?: string | undefined
  chevronClassName?: string | undefined
  titleClassName?: string | undefined
}

/**
 * Render one disclosure header and its controlled expanded content.
 * Shallow prop comparison requires stable callbacks and React nodes to skip unchanged renders.
 * @param props - Visual content, controlled state, and interaction policy.
 * @returns the disclosure row.
 */
export const DisclosureRow = memo(function DisclosureRow({
  icon,
  title,
  open,
  expandable,
  onToggle,
  running = false,
  expandOnRowClick = false,
  previewChevron = expandable,
  keepContentWhenOpen = false,
  collapsedContent,
  headerAccessory,
  children,
  className,
  rowClassName,
  contentClassName,
  contentLayoutClassName,
  leadingClassName,
  chevronClassName,
  titleClassName,
}: DisclosureRowProps) {
  const reducedMotion = usePrefersReducedMotion()
  // mounted 管 DOM 在不在，phase 管播哪段动画（写进 data-state）。
  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<'open' | 'closed'>(open ? 'open' : 'closed')
  const [prevOpen, setPrevOpen] = useState(open)

  // 渲染期同步（React 官方「按 props 调整 state」写法）：
  // open 变化的同一次提交里就切相位、挂载 DOM。
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setMounted(true)
      setPhase('open')
    } else if (reducedMotion) {
      // 降级路径：不要动画，直接卸载（否则会留一个收不掉的残骸在 DOM 里）。
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

  const rowExpands = expandable && expandOnRowClick
  const toggleFromLeading = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onToggle()
  }
  const toggleFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!rowExpands || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onToggle()
  }
  const collapsedLeading = previewChevron
    ? (
      <>
        <span className={css.iconIdle}>{icon}</span>
        <IconChevronDownOutlineRegular className={clsx(chevronClassName, css.chevronHover)} />
      </>
    )
    : icon
  const leading = open
    ? <IconChevronUpOutlineRegular className={chevronClassName} />
    : collapsedLeading

  return (
    <div className={clsx(css.root, className)} data-open={open || undefined}>
      <div className={css.header} data-disclosure-header data-has-accessory={!!headerAccessory || undefined}>
        <div
          className={clsx(css.row, rowClassName)}
          data-disclosure-row
          data-expandable={rowExpands || undefined}
          role={rowExpands ? 'button' : undefined}
          tabIndex={rowExpands ? 0 : undefined}
          aria-expanded={rowExpands ? open : undefined}
          onClick={rowExpands ? onToggle : undefined}
          onKeyDown={rowExpands ? toggleFromKeyboard : undefined}
        >
          {expandable && !rowExpands ? (
            <button
              type="button"
              className={clsx(css.leading, leadingClassName)}
              aria-label={title}
              aria-expanded={open}
              onClick={toggleFromLeading}
            >
              {leading}
            </button>
          ) : (
            <span className={clsx(css.leading, leadingClassName)}>
              {leading}
            </span>
          )}
          <TextShimmer active={running} className={contentClassName} contentClassName={contentLayoutClassName}>
            <TextShimmer className={clsx(css.title, titleClassName)}>{title}</TextShimmer>
            {(keepContentWhenOpen || !open) && collapsedContent}
          </TextShimmer>
        </div>
        {headerAccessory}
      </div>
      {mounted ? (
        <div
          className={css.content}
          data-state={phase}
          onAnimationEnd={(event) => {
            // 只认内容区自己的动画结束（子元素的动画也会冒泡上来）。
            if (event.target !== event.currentTarget) return
            if (phase === 'closed') setMounted(false)
          }}
        >
          <div className={css.contentInner}>{children}</div>
        </div>
      ) : null}
    </div>
  )
})
