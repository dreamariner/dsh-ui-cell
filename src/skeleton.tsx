// skeleton：本仓自有组件（功能对齐 shadcn skeleton，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Skeleton } from './skeleton.tsx'
//   <Skeleton style={{ width: 220, height: 12 }} />
// ────────────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './skeleton.css'

export const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={clsx(css.skeleton, className)} {...props} />
  ),
)
Skeleton.displayName = 'Skeleton'
