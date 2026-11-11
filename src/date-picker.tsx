// date-picker：本仓自有组件（功能对齐 shadcn date-picker，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './date-picker.css'
import { Calendar } from './calendar.tsx'
import { Popover } from './popover.tsx'
import { IconChevronDownOutlineRegular } from './icons.tsx'

export interface DatePickerProps {
  /** 粒度：day 日（缺省，值 YYYY-MM-DD）| month 月（值 YYYY-MM）。 */
  mode?: 'day' | 'month'
  /** 受控值：day 为 YYYY-MM-DD；month 为 YYYY-MM。 */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  /** 禁用判定：day 模式收到具体日期；month 模式收到该月 1 日（只看年月）。 */
  disabled?: (date: Date) => boolean
  className?: string
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

const toIso = (date: Date, mode: 'day' | 'month'): string => {
  if (mode === 'month') return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

const fromIso = (text: string, mode: 'day' | 'month'): Date | undefined => {
  if (mode === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(text)
    return match === null || Number(match[2]) < 1 || Number(match[2]) > 12
      ? undefined
      : new Date(Number(match[1]), Number(match[2]) - 1, 1)
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  return match === null ? undefined : new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** 日期 / 月份选择：输入框 + Popover 月历 / 年格（复用 popover/calendar）。 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ mode = 'day', value: valueProp, defaultValue = '', onChange, placeholder, disabled, className }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue)
    const value = valueProp ?? uncontrolled
    const selected = fromIso(value, mode)
    const fallbackPlaceholder = mode === 'month' ? '选择月份' : '选择日期'
    return (
      <Popover
        side="bottom"
        align="start"
        trigger={
          <button ref={ref} type="button" data-filled={(value !== '') || undefined} className={clsx(css.trigger, className)}>
            <span className={value === '' ? css.placeholder : css.value}>{value === '' ? (placeholder ?? fallbackPlaceholder) : value}</span>
            <IconChevronDownOutlineRegular size={14} className={css.chevron} />
          </button>
        }
        content={
          <Calendar
            mode={mode}
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            onSelect={(date) => { const next = toIso(date, mode); setUncontrolled(next); onChange?.(next) }}
          />
        }
      />
    )
  },
)
DatePicker.displayName = 'DatePicker'
