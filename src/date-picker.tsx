// date-picker：kit 自有组件（功能对齐 shadcn date-picker，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './date-picker.css'
import { Calendar } from './calendar.tsx'
import { Popover } from './popover.tsx'
import { IconChevronDownOutlineRegular } from './icons.tsx'

export interface DatePickerProps {
  /** 受控值（YYYY-MM-DD）。 */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
}

const toIso = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

const fromIso = (text: string): Date | undefined => {
  const match = /^(d{4})-(d{2})-(d{2})$/.exec(text)
  return match === null ? undefined : new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** 日期选择：输入框 + Popover 月历（复用 popover/calendar）。 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value: valueProp, defaultValue = '', onChange, placeholder = '选择日期', disabled, className }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue)
    const value = valueProp ?? uncontrolled
    const selected = fromIso(value)
    return (
      <Popover
        side="bottom"
        align="start"
        trigger={
          <button ref={ref} type="button" data-filled={(value !== '') || undefined} disabled={disabled !== undefined} className={clsx(css.trigger, className)}>
            <span className={value === '' ? css.placeholder : css.value}>{value === '' ? placeholder : value}</span>
            <IconChevronDownOutlineRegular size={14} className={css.chevron} />
          </button>
        }
        content={
          <Calendar
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            onSelect={(date) => { setUncontrolled(toIso(date)); onChange?.(toIso(date)) }}
          />
        }
      />
    )
  },
)
DatePicker.displayName = 'DatePicker'
