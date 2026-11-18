// dsh-ui-cell :: avatar 的回退文字排版契约
//
// 为什么要有这个（2026-11-18 起，issue 018）：圆形头像能显示文字的宽度是**内切正方形**
// （边长 = size/√2 ≈ 0.707·size）。原来回退文字的字号是固定比例 0.42，
// 两个字就超了 —— 实测 32px 头像里「助手」两个字占 30px，而内切正方形只有 22.6px，
// 字的左右两端被圆形裁掉，看着像缺笔画。
//
// 环境：jsdom（vitest.config.ts 已设）。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Avatar } from '../src/avatar.tsx'

/** React 18 的 act 需要这个开关，否则告警。 */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

function renderAvatar(props: Record<string, unknown>): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(createElement(Avatar, props))
  })
}

/** 头像根元素。 */
function shell(): HTMLElement {
  return container?.firstElementChild as HTMLElement
}

/** 回退文字元素（测试环境里 CSS Modules 是桩，没有类名可用，按结构取）。 */
function fallback(): HTMLElement | null {
  const kid = shell()?.firstElementChild as HTMLElement | null
  return kid !== null && kid !== undefined && kid.tagName !== 'IMG' ? kid : null
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

describe('avatar 的回退文字按字数缩字号', () => {
  it('一个字用标准档（0.42），两个字缩到 0.33，三个字缩到 0.22', () => {
    renderAvatar({ fallback: '林', size: 32 })
    expect(shell().style.fontSize).toBe('13px') // 32 × 0.42 ≈ 13

    renderAvatar({ fallback: '助手', size: 32 })
    expect(shell().style.fontSize).toBe('11px') // 32 × 0.33 ≈ 11

    renderAvatar({ fallback: '回退中', size: 32 })
    expect(shell().style.fontSize).toBe('7px') // 32 × 0.22 ≈ 7
  })

  it('字号缩到「内切正方形放得下」为止（n 个全角字 × 字号 ≤ 0.707 × 边长）', () => {
    for (const text of ['林', '助手', '回退中']) {
      renderAvatar({ fallback: text, size: 32 })
      const fontSize = Number.parseFloat(shell().style.fontSize)
      const chars = [...text].length
      expect(chars * fontSize).toBeLessThanOrEqual(0.707 * 32 + 1)
    }
  })

  it('超过 3 个字只取前 3 个（32px 头像放不下更多）', () => {
    renderAvatar({ fallback: '记忆管理员', size: 32 })
    expect(fallback()?.textContent).toBe('记忆管')
  })

  it('非文本回退（图标等）不截断，字号走默认档', () => {
    renderAvatar({ fallback: createElement('svg', null), size: 32 })
    expect(shell().style.fontSize).toBe('13px')
  })
})

describe('avatar 的图片与回退切换', () => {
  it('有 src 时渲染图片', () => {
    renderAvatar({ src: 'https://example.invalid/a.png', fallback: '林', size: 32 })
    expect(shell()?.querySelector('img')).not.toBeNull()
    expect(fallback()).toBeNull()
  })

  it('图片加载失败后回退到回退内容', () => {
    renderAvatar({ src: 'https://example.invalid/a.png', fallback: '林', size: 32 })
    const img = shell()?.querySelector('img') as HTMLImageElement
    act(() => {
      img.dispatchEvent(new Event('error'))
    })
    expect(shell()?.querySelector('img')).toBeNull()
    expect(fallback()?.textContent).toBe('林')
  })
})

describe('avatar 样式表的裁剪契约', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'src', 'avatar.css'), 'utf8')

  it('圆角写在图片自己身上（靠父级 overflow 裁替换元素在个别引擎里会漏）', () => {
    const imageRule = css.match(/\.image\s*\{[^}]*\}/)?.[0] ?? ''
    expect(imageRule).toContain('border-radius: 50%')
  })

  it('回退文字不留内边距（内边距会把文字推出内切正方形）', () => {
    const fallbackRule = css.match(/\.fallback\s*\{[^}]*\}/)?.[0] ?? ''
    expect(fallbackRule).not.toMatch(/padding:\s*0\s+[^;]*;/) // 不能是「左右有值」
  })

  it('回退有可见的圆形（底色 + 描边），不能只是浮在页面上的裸文字', () => {
    // 亮色主题里 bg-layer-3 就是纯白（= 页面底色），只靠它圆形会整个消失 →
    // 必须再有 border-l3 的描边，两套主题里都看得出这是个头像。
    const fallbackRule = css.match(/\.fallback\s*\{[^}]*\}/)?.[0] ?? ''
    expect(fallbackRule).toMatch(/border:\s*(?!none)\S/)
    expect(fallbackRule).toMatch(/background:\s*var\(--dsw-alias-/)
    expect(fallbackRule).toMatch(/border-radius:\s*50%/)
  })
})
