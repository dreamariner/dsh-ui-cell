// aspect-ratio：本仓自有组件（功能对齐 shadcn aspect-ratio，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './aspect-ratio.css'

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 宽高比（宽 / 高），如 16 / 9。 */
  ratio?: number
}

/** 子元素铺满由 ratio 撑出的盒子（position absolute 契约）。 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, children, style, ...props }, ref) => (
    <div ref={ref} className={clsx(css.aspectRatio, className)} style={{ aspectRatio: String(ratio), ...style }} {...props}>
      {children}
    </div>
  ),
)
AspectRatio.displayName = 'AspectRatio'
