// dsh-ui-cell :: resizable 的拖动契约
//
// 为什么要有这个（2026-11-18 起，issue 016）：拖拽分割条有两个很容易犯、且都不报错的错：
//
//   1. **百分比与渲染宽度对不上**：左栏若还吃 flex-grow，剩余空间会被按比例分给两栏，
//      于是「状态 45%」渲染出来是 71.9%。拖动时越拖越偏：实测光标往左拖 80px，
//      分隔条反而往右挪了 20px（分隔条完全不跟手）。
//   2. **松手后还在跟着鼠标动**：指针在窗口外松开时页面收不到 pointerup，
//      拖动状态没被收掉，之后每次移动鼠标面板都在改 —— 极易误触。
//
// 环境：jsdom（vitest.config.ts 已设）。jsdom 没有布局（getBoundingClientRect 全 0），
// 也没有指针捕获 API，测试里自己塞桩。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Resizable } from '../src/resizable.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** 容器的假几何：宽 400，左沿 0。 */
const ROOT_RECT = { x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 100, width: 400, height: 100 }
/** 分隔条的假几何：宽 5。 */
const DIVIDER_RECT = { x: 0, y: 0, left: 0, top: 0, right: 5, bottom: 100, width: 5, height: 100 }

let root: Root | undefined
let container: HTMLDivElement | undefined
let captured = false

/** 把某个元素的 getBoundingClientRect 换成假值。 */
function fakeRect(el: Element, rect: typeof ROOT_RECT): void {
  el.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect }) as DOMRect
}

function renderResizable(initialLeftPercent = 45): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(Resizable, {
      left: createElement('span', null, '左栏'),
      right: createElement('span', null, '右栏'),
      initialLeftPercent,
    }))
  })
  const rootEl = container.firstElementChild as HTMLElement
  const divider = container.querySelector('[role="separator"]') as HTMLElement
  fakeRect(rootEl, ROOT_RECT)
  fakeRect(divider, DIVIDER_RECT)
}

/** 左栏（第一个 pane）。 */
function leftPane(): HTMLElement {
  const rootEl = container?.firstElementChild as HTMLElement
  return rootEl.children[0] as HTMLElement
}

/** 分隔条。 */
function divider(): HTMLElement {
  return container?.querySelector('[role="separator"]') as HTMLElement
}

/** 左栏的百分比（从 inline style 的 flex-basis 读）。 */
function leftPercent(): number {
  return Number.parseFloat(leftPane().style.flexBasis)
}

/** 派发一个 pointer 事件（jsdom 没有 PointerEvent，用 MouseEvent 顶替类型）。 */
function firePointer(target: HTMLElement, type: string, clientX: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 }))
  })
}

beforeEach(() => {
  captured = false
  // jsdom 没实现指针捕获，补桩并记账（拖动契约要求「必须捕获」）
  ;(Element.prototype as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture = () => { captured = true }
  ;(Element.prototype as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture = () => {}
  ;(Element.prototype as unknown as { hasPointerCapture: (id: number) => boolean }).hasPointerCapture = () => captured
})

afterEach(() => {
  if (root !== undefined) {
    act(() => { root?.unmount() })
    root = undefined
  }
  container?.remove()
  container = undefined
  document.body.innerHTML = ''
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})

describe('resizable 的百分比与渲染宽度对得上', () => {
  it('左栏按百分比给宽度，且不吃 flex-grow（grow 会让百分比失真）', () => {
    renderResizable(45)
    expect(leftPane().style.flexBasis).toBe('45%')
    expect(leftPane().style.flexGrow).toBe('0')
    expect(leftPane().style.flexShrink).toBe('0')
  })
})

describe('resizable 的拖动跟着光标走', () => {
  it('拖动时按「分隔条中心对准光标」反解百分比', () => {
    renderResizable(45)
    // 分隔条宽 5，光标在 200 → 分隔条中心应对齐 200 → 左栏宽 = 200 - 2.5 = 197.5
    // → 百分比 = 197.5 / 400 = 49.375%
    firePointer(divider(), 'pointerdown', 200)
    firePointer(divider(), 'pointermove', 200)
    expect(leftPercent()).toBeCloseTo(49.375, 3)
  })

  it('按下时必须做指针捕获（光标移出分隔条乃至移出窗口，事件也要送到它）', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    expect(captured).toBe(true)
  })

  it('百分比被夹在 min / max 之间', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    firePointer(divider(), 'pointermove', 3999)
    expect(leftPercent()).toBeLessThanOrEqual(80)
    firePointer(divider(), 'pointermove', -100)
    expect(leftPercent()).toBeGreaterThanOrEqual(20)
  })
})

describe('resizable 松手后不再跟着鼠标动', () => {
  it('松手后再移动鼠标，百分比不变（原先 pointerup 漏掉就会一直跟着动）', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    firePointer(divider(), 'pointermove', 300)
    const after = leftPercent()
    firePointer(divider(), 'pointerup', 300)
    firePointer(divider(), 'pointermove', 120)
    expect(leftPercent()).toBe(after)
  })

  it('没按住时移动鼠标不改变布局', () => {
    renderResizable(45)
    firePointer(divider(), 'pointermove', 300)
    expect(leftPercent()).toBe(45)
  })

  it('指针在窗口外松开（页面收不到 pointerup）时，窗口失焦能收掉拖动状态', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    firePointer(divider(), 'pointermove', 300)
    const after = leftPercent()
    // 模拟「在窗口外松手」：只有 blur 到达页面
    act(() => { window.dispatchEvent(new Event('blur')) })
    firePointer(divider(), 'pointermove', 120)
    expect(leftPercent()).toBe(after)
  })

  it('指针被取消（pointercancel）时收掉拖动状态', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    firePointer(divider(), 'pointermove', 300)
    const after = leftPercent()
    firePointer(divider(), 'pointercancel', 300)
    firePointer(divider(), 'pointermove', 120)
    expect(leftPercent()).toBe(after)
  })

  it('拖动结束后光标与文本选中态都还原', () => {
    renderResizable(45)
    firePointer(divider(), 'pointerdown', 200)
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')
    firePointer(divider(), 'pointerup', 200)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })
})
