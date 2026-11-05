// toggle-group：kit 自有组件（功能对齐 shadcn toggle-group，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './toggle-group.css'

export interface ToggleGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  type?: 'single' | 'multiple'
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  options: { value: string; label: ReactNode }[]
}

/** 互斥或多选的切换组（segmented 的按下态版本）。 */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ type = 'single', value: valueProp, defaultValue = [], onValueChange, options, className, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue)
    const value = valueProp ?? uncontrolled
    const select = (option: string) => {
      const next = value.includes(option)
        ? value.filter((v) => v !== option)
        : type === 'single' ? [option] : [...value, option]
      setUncontrolled(next)
      onValueChange?.(next)
    }
    return (
      <div ref={ref} role="group" className={clsx(css.group, className)} {...props}>
        {options.map((option) => {
          const on = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              data-state={on ? 'on' : 'off'}
              className={css.item}
              onClick={() => select(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  },
)
ToggleGroup.displayName = 'ToggleGroup'
