// accordion：kit 自有组件（功能对齐 shadcn accordion，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './accordion.css'

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 同时可展开的项：single（默认）或 multiple。 */
  type?: 'single' | 'multiple'
  items: { key: string; header: ReactNode; content: ReactNode }[]
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', items, className, ...props }, ref) => {
    const [openKeys, setOpenKeys] = useState<string[]>([])
    const toggle = (key: string) => {
      setOpenKeys((prev) => {
        if (prev.includes(key)) return prev.filter((k) => k !== key)
        return type === 'single' ? [key] : [...prev, key]
      })
    }
    return (
      <div ref={ref} className={clsx(css.accordion, className)} {...props}>
        {items.map((item) => {
          const open = openKeys.includes(item.key)
          return (
            <div key={item.key} data-open={open || undefined} className={css.item}>
              <button type="button" aria-expanded={open} className={css.header} onClick={() => toggle(item.key)}>
                <svg className={css.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
                </svg>
                {item.header}
              </button>
              <div className={css.content}>
                <div className={css.contentInner}>{item.content}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  },
)
Accordion.displayName = 'Accordion'
