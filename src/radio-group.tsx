// radio-group：本仓自有组件（功能对齐 shadcn radio-group，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './radio-group.css'

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  options: { value: string; label: React.ReactNode }[]
  /** 竖排（默认）或横排。 */
  orientation?: 'vertical' | 'horizontal'
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value: valueProp, defaultValue, onValueChange, name, disabled = false, options, orientation = 'vertical', className, ...props }, ref) => {
    const groupName = name ?? 'radio-group'
    return (
      <div ref={ref} role="radiogroup" aria-disabled={disabled || undefined} data-orientation={orientation} className={clsx(css.group, className)} {...props}>
        {options.map((option) => (
          <label key={option.value} className={css.option}>
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={valueProp !== undefined ? valueProp === option.value : undefined}
              defaultChecked={valueProp === undefined ? defaultValue === option.value : undefined}
              disabled={disabled}
              className={css.input}
              onChange={() => onValueChange?.(option.value)}
            />
            <span className={css.dot} aria-hidden="true" />
            <span className={css.label}>{option.label}</span>
          </label>
        ))}
      </div>
    )
  },
)
RadioGroup.displayName = 'RadioGroup'
