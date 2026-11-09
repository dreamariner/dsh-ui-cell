// dsh-ui-cell :: sheet 组件的开合动画相位机
//
// 为什么要有这个：动画这件事 CSS 只管「播哪段」，「什么时候把 DOM 摘掉」是组件的事。
// 摘早了，出场动画没机会播（用户看到的就是「关面板没动画」）；摘晚了，面板赖在屏幕上。
// 所以这条契约必须有测试钉住：
//   open  → 挂载 + data-state="open"（播进场动画）
//   close → data-state="closed" 且**留在 DOM 里**（播出场动画），animationend 之后才卸载
//
// 环境：jsdom（vitest.config.ts 已设）。jsdom 没有 matchMedia，要自己塞桩。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Sheet } from '../src/sheet.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** matchMedia 桩：jsdom 未实现，且结果要能按用例切换（减少动效降级路径要用）。 */
let reducedMotion = false

beforeEach(() => {
  reducedMotion = false
  window.matchMedia = ((query: string) => ({
    matches: reducedMotion,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

let root: Root | undefined
let container: HTMLDivElement | undefined

function renderSheet(open: boolean, onOpenChange?: (open: boolean) => void, sheetContainer?: HTMLElement | null): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(Sheet, { open, title: '标题', children: '内容', onOpenChange, container: sheetContainer }))
  })
}

function panel(): HTMLElement | null {
  return document.querySelector('[role="dialog"]')
}

afterEach(() => {
  if (root !== undefined) {
    act(() => { root?.unmount() })
    root = undefined
  }
  container?.remove()
  container = undefined
  document.body.innerHTML = ''
})

describe('sheet 开合动画的相位状态机', () => {
  it('打开时挂载，并标记 data-state="open"（进场动画的那一段）', () => {
    renderSheet(true)
    const dialog = panel()
    expect(dialog).not.toBeNull()
    expect(dialog?.parentElement?.getAttribute('data-state')).toBe('open')
  })

  it('从没打开过就不渲染任何 DOM', () => {
    renderSheet(false)
    expect(panel()).toBeNull()
  })

  it('关闭时先留在 DOM 里（data-state="closed"），出场动画播完才卸载', () => {
    renderSheet(true)
    expect(panel()).not.toBeNull()

    act(() => {
      root?.render(createElement(Sheet, { open: false, title: '标题', children: '内容' }))
    })

    const dialog = panel()
    // ⚠ 关键断言：关闭后 DOM 还在，否则出场动画没有播的场合。
    expect(dialog).not.toBeNull()
    expect(dialog?.parentElement?.getAttribute('data-state')).toBe('closed')

    act(() => {
      dialog?.dispatchEvent(new Event('animationend', { bubbles: true }))
    })
    expect(panel()).toBeNull()
  })

  it('系统开了「减少动态效果」时直接卸载（样式关了动画，没有 animationend 事件）', () => {
    reducedMotion = true
    renderSheet(true)
    act(() => {
      root?.render(createElement(Sheet, { open: false, title: '标题', children: '内容' }))
    })
    expect(panel()).toBeNull()
  })
})

describe('sheet 的限定容器（不覆盖整个窗口）', () => {
  it('给了 container：面板按容器的矩形展开（视口坐标）', () => {
    // 插件面板里的详情抽屉要限制在自己那个页签内，别盖住宿主的对话区。
    const host = document.createElement('div')
    host.getBoundingClientRect = (): DOMRect => ({
      left: 100, top: 50, width: 300, height: 200, right: 400, bottom: 250, x: 100, y: 50,
      toJSON: () => ({}),
    }) as DOMRect
    document.body.append(host)

    renderSheet(true, undefined, host)
    const root = panel()?.parentElement
    const style = root?.getAttribute('style') ?? ''
    expect(style, '没按容器定位').toContain('left: 100px')
    expect(style).toContain('top: 50px')
    expect(style).toContain('width: 300px')
    expect(style).toContain('height: 200px')
  })

  it('不给 container：整个视口（不写内联边界）', () => {
    renderSheet(true)
    const root = panel()?.parentElement
    expect(root?.getAttribute('style') ?? '').not.toContain('left:')
  })
})

describe('sheet 的 modal 层级栈（Escape 与焦点）', () => {
  // ⚠ 这组是回归护栏：**从关闭态打开**这条路径上，DOM 若比 open 晚一个提交出现，
  //   useModalLayer 的 layout effect 就跑在 DOM 出现之前 → 层级栈不注册 →
  //   Escape 失效、焦点也不进对话框（实测踩过：面板能开，但 Esc 关不掉）。
  const changes: boolean[] = []
  const onOpenChange = (next: boolean): void => { changes.push(next) }

  function openFromClosed(): void {
    renderSheet(false, onOpenChange)
    act(() => {
      root?.render(createElement(Sheet, { open: true, title: '标题', children: '内容', onOpenChange }))
    })
  }

  it('Escape 能触发关闭', () => {
    changes.length = 0
    openFromClosed()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(changes, 'Escape 没有触发 onOpenChange(false)').toContain(false)
  })

  it('打开后焦点进入对话框', () => {
    openFromClosed()
    const dialog = panel()
    expect(dialog?.contains(document.activeElement), '焦点没进对话框').toBe(true)
  })
})

describe('sheet 样式表的动画契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'sheet.css'), 'utf8')

  it('进出两段动画都由 data-state 驱动', () => {
    expect(css).toContain("[data-state='open'] .panel")
    expect(css).toContain("[data-state='closed'] .panel")
    expect(css).toMatch(/@keyframes\s+sheet-in\b/)
    expect(css).toMatch(/@keyframes\s+sheet-out\b/)
    expect(css).toMatch(/@keyframes\s+mask-in\b/)
    expect(css).toMatch(/@keyframes\s+mask-out\b/)
  })

  it('位移量按方向给（自定义属性），进出场共用同一对 keyframes', () => {
    expect(css).toContain('--sheet-shift-x')
    expect(css).toContain('--sheet-shift-y')
    expect(css).toMatch(/@keyframes\s+sheet-out[\s\S]*?translate\(var\(--sheet-shift-x\), var\(--sheet-shift-y\)\)/)
  })

  it('有 reduced-motion 降级（关掉动画，同时组件侧要自己卸载）', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })
})
