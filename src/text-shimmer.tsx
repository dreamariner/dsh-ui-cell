// TextShimmer: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/TextShimmer.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
//
// 用法提醒（2026-11-18，issue 017；不改官方行为，只是把坑写在这里）：
// 微光层是「文字色的一份半透明副本」叠在真文字上，颜色取自 `--dsw-alias-label-shimmer`。
// 这个 token 的默认值是**绝对值**（亮色 30% 黑、暗色 45% 白），**不随被作用的文字走**，
// 压在正文色（label-primary）上就是同色叠加 —— 看得见动画在跑，但肉眼看不出在动。
// 要看到效果，给它一个跟底色有对比的值：
//
//   <div style={{ '--dsw-alias-label-shimmer': 'var(--dsw-alias-label-secondary)' }}>
//     <TextShimmer active>正在生成…</TextShimmer>
//   </div>
//
// DSH 应用自己的跑动状态就是这么改这个 token 的（ChatView.module.css 的 `.running`
// 把它指向 `--dsw-alias-label-deep-diving-shimmer`）。
/** Text activity animation shared by a row and its nested text fragments. */
import { createContext, memo, useContext, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './text-shimmer.css'

const DecorativeCopy = createContext<boolean | undefined>(undefined)

/** Text and activity supplied by the owning row. */
export interface TextShimmerProps {
  /** Text or presentational children with text in nested TextShimmer instances. No effects or element ids. */
  children: ReactNode
  /** Whether to animate; nested instances share the containing row's activity. */
  active?: boolean | undefined
  className?: string | undefined
  /** Layout class applied equally to the base and decorative content. */
  contentClassName?: string | undefined
}

function TextContent({ children, className }: Pick<TextShimmerProps, 'children' | 'className'>) {
  const decorative = useContext(DecorativeCopy)
  const generated = decorative === true && typeof children === 'string'
  return (
    <span className={clsx(css.text, className)} data-shimmer-text={generated ? children : undefined}>
      {generated ? null : children}
    </span>
  )
}

/**
 * Render text with one shared highlight while retaining selectable, accessible content.
 * Nested instances inherit the outer animation. Keep icons outside; mark decorative
 * separators with data-shimmer-decoration so their background follows the highlight.
 * Active children also render in an inert, clipped decoration; supply only presentation.
 * @param props - localized text, running state, and owner styling.
 * @returns retained text and its optional decorative highlight.
 */
export const TextShimmer = memo(function TextShimmer({ children, active = false, className, contentClassName }: TextShimmerProps) {
  const decorative = useContext(DecorativeCopy)
  if (decorative !== undefined) return <TextContent className={className}>{children}</TextContent>
  const content = typeof children === 'string' ? <TextContent>{children}</TextContent> : children
  return (
    <span className={clsx(css.root, className)} data-shimmer={active || undefined}>
      <DecorativeCopy.Provider value={false}>
        <span className={clsx(css.content, contentClassName)}>{content}</span>
      </DecorativeCopy.Provider>
      {active && (
        // React 18 forwards inert as an empty string; a boolean is dropped.
        <span className={css.decoration} aria-hidden="true" {...{ inert: '' }}>
          <span className={css.sweep}>
            <DecorativeCopy.Provider value>
              <span className={clsx(css.content, css.highlight, contentClassName)}>{content}</span>
            </DecorativeCopy.Provider>
          </span>
        </span>
      )}
    </span>
  )
})
