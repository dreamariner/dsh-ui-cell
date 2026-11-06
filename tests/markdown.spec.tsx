// markdown 家族的渲染回归（2026-11-06 起，issue 005）。
//
// 为什么要有这个：markdown 家族是**保真复制 + 裁剪**的产物（裁了流式臂、DraggableImage、
// 换了简化 LinkIcon、KaTeX CSS 文本化），裁剪有没有改坏语义，只有真渲染才知道。
// 护栏（registry.spec.ts）只查静态形状，查不出「渲染结果不对」。
//
// 环境：jsdom（KaTeX 渲染路径用 DOMParser，Node 环境没有）。

import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownText } from '../src/markdown-text.tsx'
import type { MarkdownLabels } from '../src/markdown-render.tsx'

const labels: MarkdownLabels = {
  code: { copyLabel: '复制', copiedLabel: '已复制' },
  footnotes: '脚注',
}

function render(md: string): string {
  return renderToStaticMarkup(createElement(MarkdownText, { text: md, labels }))
}

describe('markdown 家族渲染（issue 005 裁剪后的语义）', () => {
  it('标题 / 段落 / 粗体 / 行内代码', () => {
    const html = render('# 标题\n\n普通段落，带 **粗体** 与 `行内代码`。')
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>')
    expect(html).toContain('<code>')
  })

  it('GFM 表格', () => {
    const html = render('| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<table')
    expect(html).toContain('<td')
  })

  it('列表与任务列表', () => {
    const html = render('- 任务一\n- [x] 任务二')
    expect(html).toContain('<li')
    expect(html).toContain('checkbox')
  })

  it('代码围栏走 shiki 高亮（真实高亮，不是 plain 降级）', () => {
    const html = render('```typescript\nconst x: number = 42\n```')
    expect(html).toContain('<pre')
    // shiki 的 css-variables 主题：颜色走 --shiki-* 变量
    expect(html).toContain('shiki')
    expect(html).toContain('var(--shiki-token-keyword)')
  })

  it('未知语言降级为纯文本（不报错）', () => {
    const html = render('```not-a-language\nfoo\n```')
    expect(html).toContain('<pre')
    expect(html).toContain('foo')
  })

  it('KaTeX 数学公式渲染（DOMParser 路径）', () => {
    const html = render('行内公式 $a^2 + b^2 = c^2$。')
    expect(html).toContain('katex')
  })

  it('原始 HTML 渲染为 nothing（omitHtml）', () => {
    const withHtml = render('<script>alert(1)</script>')
    expect(withHtml).not.toContain('<script>')
  })

  it('不安全协议被禁用（javascript: 链接不渲染成可点链接）', () => {
    const html = render('[点我](javascript:alert(1))')
    expect(html).not.toContain('href="javascript:')
  })
})
