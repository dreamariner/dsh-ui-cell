// ShortcutKeys: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/ShortcutKeys.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** Shared shortcut keycaps; callers supply the effective platform presentation. */
import css from './shortcut-keys.css'
import clsx from 'clsx'

/**
 * Render one command's keycaps without owning binding defaults or localized copy.
 * @param props - effective key labels, presentation variant and optional interaction styling.
 * @returns unboxed keys by default, or tooltip keycaps with plus-separated combinations grouped together.
 */
export function ShortcutKeys({ keys, variant = 'plain', className }: { keys: readonly string[]; variant?: 'plain' | 'tooltip'; className?: string | undefined }) {
  return <span className={clsx(css.keys, variant === 'tooltip' && css.tooltip, variant === 'tooltip' && keys.includes('+') && css.joined, className)}>{keys.map((key, index) => <kbd key={index} className={key === '+' ? css.separator : css.key}>{key}</kbd>)}</span>
}
