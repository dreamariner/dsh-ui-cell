// label：本仓自有组件（功能对齐 shadcn label，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Label } from './label.tsx'
//   <Label htmlFor="demo-input">记忆标题</Label>
// ────────────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './label.css'

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={clsx(css.label, className)} {...props} />
  ),
)
Label.displayName = 'Label'
