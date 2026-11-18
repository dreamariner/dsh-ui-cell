// dsh-ui-cell :: navigation-menu 的当前指示契约
//
// 为什么要有这个（2026-11-19 起，issue 025）：下划线此前只有受控声明
// （per-item current: true），点击条目组件自己不动 —— 最简用法点条目纹丝不动，
// 像坏了。补非受控（defaultCurrentId + 点击自迁移）后，这里钉住双模式契约：
//   受控：任一条目声明 current → 以声明为准，点击只回调不迁移；
//   非受控：点击条目自迁移；子菜单选中的 id 不在顶层条目里 → 下划线留在父项。
//
// 环境：jsdom（vitest.config.ts 已设）。CSS import 是空桩，查询走结构 / data-*。

import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NavigationMenu } from '../src/navigation-menu.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

const ITEMS = [
  { id: 'memories', label: '记忆' },
  { id: 'scenes', label: '场景' },
]

function renderNav(props: Record<string, unknown> = {}): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(NavigationMenu, { items: ITEMS, ...props }))
  })
}

function item(label: string): HTMLElement {
  return Array.from(container!.querySelectorAll('a, button')).find(el => el.textContent === label) as HTMLElement
}

function click(label: string): void {
  act(() => { item(label).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) })
}

/** 带 data-current 的条目文字。 */
function currentLabel(): string | undefined {
  return container!.querySelector('[data-current]')?.textContent ?? undefined
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

describe('navigation-menu 的当前指示契约', () => {
  it('非受控：defaultCurrentId 起步，点击条目下划线自迁移并回调', () => {
    let navigated: string | undefined
    renderNav({ defaultCurrentId: 'memories', onNavigate: (id: string) => { navigated = id } })
    expect(currentLabel()).toBe('记忆')
    click('场景')
    expect(currentLabel()).toBe('场景')
    expect(navigated).toBe('scenes')
  })

  it('非受控且未传 defaultCurrentId：初始无下划线，点击后迁移', () => {
    renderNav({})
    expect(container!.querySelector('[data-current]')).toBeNull()
    click('场景')
    expect(currentLabel()).toBe('场景')
  })

  it('受控：任一条目声明 current 即以声明为准，点击不迁移（只回调）', () => {
    let navigated: string | undefined
    renderNav({
      onNavigate: (id: string) => { navigated = id },
      items: [{ id: 'memories', label: '记忆', current: true }, { id: 'scenes', label: '场景' }],
    })
    click('场景')
    expect(currentLabel()).toBe('记忆')
    expect(navigated).toBe('scenes')
  })

  it('子菜单选中不迁移父项下划线（子项 id 不在顶层条目里）', () => {
    let navigated: string | undefined
    renderNav({
      defaultCurrentId: 'memories',
      onNavigate: (id: string) => { navigated = id },
      items: [{ id: 'memories', label: '记忆' }, { id: 'more', label: '更多', children: [{ id: 'audit', label: '审计日志' }] }],
    })
    // 先点「更多」开菜单（子项渲染在 body 级 portal 里），再点子项
    click('更多')
    act(() => {
      const entry = Array.from(document.querySelectorAll('button, [role="menuitem"]'))
        .find(el => el.textContent === '审计日志')
      entry?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(navigated).toBe('audit')
    expect(currentLabel()).toBe('记忆')
  })

  it('aria-current 跟随下划线（链接语义）', () => {
    renderNav({ defaultCurrentId: 'memories' })
    expect(item('记忆').getAttribute('aria-current')).toBe('page')
    expect(item('场景').getAttribute('aria-current')).toBeNull()
  })
})

describe('navigation-menu 样式表的下划线契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'navigation-menu.css'), 'utf8')

  it('下划线由 data-current::after 驱动（品牌色 2px 圆角短横）', () => {
    const rule = css.match(/\.item\[data-current\]::after\s*\{[^}]*\}/)?.[0] ?? ''
    expect(rule).toContain("content: ''")
    expect(rule).toContain('background: var(--dsw-alias-brand-primary)')
  })
})
