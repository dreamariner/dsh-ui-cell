// form：本仓自有组件（功能对齐 shadcn form，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。（字段壳见 field；本件只管 form 元素语义与提交期状态）
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './form.css'

export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  /** 提交期间禁用整张表单并给提交按钮 pending 语义（通过 data-pending 属性）。 */
  disableWhilePending?: boolean
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ onSubmit, disableWhilePending = false, className, ...props }, ref) => {
    const [pending, setPending] = useState(false)
    return (
      <form
        ref={ref}
        data-pending={(disableWhilePending && pending) || undefined}
        className={clsx(css.form, className)}
        onSubmit={async (event) => {
          event.preventDefault()
          if (pending) return
          if (onSubmit === undefined) return
          try {
            setPending(true)
            await onSubmit(event)
          } finally {
            setPending(false)
          }
        }}
        {...props}
      />
    )
  },
)
Form.displayName = 'Form'
