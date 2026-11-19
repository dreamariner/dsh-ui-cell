// Input: single-line text input atom (源自 DSH 官方 ui-primitives，类名 duc- 化)。
//
// 上游来源：packages/client/ui-primitives/src/Input.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、icon 槽位、原生属性透传与 ref 全部照抄官方实现。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Input } from './input.tsx'
//   <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="搜索记忆…" />
//   <Input value={text} onChange={(event) => setText(event.target.value)} icon={<IconSearchOutlineRegular size={13} />} />
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './input.css'

/**
 * Render a text input with an optional leading icon.
 * @param props.icon - optional 16px leading icon node.
 * @param ref - the native input, cleared when it unmounts.
 * @returns wrapper span containing the native input; input attributes pass through.
 */
export const Input = forwardRef<HTMLInputElement, {
  icon?: ReactNode
  className?: string
} & InputHTMLAttributes<HTMLInputElement>>(function Input({ icon, className, ...rest }, ref) {
  return (
    <span className={clsx(css.wrap, className)}>
      {icon != null && <span className={css.icon}>{icon}</span>}
      <input ref={ref} className={css.input} {...rest} />
    </span>
  )
})
