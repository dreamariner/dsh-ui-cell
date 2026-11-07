// button-group：本仓自有组件（功能对齐 shadcn button-group，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './button-group.css'

/** 把多个按钮/输入组合成一条控件带（共享边框语义的排版容器）。 */
export const ButtonGroup = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="group" className={clsx(css.buttonGroup, className)} {...props} />
  ),
)
ButtonGroup.displayName = 'ButtonGroup'
