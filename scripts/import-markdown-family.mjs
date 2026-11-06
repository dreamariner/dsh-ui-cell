#!/usr/bin/env node
// import-markdown-family.mjs — 一次性搬运：把官方 markdown 家族搬进 kit/src 并改写导入路径。
//
// 背景（2026-11-06，issue 005）：kit 原先只收「零依赖替身」，markdown 家族暂缓。
// 现在按分层纪律放开内容块层，把官方 markdown 家族**保真复制**进 kit/src。
//
// 这个脚本只做**机械搬运**（复制 + 改导入路径 + 改文件头注）；语义裁剪
// （裁流式增量解析 / 裁 DraggableImage / 换简化 LinkIcon / KaTeX CSS 文本化）
// 由后续手工编辑完成，见 docs/issues/005。
//
// 用法：node scripts/import-markdown-family.mjs [--force]
//      （不带 --force 时，已存在的目标文件不覆盖，避免冲掉手工改动）

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(KIT, 'src')
const OFFICIAL = process.env.DSH_CHECKOUT
  ? join(process.env.DSH_CHECKOUT, 'packages', 'client', 'ui-primitives', 'src')
  : '/Users/nan/Documents/zero/专题系列/DeepSeekHarness研究/deepseek-harness/packages/client/ui-primitives/src'

if (!existsSync(OFFICIAL)) {
  console.error(`[import-markdown] 找不到官方源目录：${OFFICIAL}`)
  process.exit(1)
}
const force = process.argv.includes('--force')

/** 官方文件 → kit 文件名。 */
const FILES = {
  'markdown/MarkdownText.tsx': 'markdown-text.tsx',
  'markdown/MarkdownText.module.css': 'markdown-text.css',
  'markdown/render.tsx': 'markdown-render.tsx',
  'markdown/parse.ts': 'markdown-parse.ts',
  'markdown/katex.tsx': 'markdown-katex.tsx',
  'markdown/file-link.ts': 'markdown-file-link.ts',
  'markdown/plain-text.ts': 'markdown-plain-text.ts',
  'markdown/quote-text.ts': 'markdown-quote-text.ts',
  'markdown/local-image-syntax.ts': 'markdown-local-image-syntax.ts',
  'markdown/windows-path-destinations.ts': 'markdown-windows-path-destinations.ts',
  'markdown/cjkFriendlyStrong.ts': 'markdown-cjk-friendly-strong.ts',
  'markdown/mathCompatibility.ts': 'markdown-math-compatibility.ts',
  'markdown/MarkdownDelegate.tsx': 'markdown-delegate.tsx',
  'markdown/useViewportHighlighting.ts': 'markdown-viewport-highlighting.ts',
  'ReadBlock.tsx': 'read-block.tsx',
  'ReadBlock.module.css': 'read-block.css',
  'WebBlock.tsx': 'web-block.tsx',
  'WebBlock.module.css': 'web-block.css',
  'QuotePreview.tsx': 'quote-preview.tsx',
  'QuotePreview.module.css': 'quote-preview.css',
  'DetailDocument.tsx': 'detail-document.tsx',
  'DetailDocument.module.css': 'detail-document.css',
}

/**
 * 官方相对导入 → kit 相对导入。
 * 键是官方源里的字面路径，值是 kit 里的字面路径。
 * `null` 表示**裁掉**（该依赖不进 kit）。
 */
const IMPORT_MAP = {
  // 同族改名
  './incremental.ts': null,                       // 裁：流式增量解析
  './MarkdownText.tsx': './markdown-text.tsx',
  './MarkdownText.module.css': './markdown-text.css',
  './render.tsx': './markdown-render.tsx',
  './parse.ts': './markdown-parse.ts',
  './katex.tsx': './markdown-katex.tsx',
  './file-link.ts': './markdown-file-link.ts',
  './plain-text.ts': './markdown-plain-text.ts',
  './quote-text.ts': './markdown-quote-text.ts',
  './local-image-syntax.ts': './markdown-local-image-syntax.ts',
  './windows-path-destinations.ts': './markdown-windows-path-destinations.ts',
  './cjkFriendlyStrong.ts': './markdown-cjk-friendly-strong.ts',
  './mathCompatibility.ts': './markdown-math-compatibility.ts',
  './MarkdownDelegate.tsx': './markdown-delegate.tsx',
  './useViewportHighlighting.ts': './markdown-viewport-highlighting.ts',
  './highlight.ts': './code-highlighting.ts',
  './CodeBlock.tsx': './code-block.tsx',
  './CodeToolbar.tsx': './code-toolbar.tsx',
  './CodeCard.module.css': './code-card.css',
  './ReadBlock.module.css': './read-block.css',
  './WebBlock.module.css': './web-block.css',
  './QuotePreview.module.css': './quote-preview.css',
  './DetailDocument.module.css': './detail-document.css',
  '../CodeToolbar.tsx': './code-toolbar.tsx',
  '../CodeCard.module.css': './code-card.css',
  '../FoldToggle.tsx': './fold-toggle.tsx',
  '../clipboard.ts': './clipboard.ts',
  '../Button.tsx': './button.tsx',
  '../StateDot.tsx': './state-dot.tsx',
  '../HoverCard.tsx': './hover-card.tsx',
  '../ImageLightbox.tsx': './image-lightbox.tsx',
  '../ImagePreview.tsx': './image-preview.tsx',
  '../icons/index.tsx': './icons.tsx',
  '../LinkIcon.tsx': './markdown-link-icon.tsx',  // 换 kit 自有简化版
  '../FileTypeIcon.tsx': null,                    // 裁：DSH 文件类型表
  '../DraggableImage.tsx': null,                  // 裁：DSH file-drag 耦合
  '../file-drag-actions.ts': null,                // 裁：DSH workspace 类型
  './markdown/MarkdownText.tsx': './markdown-text.tsx',
  './markdown/highlight.ts': './code-highlighting.ts',
  './markdown/useViewportHighlighting.ts': './markdown-viewport-highlighting.ts',
  './markdown/render.tsx': './markdown-render.tsx',
}

/** kit 头注（保真复制说明 + 裁剪说明）。 */
function header(kitFile, official) {
  return `// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/${official} @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：${official} → kit 路径：${kitFile}
`
}

mkdirSync(SRC, { recursive: true })
let copied = 0
let skipped = 0
for (const [official, kitFile] of Object.entries(FILES)) {
  const from = join(OFFICIAL, official)
  const to = join(SRC, kitFile)
  if (!existsSync(from)) {
    console.error(`[import-markdown] 官方源缺失：${from}`)
    process.exit(1)
  }
  if (existsSync(to) && !force) {
    skipped += 1
    continue
  }
  let text = readFileSync(from, 'utf8')
  // 导入路径改写（只改 from '...' 的字面量）
  for (const [officialSpec, kitSpec] of Object.entries(IMPORT_MAP)) {
    if (kitSpec === null) continue
    text = text.split(`'${officialSpec}'`).join(`'${kitSpec}'`)
  }
  // CSS 导入：官方的 `import css from './X.module.css'` 改成 kit 约定的具名导入
  text = text.replace(
    /import\s+css\s+from\s+'\.\/([\w-]+)\.module\.css'/g,
    (_all, base) => `import { css } from './${base}.css'`,
  )
  text = text.replace(
    /import\s+(\w+)\s+from\s+'\.\/([\w-]+)\.module\.css'/g,
    (_all, ident, base) => `import { css as ${ident} } from './${base}.css'`,
  )
  if (kitFile.endsWith('.tsx') || kitFile.endsWith('.ts')) {
    text = header(kitFile, official) + text
  } else {
    text = `/* 保真复制自 DSH 官方 ui-primitives。\n * 上游来源：packages/client/ui-primitives/src/${official} @ dsh v0.2.2-rc.1 (66491b05e3)\n *\n * 2026-11-06 搬入（issue 005）：文件名从官方约定改为 kit 约定（X.module.css → X.css），\n * 类名表机制接管哈希隔离；:global(...) 内的类名原样保留（第三方契约）。\n */\n` + text
  }
  writeFileSync(to, text)
  copied += 1
}
console.log(`[import-markdown] 已搬运 ${copied} 个文件，跳过 ${skipped} 个（已存在；要覆盖加 --force）`)
