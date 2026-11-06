/**
 * 把不可信的 assistant Markdown 渲染成语义化 React 元素（settled 全量渲染）。
 *
 * 上游来源：packages/client/ui-primitives/src/markdown/MarkdownText.tsx
 *           @ dsh v0.2.2-rc.1 (66491b05e3)
 *
 * 与官方的差异（2026-11-06，issue 005）：**裁掉流式臂**。官方那份带
 * IncrementalMarkdownParser（逐块增量解析 + 冻结已完成块），配套的
 * useViewportHighlighting 与 StreamingHighlightSession 也在流式臂里。
 * 第三方面板不是流式场景（内容一次给全），故只保留 settled 全量渲染：
 * 解析用 parseGfmWithMath（含数学），引用与脚注一次性解析完。
 *
 * 保留的官方行为：原始 HTML 渲染为 nothing（omitHtml）、不安全协议禁用、
 * 文件引用与本地图片两个可选词汇表（默认不接线）、delegate 注入。
 */
import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { parseGfmWithMath } from './markdown-parse.ts'
import {
  collectReferenceTargets, createReferenceTargets, renderBlocks, renderFootnoteSection,
  wrapBlockChildren,
} from './markdown-render.tsx'
import type { MarkdownFileMentions, MarkdownLabels, MarkdownPathImages, MarkdownRenderContext, ReferenceTargets } from './markdown-render.tsx'
import css from './markdown-text.css'

export type { MarkdownCodeLabels, MarkdownFileMentions, MarkdownLabels, MarkdownPathImages } from './markdown-render.tsx'
/** One settled full render: parse with math, resolve references, append the footnote section. */
function renderSettled(
  text: string,
  labels: MarkdownLabels,
  fileMentions: MarkdownFileMentions | undefined,
  pathImages: MarkdownPathImages | undefined,
  omitHtml: boolean,
): ReactNode[] {
  const root = parseGfmWithMath(text)
  const targets = createReferenceTargets()
  collectReferenceTargets(root.children, targets)
  const context: MarkdownRenderContext = {
    streaming: false,
    labels,
    fileMentions,
    pathImages,
    omitHtml,
    targets,
    footnoteOrder: [],
    footnoteCounts: new Map(),
  }
  const blocks = wrapBlockChildren(
    renderBlocks(root.children.map((node, index) => ({
      node,
      /* v8 ignore next -- parseFull uses parseGfm, which stamps every top-level node. */
      key: node.position?.start.offset ?? -(index + 1),
    })), context),
    false,
  )
  const section = renderFootnoteSection(context)
  return section === null ? blocks : [...blocks, '\n', section]
}
/**
 * Render untrusted assistant-authored Markdown as semantic React elements.
 * @param props - Markdown source text preserved by the session projection;
 * `streaming` parses incrementally across chunks and highlights fences as
 * they grow (each fence re-tokenizes only appended text; TeX stays literal
 * until the finalize swap so incomplete formulae never flash errors);
 * `labels` forwards localized fence and footnote chrome — pass a
 * reference-stable object (memoized per locale revision), because a new
 * identity discards the streaming render cache mid-message. `fileMentions`
 * links inline-code tokens its resolver recognizes as real files, and
 * `pathImages` rewrites image destinations that are local file paths into
 * displayable URLs its resolver vouches for. Those two vocabularies are the
 * single streaming gate — they apply to settled renders only, because a
 * streaming message's vocabulary is not final and frozen cached elements
 * must not bake in handlers that could go stale. A surrounding
 * `MarkdownDelegateProvider` can delegate ordinary HTTP(S) activation while
 * modified clicks retain native behavior. `variant="compact"` uses secondary
 * text sizing, uniform bold headings, and tight block spacing; the default
 * `body` variant uses the full document typography. `omitHtml` renders raw
 * HTML as nothing instead of literal text, for documents written for HTML
 * renderers, such as package READMEs. `textInteractionSource` marks the
 * existing root as a source for text selection interactions.
 * The provider's `openFile` enables local Markdown links in settled messages,
 * including `#L24` / `#L24-L30` fragments and `:24` / `:24-30` / `:24:5` suffixes
 * (ranges open at their first line, columns are ignored, and invalid locations
 * open only the file; see the README for URL/path classification).
 * @returns A GFM document with TeX math rendered through KaTeX; raw HTML never
 * renders as markup, and unsafe protocols are disabled. Local links without an opener remain text;
 * absolute HTTP(S) images render directly.
 */
export const MarkdownText = memo(function MarkdownText({
  text, labels, fileMentions, pathImages, variant = 'body', omitHtml = false, textInteractionSource = false,
}: {
  text: string
  labels: MarkdownLabels
  fileMentions?: MarkdownFileMentions | undefined
  pathImages?: MarkdownPathImages | undefined
  variant?: 'body' | 'compact'
  omitHtml?: boolean
  textInteractionSource?: boolean
}) {
  const children = useMemo(
    () => renderSettled(text, labels, fileMentions, pathImages, omitHtml),
    [text, labels, fileMentions, pathImages, omitHtml],
  )
  return <div className={clsx(css.markdown, variant === 'compact' && css.compact)}
    data-text-interaction-source={textInteractionSource ? '' : undefined}
    data-markdown-variant={variant === 'compact' ? variant : undefined}>{children}</div>
})
