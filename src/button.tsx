// Button: token-styled button atom（源自 DSH 官方 ui-primitives，类名 duc- 化）。
//
// 上游来源：packages/client/ui-primitives/src/Button.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// 保真说明：DOM 结构、variant/size 枚举、原生属性透传与 ref 全部照抄官方实现；
// 唯一改动是类名前缀（.button → .duc-button 等，见 add 脚本的前缀化规则）。
// 样式只引用 --dsw-alias-* / --dsw-radius-* token（DSH 插件开发规范）。

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './button.css'

/** Visual variant, each backed by the --dsw-alias-button-* token family. */
export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'toolbar'

type ButtonProps = {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  icon?: ReactNode
  className?: string | undefined
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Render a button.
 * @param props.variant - visual family (default 'ghost'); outlined buttons use a DPR-aware inset stroke.
 * @param props.size - 'md' 36px control with 12px corners or 'sm' 28px control with 8px corners.
 * @param props.icon - optional leading 16px icon node.
 * @param ref - native button for focus management and overlay anchors.
 * @returns the button element; native button attributes pass through.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'ghost', size = 'md', icon, className, children, ...rest
}, ref) {
  return (
    <button ref={ref} type="button" className={clsx(css.button, css[variant], css[size], className)} {...rest}>
      {icon != null && <span className={css.icon}>{icon}</span>}
      {children}
    </button>
  )
})
