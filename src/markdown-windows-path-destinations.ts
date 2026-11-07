// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/windows-path-destinations.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/windows-path-destinations.ts → 本仓路径：markdown-windows-path-destinations.ts
/** Keep backslash separators in Markdown destinations written as Windows paths. */
import type { Definition, Image, Link } from 'mdast'
import type { CompileContext, Extension, Token } from 'mdast-util-from-markdown'
import { decodeString } from 'micromark-util-decode-string'

/**
 * A raw destination is a Windows path when it has a backslash and no URL
 * scheme, and either has no `/` or has a backslash before a letter or digit,
 * which CommonMark cannot read as an escape. A drive letter is not a scheme.
 */
function isWindowsPath(raw: string): boolean {
  return raw.includes('\\') && !/^[a-z][a-z\d+.-]+:/iu.test(raw)
    && (!raw.includes('/') || /\\[\p{L}\p{N}]/u.test(raw))
}

function exitDestination(this: CompileContext, token: Token): void {
  const parsed = this.resume()
  const raw = this.sliceSerialize(token)
  const node = this.stack.at(-1) as Link | Image | Definition
  // Doubling each backslash makes every one literal; character references still decode.
  node.url = isWindowsPath(raw) ? decodeString(raw.replaceAll('\\', '\\\\')) : parsed
}

/**
 * CommonMark reads `\.` or `\_` in a destination as an escaped character, so
 * `D:\repo\.github` would parse as `D:\repo.github`. For a destination that
 * is a Windows path, this `fromMarkdown` extension keeps every backslash
 * literally, including one before punctuation such as `\(`, while character
 * references such as `&amp;` still decode; other destinations parse unchanged.
 * @returns The mdast extension.
 */
export function windowsPathDestinations(): Extension {
  return { exit: { resourceDestinationString: exitDestination, definitionDestinationString: exitDestination } }
}
