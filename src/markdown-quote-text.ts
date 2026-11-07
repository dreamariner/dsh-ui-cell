// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/quote-text.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/quote-text.ts → 本仓路径：markdown-quote-text.ts
/** Shared Markdown blockquote formatting for browser text. */

/**
 * Project selected visible text as an ordinary Markdown blockquote.
 * @param text - selected visible text without quote markers.
 * @returns one `> `-prefixed line per normalized input line.
 */
export function formatQuoteText(text: string): string {
  return text.replace(/\r\n?/gu, '\n').split('\n').map(line => `> ${line}`).join('\n')
}
