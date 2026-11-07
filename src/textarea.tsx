// Textarea: multi-line text input（本仓自有组件，非官方复制）。
//
// 官方 ui-primitives 用 InlineEditor 处理多行内联编辑，但那是「内联编辑态」的完整控件
// （含提交/取消与键盘流），不适合「面板里的说明/备注输入框」这种轻量场景。
// 本组件是纯受控多行输入：token 化的边框与背景，尺寸由调用方给（默认 3 行）。

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import css from './textarea.css'

export type TextareaProps = {
  className?: string | undefined
} & TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Render a token-styled multi-line text input.
 * @param ref - the native textarea element.
 * @returns the textarea element; native attributes pass through.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  className, rows = 3, ...rest
}, ref) {
  return (
    <textarea ref={ref} rows={rows} className={clsx(css.textarea, className)} {...rest} />
  )
})
