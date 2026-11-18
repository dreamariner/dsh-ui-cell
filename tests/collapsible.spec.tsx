// dsh-ui-cell :: collapsible 的展开收起契约
//
// 为什么要有这个（2026-11-18 起，issue 020）：Collapsible 此前是 {open && children}
// 瞬间挂载/卸载，只有箭头在转、内容「啪」地出现/消失 —— 与 Accordion 的 grid 过渡
// 手感对不上（issue 015 的文档还误写了 Collapsible 已走 grid 过渡）。
// 修法照 Accordion 的同一套：内容常驻 DOM + grid-template-rows 0fr↔1fr 过渡；
// 收起态加 inert（焦点不进入视觉隐藏区）。这里的测试钉住这套契约。
//
// 环境：jsdom（vitest.config.ts 已设）。注意：测试里 CSS import 是空桩（vitest 对 .css
// 返回空对象，类名不存在），查询一律用结构化选择器，不用类名。

import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Collapsible } from '../src/collapsible.tsx'
import { Accordion } from '../src/accordion.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

/** 非受控渲染（不给 open，点击自己翻转）；defaultOpen 可选。 */
function renderCollapsible(defaultOpen = false): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(Collapsible, { trigger: '高级选项', defaultOpen }, '折叠区内容'))
  })
}

/** 组件根（container 的第一个元素）。 */
function rootEl(): HTMLElement {
  return container!.firstElementChild as HTMLElement
}

/** 触发按钮（根的第一个子元素）。 */
function trigger(): HTMLButtonElement {
  return rootEl().querySelector('button') as HTMLButtonElement
}

/** 内容区（grid 包装层，紧跟在按钮之后）。 */
function content(): HTMLElement {
  return trigger().nextElementSibling as HTMLElement
}

/** 内容内层。 */
function contentInner(): HTMLElement {
  return content().firstElementChild as HTMLElement
}

function toggle(): void {
  act(() => { trigger().dispatchEvent(new MouseEvent('click', { bubbles: true })) })
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

describe('collapsible 的展开收起契约', () => {
  it('内容常驻 DOM：收起时也在（grid 0fr 靠常驻才能双向过渡）', () => {
    renderCollapsible(false)
    expect(contentInner().textContent).toBe('折叠区内容')
    toggle()
    expect(contentInner().textContent).toBe('折叠区内容')
  })

  it('aria-expanded 与 data-open 随开合翻转（非受控点击自己翻转）', () => {
    renderCollapsible(false)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(container?.querySelector('[data-open]')).toBeNull()
    toggle()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(container?.querySelector('[data-open]')).not.toBeNull()
  })

  it('收起态加 inert（焦点不进入视觉隐藏区），展开态没有', () => {
    renderCollapsible(false)
    expect(content().hasAttribute('inert')).toBe(true)
    toggle()
    expect(content().hasAttribute('inert')).toBe(false)
  })

  it('defaultOpen 初始即展开', () => {
    renderCollapsible(true)
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(container?.querySelector('[data-open]')).not.toBeNull()
  })

  it('Accordion 收起态同样加 inert（两个组件同一契约）', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(createElement(Accordion, {
        items: [{ key: 'a', header: '标题', content: '内容' }],
      }))
    })
    // 结构化查询：根 > 项 > 按钮 + 内容区
    const item = rootEl().firstElementChild as HTMLElement
    const contentEl = item.querySelector('button')!.nextElementSibling as HTMLElement
    expect(contentEl.hasAttribute('inert')).toBe(true)
    act(() => { item.querySelector('button')!.click() })
    expect(contentEl.hasAttribute('inert')).toBe(false)
  })
})

describe('collapsible 样式表的动画契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'collapsible.css'), 'utf8')

  it('内容区走 grid-template-rows 0fr↔1fr 的官方 token 过渡（与 Accordion 同一手法）', () => {
    expect(css).toMatch(/grid-template-rows:\s*0fr/)
    expect(css).toMatch(/\[data-open\] \.content\s*\{[^}]*grid-template-rows:\s*1fr/)
    expect(css).toMatch(/transition:\s*grid-template-rows\s+var\(--ds-transition-duration\)\s+var\(--ds-ease-in-out\)/)
  })

  it('过渡高度由 contentInner 的 overflow 裁出来（padding 收在展开态，0fr 才真的归零）', () => {
    expect(css).toMatch(/\.contentInner\s*\{[^}]*overflow:\s*hidden/)
    expect(css).toMatch(/\[data-open\] \.contentInner\s*\{[^}]*padding-bottom/)
  })

  it('有 reduced-motion 降级（箭头与内容都直接到位）', () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(block).toMatch(/\.chevron\s*\{\s*transition:\s*none/)
    expect(block).toMatch(/\.content\s*\{\s*transition:\s*none/)
  })

  it('内容区文字钉在主题档位（不写 font 会继承宿主 16px，比触发器大一号；issue 014 同款坑）', () => {
    const inner = css.match(/\.contentInner\s*\{[^}]*\}/)?.[0] ?? ''
    expect(inner).toContain('font: var(--dsw-font-s-14)')
    expect(inner).toContain('color: var(--dsw-alias-label-secondary)')
  })
})
