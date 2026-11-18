// dsh-ui-cell :: sidebar-nav 的契约
//
// 为什么要有这个（2026-11-19 起，issue 021）：Sidebar 是布局壳（宽度 + 三段），
// 导航条目此前只能消费端手写 div —— 补了 sidebar-nav（对齐 shadcn sidebar 菜单族
// 精简版）。这里钉住它的契约：选中语义、收起态、徽标、禁用。
//
// 环境：jsdom（vitest.config.ts 已设）。测试里 CSS import 是空桩（类名不存在），
// 查询一律用结构化选择器。

import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SidebarNav } from '../src/sidebar-nav.tsx'
import { Sidebar, useSidebarCollapsed } from '../src/sidebar.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

const ITEMS = [
  { value: 'memories', label: '记忆', badge: 12 },
  { value: 'skills', label: '技能' },
  { value: 'diary', label: '日记', disabled: true },
]

function renderNav(props: Record<string, unknown> = {}): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(SidebarNav, { label: '导航', items: ITEMS, ...props }))
  })
}

/** 导航根（<nav>）。 */
function nav(): HTMLElement {
  return container!.firstElementChild as HTMLElement
}

/** 条目按钮（按文字找；收起态没有文字，按 title 找）。 */
function item(label: string): HTMLButtonElement {
  const byText = Array.from(nav().querySelectorAll('button')).find(b => b.textContent === label)
  return (byText ?? nav().querySelector(`button[title="${label}"]`)) as HTMLButtonElement
}

function click(label: string): void {
  act(() => { item(label).dispatchEvent(new MouseEvent('click', { bubbles: true })) })
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

describe('sidebar-nav 的选中契约', () => {
  it('非受控：点击选中（aria-current）并回调；点已选中项不重复回调', () => {
    let selected: string | undefined
    renderNav({ defaultValue: 'memories', onSelect: (v: string) => { selected = v } })
    expect(item('记忆').getAttribute('aria-current')).toBe('true')
    click('技能')
    expect(item('技能').getAttribute('aria-current')).toBe('true')
    expect(item('记忆').getAttribute('aria-current')).toBeNull()
    expect(selected).toBe('skills')
    selected = undefined
    click('技能')
    expect(selected).toBeUndefined() // 已选中，不触发
  })

  it('受控：value 说了算（没有 onSelect 也不自己翻转）', () => {
    renderNav({ value: 'memories' })
    click('技能')
    expect(item('技能').getAttribute('aria-current')).toBeNull()
    expect(item('记忆').getAttribute('aria-current')).toBe('true')
  })

  it('禁用项不可选（disabled + 不回调）', () => {
    let selected: string | undefined
    renderNav({ defaultValue: 'memories', onSelect: (v: string) => { selected = v } })
    expect(item('日记').disabled).toBe(true)
    click('日记')
    expect(item('日记').getAttribute('aria-current')).toBeNull()
    expect(selected).toBeUndefined()
  })
})

describe('sidebar-nav 的收起态契约', () => {
  it('收起：文字不渲染（图标位），title 保悬浮提示，nav 带 data-collapsed', () => {
    renderNav({ collapsed: true, defaultValue: 'memories' })
    expect(nav().hasAttribute('data-collapsed')).toBe(true)
    expect(item('记忆').textContent).toBe('')
    expect(item('记忆').getAttribute('title')).toBe('记忆')
  })

  it('收起：徽标缩成圆点（原徽标不渲染）', () => {
    renderNav({ collapsed: true, defaultValue: 'memories' })
    const btn = item('记忆')
    expect(btn.textContent).toBe('') // 文字与徽标数字都不在
    // 圆点是仅剩的可见子元素（图标位由 icon ReactNode 占，这里 items 没给 icon）
    expect(btn.querySelectorAll('span').length).toBeGreaterThanOrEqual(1)
  })

  it('展开：文字与徽标都在', () => {
    renderNav({ defaultValue: 'memories' })
    expect(item('记忆').textContent).toBe('记忆12')
  })
})

describe('sidebar-nav 与 Sidebar 的收起态 Context（issue 028）', () => {
  /** 探针组件：把 hook 读到的收起态写进 DOM（undefined → 'none'）。 */
  function Probe(): ReactElement {
    const collapsed = useSidebarCollapsed()
    return createElement('span', { 'data-probe': collapsed === undefined ? 'none' : String(collapsed) })
  }

  /** 渲染 Sidebar（壳）+ 探针 + SidebarNav。 */
  function renderInSidebar(sidebarProps: Record<string, unknown> = {}, navProps: Record<string, unknown> = {}): void {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        createElement(Sidebar, { width: 200, ...sidebarProps },
          createElement(Probe),
          createElement(SidebarNav, { label: '导航', items: ITEMS, ...navProps }),
        ),
      )
    })
  }

  function sidebarEl(): HTMLElement { return container!.firstElementChild as HTMLElement }
  function probeEl(): HTMLElement { return sidebarEl().querySelector('[data-probe]') as HTMLElement }
  function navEl(): HTMLElement { return sidebarEl().querySelector('nav') as HTMLElement }

  it('壳收起 → nav 与槽内 hook 都跟着收起（不用逐层传 collapsed）', () => {
    renderInSidebar({ collapsed: true })
    expect(navEl().hasAttribute('data-collapsed')).toBe(true)
    expect(navEl().querySelector('button')?.textContent).toBe('') // 文字隐藏 = 收起生效
    expect(probeEl().getAttribute('data-probe')).toBe('true')
  })

  it('壳展开 → nav 展开且 hook 读到 false（三层缺省：prop > context > 展开）', () => {
    renderInSidebar({})
    expect(navEl().hasAttribute('data-collapsed')).toBe(false)
    expect(probeEl().getAttribute('data-probe')).toBe('false')
  })

  it('显式 collapsed prop 覆盖 context；槽内 hook 不受影响（仍是壳的态）', () => {
    renderInSidebar({ collapsed: true }, { collapsed: false })
    expect(navEl().hasAttribute('data-collapsed')).toBe(false)
    expect(navEl().textContent).toContain('记忆')
    expect(probeEl().getAttribute('data-probe')).toBe('true')
  })

  it('独立使用（不在 Sidebar 内）：hook 读到 undefined，nav 缺省展开', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(createElement('div', null,
        createElement(Probe),
        createElement(SidebarNav, { label: '导航', items: ITEMS }),
      ))
    })
    expect(container!.querySelector('[data-probe]')!.getAttribute('data-probe')).toBe('none')
    expect(container!.querySelector('nav')!.hasAttribute('data-collapsed')).toBe(false)
  })
})

describe('sidebar-nav 的分组契约', () => {
  it('分组渲染标题；收起态标题不渲染', () => {
    renderNav({ groups: [{ label: '工作区', items: [{ value: 'a', label: '甲' }] }, { items: [{ value: 'b', label: '乙' }] }] })
    expect(nav().textContent).toContain('工作区')
    // 分组标题不是按钮
    expect(Array.from(nav().querySelectorAll('button')).map(b => b.textContent)).toEqual(['甲', '乙'])
    act(() => { root?.render(createElement(SidebarNav, { label: '导航', collapsed: true, groups: [{ label: '工作区', items: [{ value: 'a', label: '甲' }] }] })) })
    expect(nav().textContent).not.toContain('工作区')
    expect(nav().textContent).not.toContain('甲') // 收起态：标题与条目文字都不渲染
    expect(nav().querySelector('button')?.getAttribute('title')).toBe('甲')
  })
})

describe('sidebar-nav 样式表的契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'sidebar-nav.css'), 'utf8')

  it('条目文字钉在主题档位（不继承宿主字号；issue 014 同款坑）', () => {
    const itemRule = css.match(/\.item\s*\{[^}]*\}/)?.[0] ?? ''
    expect(itemRule).toContain('font: var(--dsw-font-s-14)')
  })

  it('过渡走官方 token（即时反馈档）+ 有 reduced-motion 降级', () => {
    expect(css).toMatch(/transition:[^;]*var\(--ds-transition-duration-fast\)\s+var\(--ds-ease-in-out\)/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.item\s*\{\s*transition:\s*none/)
  })

  it('收起态由 data-collapsed 驱动（图标位收窄 + 圆点徽标叠图标右上角）', () => {
    expect(css).toMatch(/\[data-collapsed\] \.item\s*\{[^}]*justify-content:\s*center/)
    // 圆点绝对定位叠在角上（issue 027）：占布局位会把图标挤偏、圆点悬成白圈
    const dot = css.match(/\.badgeDot\s*\{[^}]*\}/)?.[0] ?? ''
    expect(dot).toMatch(/position:\s*absolute/)
    expect(dot).toMatch(/top:\s*var\(--dsh-space-4\)/)
    expect(dot).toMatch(/right:\s*var\(--dsh-space-4\)/)
    // 通知点要一眼可见（复审：module-platform 近白灰压白底难发现）→ brand 实心、无描边
    expect(dot).toMatch(/background:\s*var\(--dsw-alias-brand-primary\)/)
    expect(dot).not.toMatch(/outline/)
  })
})
