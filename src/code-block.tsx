// 代码块：渲染代码正文 + 语言/复制头栏（shiki 语法高亮）。
//
// 上游来源：packages/client/ui-primitives/src/markdown/CodeBlock.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 与官方实现的差异（2026-11-06 起，issue 005）：
//   1. **没有流式臂**：官方那份用 `StreamingHighlightSession` 逐块 tokenize 增长中的
//      代码围栏，并配 `useViewportHighlighting` 视口门控。kit 的语法是**静态**的
//      （见 code-highlighting.ts），没有「语法加载中」这回事，故整条流式链路不需要；
//      第三方面板也不是流式场景。
//   2. **DOM 契约照旧**：`md-code-block` 全局类、`data-line-numbers` /
//      `data-code-wrap` / `data-code-block-banner` / `data-code-block-content`
//      语义钩子、shiki 的 `<pre class="shiki css-variables">` 属性、`.line` 行 span
//      —— 这些是宿主样式与 DOM 测试的锚点，一个都不能少。
//
// 依赖：shiki（精确锁 4.4.3，见 code-highlighting.ts）+ @shikijs/langs。
// 样式：src/code-block.css（kit 约定）+ src/shiki.css（--shiki-* 变量表）。

import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import clsx from 'clsx'
import { writeClipboard } from './clipboard.ts'
import { CodeToolbar, type CodeToolbarLabels } from './code-toolbar.tsx'
import { highlightToHtml } from './code-highlighting.ts'
import css from './code-block.css'

export interface CodeBlockProps {
  /** 源码文本，原样渲染（展示时去掉尾部换行）。 */
  code: string
  /** 语法提示（markdown 围栏 info string 或调用方给的固定 id）；未知 = 纯文本。 */
  lang?: string | undefined
  /** 额外类名合并到外层（调用方定位用；本组件自己画）。 */
  className?: string | undefined
  /** 稳定内容节点的 ref，供把它当滚动容器的调用方使用。 */
  contentRef?: Ref<HTMLDivElement> | undefined
  /** 显示行号槽（不写进复制内容）。默认 false。 */
  lineNumbers?: boolean | undefined
  /** 显示语言与复制头栏；调用方自带工具栏时传 false。默认 true。 */
  showHeader?: boolean | undefined
  /** 复制按钮的常态文案（由调用方传本地化文案）。 */
  copyLabel: string
  /** 复制成功后的短暂反馈文案。 */
  copiedLabel: string
  /** 启用共享卡片工具栏与间距；不传则用自定义工具栏布局。 */
  toolbarLabels?: CodeToolbarLabels | undefined
  /** 配合 toolbarLabels：沿用调用方的换行偏好并省掉工具栏里的换行动作。 */
  wrap?: boolean | undefined
}

/**
 * shiki 的 css-variables 主题在 HTML 臂吐出的 `<pre>` 属性，
 * 流式臂的树与之可互换（kit 无流式臂，但契约保持一致）。
 */
const SHIKI_PRE_PROPS = {
  className: 'shiki css-variables',
  style: { backgroundColor: 'var(--shiki-background)', color: 'var(--shiki-foreground)' },
  tabIndex: 0,
} as const

export function CodeBlock({
  code, lang, className, contentRef, lineNumbers = false, showHeader = true, copyLabel, copiedLabel, toolbarLabels, wrap,
}: CodeBlockProps) {
  const trimmed = code.endsWith('\n') ? code.slice(0, -1) : code
  const sourceLines = lineNumbers ? trimmed.split('\n') : undefined
  const rootRef = useRef<HTMLDivElement>(null)
  const html = useMemo(() => highlightToHtml(trimmed, lang), [trimmed, lang])
  const [copied, setCopied] = useState(false)
  const [localWrapped, setWrapped] = useState(true)
  const wrapped = wrap ?? localWrapped

  const onCopy = useCallback(() => {
    if (copied) return
    /* v8 ignore next -- 两条臂都渲染 <pre>；trimmed 是 DOM 形状万一分叉时的兜底。 */
    const text = rootRef.current?.querySelector('pre')?.textContent ?? trimmed
    void writeClipboard(text).then((ok) => {
      if (!ok) return
      setCopied(true)
      window.setTimeout(() => { setCopied(false) }, 1000)
    })
  }, [copied, trimmed])

  // shiki 的 HTML 输出是它从 `code` 生成的静态 span 树（没有用户 HTML 透传），
  // 是 shiki 官方文档认可的 innerHTML 消费路径。
  const body: ReactNode = html === undefined
    ? (
      <pre className={css.plain}><code>{sourceLines === undefined ? trimmed : sourceLines.map((line, index) => (
        <Fragment key={index}>{index > 0 && '\n'}<span className="line">{line}</span></Fragment>
      ))}</code></pre>
    )
    : (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    )

  return (
    <div ref={rootRef} className={clsx(css.block, 'md-code-block', lineNumbers && css.numbered, toolbarLabels !== undefined && css.card, className)}
      data-line-numbers={lineNumbers || undefined}
      data-code-wrap={toolbarLabels === undefined ? undefined : wrapped}
      style={sourceLines === undefined ? undefined : {
        '--dsl-code-block-line-number-width': `${Math.max(2, String(sourceLines.length).length)}ch`,
      } as CSSProperties}>
      {/* 这些成对属性是给调用方样式与 DOM 测试用的稳定语义钩子。 */}
      {showHeader && <div className={css.bannerWrap}>
        {toolbarLabels !== undefined ? <CodeToolbar
          lang={lang} labels={toolbarLabels} copyLabel={copyLabel} copiedLabel={copiedLabel}
          copied={copied} wrapped={wrapped} onCopy={onCopy}
          onWrap={wrap === undefined ? () => { setWrapped(value => !value) } : undefined}
        /> : <div className={css.banner} data-code-block-banner>
          <div className={css.infostring} data-text-interaction-exclude="">{lang ?? ''}</div>
          <div className={css.action}>
            <button type="button" className={css.copyButton} onClick={onCopy}>
              {copied ? copiedLabel : copyLabel}
            </button>
          </div>
        </div>}
      </div>}
      <div ref={contentRef} className={css.content} data-code-block-content>{body}</div>
    </div>
  )
}
