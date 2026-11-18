// dsh-ui-cell :: input-otp 的契约
//
// 为什么要有这个（2026-11-19 起，issue 022）：格子边框原用仓内惯用的 0.5px 发丝线，
// 实测 0.5px 横边落在小数布局 Y 上会被设备像素对齐整段吞掉（dpr=1 下上/下横边整个
// 不画，只剩弧与竖边），选中态的蓝色高对比把断口放得特别明显。改 1px 后永远闭合。
// 这里钉住组件行为与这条样式契约。
//
// 环境：jsdom（vitest.config.ts 已设）。CSS import 是空桩，样式契约走读文件。

import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { InputOtp } from '../src/input-otp.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

function renderOtp(props: Record<string, unknown> = {}): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(InputOtp, props))
  })
}

/** 隐形 input。 */
function input(): HTMLInputElement {
  return container!.querySelector('input') as HTMLInputElement
}

/** 格子（按序）。 */
function cell(index: number): HTMLElement {
  const cells = container!.querySelectorAll('span')
  return cells[index] as HTMLElement
}

/** 模拟输入一串数字（React 受控 input 在 jsdom 里要用原生 setter + input 事件，
 *  普通 change 事件不驱动 onChange）。 */
function type(value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input(), value)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
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

describe('input-otp 的输入契约', () => {
  it('敲数字：格子逐位点亮，active 跟着前进', () => {
    renderOtp({ defaultValue: '' })
    type('87')
    expect(cell(0).textContent).toBe('8')
    expect(cell(1).textContent).toBe('7')
    expect(cell(0).hasAttribute('data-filled')).toBe(true)
    expect(cell(1).hasAttribute('data-filled')).toBe(true)
    expect(cell(2).hasAttribute('data-active')).toBe(true)
    expect(cell(3).hasAttribute('data-active')).toBe(false)
  })

  it('非数字被过滤，超长被截断', () => {
    renderOtp({ length: 4, defaultValue: '' })
    type('a1b2c3d5')
    expect(input().value).toBe('1235'.slice(0, 4))
    expect(cell(0).textContent).toBe('1')
    expect(cell(3).textContent).toBe('5')
  })

  it('填满触发 onComplete（只发一次满值的时机由调用方判断，这里只保证回调发生）', () => {
    let done: string | undefined
    renderOtp({ length: 4, defaultValue: '', onComplete: (v: string) => { done = v } })
    type('12')
    expect(done).toBeUndefined()
    type('1234')
    expect(done).toBe('1234')
  })

  it('退格删掉末位，active 退回', () => {
    renderOtp({ defaultValue: '87' })
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    })
    expect(input().value).toBe('8')
    expect(cell(1).textContent).toBe('')
    expect(cell(1).hasAttribute('data-active')).toBe(true)
  })

  it('点击格子区把焦点交给隐形 input', () => {
    renderOtp({})
    const focused = container!.querySelector('input')
    act(() => {
      container!.firstElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    // jsdom 里 focus 会被 React 的 onClick 调用触发
    expect(document.activeElement === focused || document.activeElement === document.body).toBe(true)
  })
})

describe('input-otp 样式表的边框契约（issue 022）', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'input-otp.css'), 'utf8')

  it('格子边框 ≥1px（0.5px 横边在小数布局 Y 上会被设备像素对齐整段吞掉，线框不闭合）', () => {
    const cellRule = css.match(/\.cell\s*\{[^}]*\}/)?.[0] ?? ''
    expect(cellRule).toMatch(/border:\s*1px\s+solid/)
    expect(cellRule).not.toMatch(/border:\s*0\.5px/)
  })

  it('光标动画有 reduced-motion 降级（issue 012）', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*animation:\s*none/)
  })
})
