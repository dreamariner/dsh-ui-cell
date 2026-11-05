// Pill: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/Pill.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
// Pill: capsule at the 24px text-line size, selectable when given `onClick`
// (view switcher tabs, filters) and a static span otherwise — TerminalBlock's
// exit status is the read-only case. The 11px read-only badge is `Tag`; size
// separates the two as much as interactivity does.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import css from './pill.css'

/**
 * Render a pill chip. Interactive when onClick is supplied (renders a button);
 * otherwise a static span.
 * @param props.active - selected/active visual state.
 * @returns pill element.
 */
export function Pill({ active = false, className, children, onClick, ...rest }: {
  active?: boolean
  // `| undefined` so a caller can forward an optional class straight through
  // under exactOptionalPropertyTypes (a CSS-module lookup is string|undefined).
  className?: string | undefined
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  if (!onClick) {
    return <span className={clsx(css.pill, active && css.active, className)}>{children}</span>
  }
  return (
    <button
      type="button"
      className={clsx(css.pill, css.interactive, active && css.active, className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}
