// Select: styled native <select>（kit 自有组件，非官方复制）。
//
// 为什么不用官方 primitive：官方 ui-primitives 没有 Select 原子（只有 SegmentedControl
// 与 Menu），第三方插件要下拉筛选只能写裸 <select>，样式全靠浏览器默认。
// 本组件保留原生 <select> 的语义与移动端体验（原生 picker、无障碍、键盘），
// 只把外观收敛到 DSH token 面上：边框/背景/圆角照 Input 的规范，右侧挂 chevron。
//
// 与 Input 一致：样式只引用 --dsw-alias-* / --dsw-radius-*。

import { forwardRef, type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import { IconChevronDownOutlineRegular } from './icons.tsx'
import css from './select.css'

export interface SelectOption {
  value: string
  label: string
}

export type SelectProps = {
  /** 选项列表；value 为空串时视为「不筛选」占位项。 */
  options: readonly SelectOption[]
  className?: string | undefined
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>

/**
 * Render a native select styled to the host token surface.
 * @param props.options - the options to render.
 * @param ref - the native select element.
 * @returns a wrapper span holding the select and its chevron affordance.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  options, className, ...rest
}, ref) {
  return (
    <span className={clsx(css.wrap, className)}>
      <select ref={ref} className={css.select} {...rest}>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <span aria-hidden="true" className={css.chevron}>
        <IconChevronDownOutlineRegular size={14} />
      </span>
    </span>
  )
})
