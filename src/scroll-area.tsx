// scroll-area：本仓自有组件（功能对齐 shadcn scroll-area，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './scroll-area.css'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
}

/** 细滚动条容器：滚动条样式沿用宿主 scrollbar token。 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ orientation = 'vertical', className, ...props }, ref) => (
    <div ref={ref} data-orientation={orientation} className={clsx(css.scrollArea, className)} {...props} />
  ),
)
ScrollArea.displayName = 'ScrollArea'
