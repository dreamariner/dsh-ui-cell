// input-otp：本仓自有组件（功能对齐 shadcn input-otp，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { InputOtp } from './input-otp.tsx'
//   <InputOtp length={6} value={value} onChange={setValue}
//   onComplete={(code) => console.log(code)} />
//   props：length / value / defaultValue / onChange / onComplete / disabled / className / ariaLabel
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, useRef, useState } from 'react'
import clsx from 'clsx'
import css from './input-otp.css'

export interface InputOtpProps {
  /** 格子数（验证码长度）。 */
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

/** 一次性验证码输入：单隐形 input 承接键入，格子只是可视化。 */
export const InputOtp = forwardRef<HTMLInputElement, InputOtpProps>(
  ({ length = 6, value: valueProp, defaultValue = '', onChange, onComplete, disabled = false, className, ariaLabel = '验证码' }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue)
    const value = (valueProp ?? uncontrolled).slice(0, length)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const emit = (next: string) => {
      setUncontrolled(next)
      onChange?.(next)
      if (next.length === length) onComplete?.(next)
    }
    return (
      <div
        className={clsx(css.root, disabled && css.disabled)}
        onClick={() => inputRef.current?.focus()}
        data-length={length}
      >
        {Array.from({ length }, (_, index) => (
          <span
            key={index}
            data-filled={(index < value.length) || undefined}
            data-active={index === value.length || undefined}
            className={css.cell}
            aria-hidden="true"
          >
            {value[index] ?? ''}
          </span>
        ))}
        <input
          ref={(node) => { inputRef.current = node; if (typeof ref === 'function') ref(node); else if (ref !== null && typeof ref === 'object') ref.current = node }}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={ariaLabel}
          disabled={disabled}
          value={value}
          className={css.input}
          onChange={(event) => {
            // 非数字一律剥掉（\D = 非数字字符类；此前误写成 /D/ 只剥字面字母 D，
            // 字母与符号都能混进验证码 —— 实测 a1b2 原样进格，issue 022 顺带修）
            const digits = event.target.value.replace(/\D/g, '').slice(0, length)
            emit(digits)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              event.preventDefault()
              emit(value.slice(0, -1))
            }
          }}
        />
      </div>
    )
  },
)
InputOtp.displayName = 'InputOtp'
