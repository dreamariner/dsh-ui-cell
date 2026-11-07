// field：本仓自有组件（功能对齐 shadcn field，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './field.css'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 关联控件的 id（渲染为 htmlFor 的 Label）。 */
  name?: string
  label?: ReactNode
  /** 辅助说明（错误优先显示）。 */
  description?: ReactNode
  /** 错误文案；存在时 Field 进入 error 态。 */
  error?: string
}

/** 表单字段壳：Label + 控件位 + Description/Error（错误优先）。 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ name, label, description, error, className, children, ...props }, ref) => (
    <div ref={ref} data-invalid={error !== undefined || undefined} className={clsx(css.field, className)} {...props}>
      {label !== undefined && (
        <label className={css.label} htmlFor={typeof name === 'string' ? name : undefined}>{label}</label>
      )}
      {children}
      {error !== undefined
        ? <p className={css.error} role="alert">{error}</p>
        : description !== undefined && <p className={css.description}>{description}</p>}
    </div>
  ),
)
Field.displayName = 'Field'
