// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/parse.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/parse.ts → kit 路径：markdown-parse.ts
/**
 * The markdown renderer's two mdast grammars, one per rendering arm. Each
 * arm is internally consistent — the incremental tail parses, the one-shot
 * parses, and the plain-text projection of a given grammar always agree on
 * where blocks start and end — and the settled grammar is the streaming one
 * plus the math extensions, so the arms differ only where TeX delimiters
 * begin a math construct (a `$$` block is a paragraph while streaming and a
 * math block once settled, by design).
 */

import type { Root } from 'mdast'
import { recoverLocalImages } from './markdown-local-image-syntax.ts'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { mathFromMarkdown } from 'mdast-util-math'
import { gfm } from 'micromark-extension-gfm'
import { math } from 'micromark-extension-math'
import { cjkFriendlyStrong } from './markdown-cjk-friendly-strong.ts'
import { mathCompatibility } from './markdown-math-compatibility.ts'
import { windowsPathDestinations } from './markdown-windows-path-destinations.ts'

/** GFM strikethrough requires `~~`; a single `~` stays literal, as in ranges such as `10~20`. */
const gfmOptions = { singleTilde: false }

/**
 * Parse GFM markdown (the streaming arm's grammar: no math, so incomplete
 * TeX never flashes KaTeX errors mid-stream).
 * @param text - Markdown source.
 * @returns The mdast root.
 */
export function parseGfm(text: string): Root {
  return recoverLocalImages(fromMarkdown(text, {
    extensions: [gfm(gfmOptions), cjkFriendlyStrong()],
    mdastExtensions: [gfmFromMarkdown(), windowsPathDestinations()],
  }), text)
}

/**
 * Parse GFM markdown plus TeX math with the compatibility delimiters
 * (the settled arm's grammar).
 * @param text - Markdown source.
 * @returns The mdast root.
 */
export function parseGfmWithMath(text: string): Root {
  return recoverLocalImages(fromMarkdown(text, {
    extensions: [gfm(gfmOptions), cjkFriendlyStrong(), mathCompatibility(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown(), windowsPathDestinations()],
  }), text)
}
