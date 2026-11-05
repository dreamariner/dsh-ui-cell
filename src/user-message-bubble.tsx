// UserMessageBubble: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/UserMessageBubble.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** Shared user-message background, typography, and content inset. */
import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'
import css from './user-message-bubble.css'

/** Native div attributes for user-authored message content. */
export type UserMessageBubbleProps = ComponentPropsWithoutRef<'div'>

/**
 * Render user-style message content without row placement or actions.
 * @param props - Native div attributes and the caller-owned content.
 * @returns A theme-aware message surface that wraps its content.
 */
export function UserMessageBubble({ className, ...props }: UserMessageBubbleProps) {
  return <div {...props} className={clsx(css.bubble, className)} />
}
