// 保真复制自 DSH 官方 ui-primitives。
// 上游来源：packages/client/ui-primitives/src/markdown/MarkdownDelegate.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
//
// 2026-11-06 搬入（issue 005）：markdown 家族原先因「零依赖纪律」暂缓，现按分层纪律
// 归入 content 档（带 npm 重依赖）。本文件是**机械搬运 + 导入路径改写**的产物，
// 语义裁剪见 docs/issues/005（流式增量解析、DraggableImage、简化 LinkIcon、KaTeX CSS 文本化）。
// 官方路径：markdown/MarkdownDelegate.tsx → kit 路径：markdown-delegate.tsx
/** Consumer-owned navigation for Markdown links. */
import { createContext, useContext, useMemo } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import type { ImageLightboxLabels } from './image-lightbox.tsx'

/**
 * Handle one sanitized absolute HTTP(S) URL selected from Markdown.
 * @param href - destination URL.
 */
export type MarkdownExternalLinkHandler = (href: string) => void

/** Explicit object and viewport coordinates from the element owning a context gesture. */
export type MarkdownMenuTarget =
  | { kind: 'file'; path: string; line?: number }
  | { kind: 'url'; url: string }
  | { kind: 'image'; url: string; path?: string; name?: string; mediaType?: string }

/** Navigation capabilities supplied by the nearest Markdown owner. */
export interface MarkdownDelegate {
  /** Open an object menu without executing its normal activation. */
  readonly getTriggerProps?: ((target: MarkdownMenuTarget) => Pick<HTMLAttributes<HTMLElement>, 'onContextMenu' | 'onKeyDown' | 'tabIndex'>) | undefined
  /**
   * Image previews for decoded local paths in this owner's workspace. The renderer
   * appends a per-mount `load` query parameter to `api/file` route URLs.
   */
  readonly fileImages?: {
    /** 官方这里是 DSH 的 FileDragActions（拖拽导出文件，DSH workspace 耦合）；kit 裁掉了。 */
    resolve: (path: string) => string | undefined
    resourceAddress?: ((path: string) => string) | undefined
    labels: ImageLightboxLabels & { open: string; loading: string; failed: string }
  } | undefined
  /** Ordinary HTTP(S) activation; absent handlers retain native anchor behavior. */
  readonly openExternalLink?: MarkdownExternalLinkHandler | undefined
  /**
   * Open a decoded local destination from settled Markdown; absent handlers leave plain text.
   * @param path - Absolute or workspace-relative file path.
   * @param options - First line to reveal when the destination specifies a line or range.
   */
  readonly openFile?: ((path: string, options?: { line?: number }) => void) | undefined
}

const MarkdownDelegateContext = createContext<MarkdownDelegate>({})

/** Props for one Markdown navigation scope. */
export interface MarkdownDelegateProviderProps extends MarkdownDelegate {
  readonly children: ReactNode
}

/**
 * Scope Markdown navigation without threading callbacks through renderers.
 * Nested providers replace the enclosing capabilities. Handler changes reach cached links.
 * @param props - Child tree and its file and HTTP(S) link handlers.
 * @returns the scoped child tree.
 */
export function MarkdownDelegateProvider({
  children,
  openExternalLink,
  openFile,
  fileImages,
  getTriggerProps,
}: MarkdownDelegateProviderProps): ReactNode {
  const delegate = useMemo(() => ({ openExternalLink, openFile, fileImages, getTriggerProps }),
    [openExternalLink, openFile, fileImages, getTriggerProps])
  return (
    <MarkdownDelegateContext.Provider value={delegate}>
      {children}
    </MarkdownDelegateContext.Provider>
  )
}

/**
 * Read the nearest Markdown navigation capabilities.
 * @returns Owner callbacks, or an empty delegate outside a provider.
 */
export function useMarkdownDelegate(): MarkdownDelegate {
  return useContext(MarkdownDelegateContext)
}
