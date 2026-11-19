// Checkbox: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/Checkbox.tsx @ dsh v0.2.2-rc.5 (9c2670d3bc)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** Controlled native checkbox with a caller-owned visible and accessible label. */
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Checkbox } from './checkbox.tsx'
//   <Checkbox checked={a} onChange={setA} label="启用自动整理" />
//   props：checked / onChange / label / disabled / title / className / modalAutofocus
// ────────────────────────────────────────────────────────────────────────

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
 * @param props.modalAutofocus - designate the input for the owning Modal's initial focus without React autoFocus.
 * @returns the label containing its checkbox.
 */
export function Checkbox({ checked, onChange, label, disabled = false, title, className, modalAutofocus = false }: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  title?: string | undefined
  className?: string | undefined
  modalAutofocus?: boolean
}) {
  return (
    <label className={clsx(css.checkbox, className)} title={title}>
      <input type="checkbox" checked={checked} disabled={disabled}
        data-modal-autofocus={modalAutofocus || undefined}
        onChange={(event) => { onChange(event.target.checked) }} />
      <span>{label}</span>
    </label>
  )
}
