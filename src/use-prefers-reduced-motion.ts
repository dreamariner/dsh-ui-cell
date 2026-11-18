// use-prefers-reduced-motion.ts：系统「减少动态效果」开关的订阅（共享行为模块）。
//
// 为什么独立成条目：带出场动画的组件都要在「样式把动画关掉」时自己收尾 ——
// 样式关掉动画就没有 animationend 事件，组件侧不卸载就会在屏幕上留下残骸
// （sheet 的面板会赖着不走；disclosure-row 的内容会留在 DOM 里）。
// sheet 与 disclosure-row 各写一份同样的实现，复制两份就会漂，故抽成共享条目。
import { useEffect, useState } from 'react'

/**
 * 系统是否开启了「减少动态效果」。
 * @returns 开启时为 true（组件应跳过动画并直接到位）
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = (): void => { setReduced(query.matches) }
    sync()
    query.addEventListener('change', sync)
    return () => { query.removeEventListener('change', sync) }
  }, [])
  return reduced
}
