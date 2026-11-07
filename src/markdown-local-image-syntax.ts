// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/local-image-syntax.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/local-image-syntax.ts → 本仓路径：markdown-local-image-syntax.ts
/** Recover standalone local image references with bare spaces without changing code or source offsets. */
import type { Root, RootContent, PhrasingContent } from 'mdast'

/**
 * Recover only unambiguous, unescaped image-only paragraphs containing a local path with spaces.
 * @param root - Parsed Markdown tree, modified in place.
 * @param source - Original source used to distinguish authored syntax from escaped examples.
 * @returns The same root with recovered image nodes.
 */
/**
 * 判断路径是不是图片（官方用 DSH 的 classifyFileType，那是一整套品牌文件类型表；
 * 这里只需要「是不是图片」这一个判断，故按扩展名直接判）。
 */
function isImagePath(path: string): boolean {
  return /\.(?:png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path)
}
export function recoverLocalImages(root: Root, source: string): Root {
  const visit = (node: Root | RootContent): void => {
    if (node.type === 'paragraph' && node.children.length === 1) {
      const [child] = node.children as [PhrasingContent]
      if (child.type === 'text' && child.position !== undefined
        && source.slice(child.position.start.offset, child.position.end.offset) === child.value) {
        const pattern = /^!\[([^\]\n]*)\]\(((?:\/(?!\/)|\.{1,2}\/|[a-z]:[\\/])[^\n<>()[\]"']+\.[a-z\d]+)\)$/iu
        const match = pattern.exec(child.value) as [string, string, string] | null
        if (match !== null && match[2].includes(' ') && isImagePath(match[2])) {
          node.children = [{ type: 'image', alt: match[1], url: match[2], position: child.position }]
        }
      }
    } else if ('children' in node) {
      for (const child of node.children) visit(child)
    }
  }
  visit(root)
  return root
}
