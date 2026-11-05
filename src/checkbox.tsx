// Checkbox: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/Checkbox.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** Controlled native checkbox with a caller-owned visible and accessible label. */

import clsx from 'clsx'
import css from './checkbox.css'

/**
 * Render a labeled checkbox with native keyboard and form semantics.
 * @param props.checked - current checked state.
 * @param props.onChange - receives the requested checked state.
 * @param props.label - localized visible and accessible label.
 * @param props.disabled - whether the control refuses changes.
 * @param props.title - optional localized hover text.
 * @param props.className - extra class for the label's placement.
 * @returns the label containing its checkbox.
 */
export function Checkbox({ checked, onChange, label, disabled = false, title, className }: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  title?: string | undefined
  className?: string | undefined
}) {
  return (
    <label className={clsx(css.checkbox, className)} title={title}>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={(event) => { onChange(event.target.checked) }} />
      <span>{label}</span>
    </label>
  )
}
