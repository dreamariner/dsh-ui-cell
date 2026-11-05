// slider：kit 自有组件（功能对齐 shadcn slider，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './slider.css'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

/** 原生 range 的 token 化外衣（保留原生键盘/拖拽语义，同 select 路线）。 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ value, defaultValue, onValueChange, min = 0, max = 100, step = 1, className, onChange, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={defaultValue}
      className={clsx(css.slider, className)}
      onChange={(event) => { onValueChange?.(Number(event.target.value)); onChange?.(event) }}
      {...props}
    />
  ),
)
Slider.displayName = 'Slider'
