// dsh-ui-cell :: disclosure-row 的展开收起动画相位机
//
// 为什么要有这个（2026-11-18 起，issue 015）：上游的 DisclosureRow 是
// `{open && children}` —— 内容瞬间挂载/卸载，展开时「啪」地出现、收起时「啪」地消失。
// 本仓侧把内容区改成相位状态机（与 sheet 同一套范式），这条契约必须有测试钉住：
//   open  → 挂载 + data-state="open"（播进场动画）
//   close → data-state="closed" 且**留在 DOM 里**（播出场动画），animationend 之后才卸载
//
// 环境：jsdom（vitest.config.ts 已设）。jsdom 没有 matchMedia，要自己塞桩。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DisclosureRow } from '../src/disclosure-row.tsx'

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

function renderRow(open: boolean): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(DisclosureRow, {
      icon: createElement('span', null, '图'),
      title: '记忆条目 #902',
      open,
      expandable: true,
      onToggle: () => {},
    }))
  })
}

/** 内容区（data-state 挂在它身上）。 */
function content(): HTMLElement | null {
  return document.querySelector('[data-state]')
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

describe('disclosure-row 展开收起的相位状态机', () => {
  it('展开时内容挂载，并标记 data-state="open"（进场动画的那一段）', () => {
    renderRow(true)
    expect(content()).not.toBeNull()
    expect(content()?.getAttribute('data-state')).toBe('open')
  })

  it('从没打开过就不渲染内容区', () => {
    renderRow(false)
    expect(content()).toBeNull()
  })

  it('收起时先留在 DOM 里（data-state="closed"），出场动画播完才卸载', () => {
    renderRow(true)
    expect(content()).not.toBeNull()

    act(() => {
      root?.render(createElement(DisclosureRow, {
        icon: createElement('span', null, '图'),
        title: '记忆条目 #902',
        open: false,
        expandable: true,
        onToggle: () => {},
      }))
    })

    const area = content()
    // ⚠ 关键断言：收起后 DOM 还在，否则出场动画没有播的场合。
    expect(area).not.toBeNull()
    expect(area?.getAttribute('data-state')).toBe('closed')

    act(() => {
      area?.dispatchEvent(new Event('animationend', { bubbles: true }))
    })
    expect(content()).toBeNull()
  })

  it('系统开了「减少动态效果」时直接卸载（样式关了动画，没有 animationend 事件）', () => {
    reducedMotion = true
    renderRow(true)
    act(() => {
      root?.render(createElement(DisclosureRow, {
        icon: createElement('span', null, '图'),
        title: '记忆条目 #902',
        open: false,
        expandable: true,
        onToggle: () => {},
      }))
    })
    expect(content()).toBeNull()
  })
})

describe('disclosure-row 样式表的动画契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'disclosure-row.css'), 'utf8')

  it('进出场两段动画都由 data-state 驱动', () => {
    expect(css).toContain("[data-state='open']")
    expect(css).toContain("[data-state='closed']")
    expect(css).toMatch(/@keyframes\s+disclosure-content-in\b/)
    expect(css).toMatch(/@keyframes\s+disclosure-content-out\b/)
  })

  it('动画走官方动效 token（不写字面时长与字面曲线）', () => {
    expect(css).toContain('var(--ds-transition-duration) var(--ds-ease-in-out)')
  })

  it('有 reduced-motion 降级（关掉动画，同时组件侧要自己卸载）', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })
})
