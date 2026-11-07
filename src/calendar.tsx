// calendar：本仓自有组件（功能对齐 shadcn calendar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './calendar.css'
import { IconChevronDownOutlineRegular } from './icons.tsx'

export interface CalendarProps {
  /** 受控选中日期（本地时区，仅日期部分有意义）。 */
  selected?: Date
  onSelect?: (date: Date) => void
  /** 展示的月份（受控）；缺省内部维护。 */
  month?: Date
  defaultMonth?: Date
  /** 周起始（0=周日，1=周一），默认 1。 */
  weekStartsOn?: 0 | 1
  weekdayLabels?: readonly string[]
  disabled?: (date: Date) => boolean
  className?: string
}

const DEFAULT_WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'] as const

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 月历网格：受控/非受控月份，今日与选中态，禁用判定回调。 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ selected, onSelect, month: monthProp, defaultMonth, weekStartsOn = 1, weekdayLabels = DEFAULT_WEEKDAYS, disabled, className }, ref) => {
    const [internalMonth, setInternalMonth] = useState(() => {
      const base = monthProp ?? defaultMonth ?? selected ?? new Date()
      return new Date(base.getFullYear(), base.getMonth(), 1)
    })
    const month = monthProp ?? internalMonth
    const move = (delta: number) => {
      const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
      setInternalMonth(next)
    }
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    // 本地化的「列序」：weekStartsOn=1 时周一起
    const offset = (firstDay.getDay() - weekStartsOn + 7) % 7
    const cells: (Date | undefined)[] = []
    for (let i = 0; i < offset; i += 1) cells.push(undefined)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, monthIndex, day))
    while (cells.length % 7 !== 0) cells.push(undefined)
    const orderedWeekdays = Array.from({ length: 7 }, (_, i) => weekdayLabels[(i + weekStartsOn) % 7])
    const today = startOfDay(new Date())
    return (
      <div ref={ref} className={clsx(css.calendar, className)}>
        <div className={css.header}>
          <button type="button" aria-label="上个月" className={css.nav} onClick={() => move(-1)}>
            <IconChevronDownOutlineRegular size={14} className={css.chevronRight} />
          </button>
          <div className={css.monthLabel}>{year} 年 {monthIndex + 1} 月</div>
          <button type="button" aria-label="下个月" className={css.nav} onClick={() => move(1)}>
            <IconChevronDownOutlineRegular size={14} />
          </button>
        </div>
        <div className={css.grid} role="grid">
          {orderedWeekdays.map((label) => (
            <div key={label} className={css.weekday} role="columnheader">{label}</div>
          ))}
          {cells.map((date, index) =>
            date === undefined
              ? <div key={'x' + String(index)} className={css.cell} aria-hidden="true" />
              : (
                <button
                  key={date.getTime()}
                  type="button"
                  role="gridcell"
                  aria-selected={selected !== undefined && sameDay(date, selected)}
                  data-today={sameDay(date, today) || undefined}
                  data-selected={(selected !== undefined && sameDay(date, selected)) || undefined}
                  disabled={disabled?.(date)}
                  className={css.cell}
                  onClick={() => onSelect?.(startOfDay(date))}
                >
                  {date.getDate()}
                </button>
              ),
          )}
        </div>
      </div>
    )
  },
)
Calendar.displayName = 'Calendar'
