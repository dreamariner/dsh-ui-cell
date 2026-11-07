// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/useViewportHighlighting.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/useViewportHighlighting.ts → 本仓路径：markdown-viewport-highlighting.ts
//
// 本仓侧唯一偏离（2026-11-06）：`target` 的类型从官方的 `RefObject<Element>` 放宽成
// `RefObject<Element | null>`。原因：React 19 的 `useRef<T>(null)` 返回
// `RefObject<T | null>`，官方签名在 React 19 的消费端**编译不过**
// （RefObject<HTMLDivElement | null> 不能传给 RefObject<Element>）。
// DSH 官方自己锁 React 18 所以没暴露，第三方插件用 React 19 就会撞上。
// 放宽后 React 18 与 19 都能编译，行为不变。
import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { supportsHighlighting } from './code-highlighting.ts'

const noop = (): void => {}

/** One document-wide observer; activated elements leave it permanently. */
class HighlightViewport {
  private observer: IntersectionObserver | undefined
  private readonly activators = new Map<Element, () => void>()

  observe(element: Element, activate: () => void): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      activate()
      return noop
    }
    this.observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const current = this.activators.get(entry.target)
        /* v8 ignore next -- the observer reports only elements still registered with it. */
        if (current === undefined) continue
        this.activators.delete(entry.target)
        this.observer?.unobserve(entry.target)
        current()
      }
      this.releaseEmptyObserver()
    })
    this.activators.set(element, activate)
    this.observer.observe(element)
    return () => {
      this.activators.delete(element)
      this.observer?.unobserve(element)
      this.releaseEmptyObserver()
    }
  }

  private releaseEmptyObserver(): void {
    if (this.activators.size > 0) return
    this.observer?.disconnect()
    this.observer = undefined
  }
}

const highlightViewport = new HighlightViewport()

/**
 * Activate one supported code surface when it first intersects the viewport.
 * Activation lasts for the component lifetime; browsers without
 * IntersectionObserver activate immediately.
 * @param target - Code surface whose plain rendering reserves its geometry.
 * @param lang - Optional language hint.
 * @returns Whether this component may build highlighted output.
 */
export function useViewportHighlighting(
  target: RefObject<Element | null>,
  lang: string | undefined,
): boolean {
  const supported = supportsHighlighting(lang)
  const [activated, setActivated] = useState(false)
  const activate = useCallback(() => { setActivated(true) }, [])

  useEffect(() => {
    if (activated || !supported) return
    const element = target.current
    /* v8 ignore next -- React attaches the host ref before running effects. */
    if (element === null) return
    return highlightViewport.observe(element, activate)
  }, [activate, activated, supported, target])

  return activated && supported
}
