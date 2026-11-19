// toggle：本仓自有组件（功能对齐 shadcn toggle，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Toggle } from './toggle.tsx'
//   <Toggle pressed={on} onPressedChange={setOn}>加粗</Toggle>
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './toggle.css'

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 受控按下态。 */
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: 'default' | 'ghost'
}

/** 按下态按钮（aria-pressed）。 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ pressed: pressedProp, defaultPressed = false, onPressedChange, variant = 'default', className, onClick, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultPressed)
    const pressed = pressedProp ?? uncontrolled
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-variant={variant}
        data-state={pressed ? 'on' : 'off'}
        className={clsx(css.toggle, className)}
        onClick={(event) => {
          const next = !pressed
          setUncontrolled(next)
          onPressedChange?.(next)
          onClick?.(event)
        }}
        {...props}
      />
    )
  },
)
Toggle.displayName = 'Toggle'
