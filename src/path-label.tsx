// PathLabel: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/PathLabel.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** A single-line file path whose trailing characters remain visible in narrow toolbars. */
import { useLayoutEffect, useRef, type HTMLAttributes } from 'react'
import clsx from 'clsx'
import { pathPartsOf } from './path-parts.ts'
import css from './path-label.css'

/**
 * Render subdued directories and a primary filename, with the complete path on hover.
 * Fitting text is left-aligned; overflow clips and fades at the left edge.
 * The fade updates on path changes and, when ResizeObserver is available, size changes.
 * @param props - File path and attributes for its outer span; callers own toolbar spacing.
 * @returns the path label.
 */
export function PathLabel({ path, className, ...attributes }: {
  path: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'title'>) {
  const boxRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const { directory, name } = pathPartsOf(path)
  useLayoutEffect(() => {
    // Both spans mount unconditionally before this layout effect runs.
    const outer = boxRef.current as HTMLSpanElement
    const inner = textRef.current as HTMLSpanElement
    const apply = (): void => {
      outer.toggleAttribute('data-path-clipped', inner.offsetWidth > outer.clientWidth)
    }
    apply()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(apply)
    observer?.observe(outer)
    observer?.observe(inner)
    return () => { observer?.disconnect() }
  }, [path])
  return (
    <span {...attributes} ref={boxRef} className={clsx(css.path, className)} title={path} data-path-label>
      <span ref={textRef} className={css.text}>
        {directory !== '' && <span className={css.directory}>{directory}</span>}
        <span className={css.name}>{name}</span>
      </span>
    </span>
  )
}
