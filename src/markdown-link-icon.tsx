// markdown-link-icon：markdown 链接/文件引用的图标（kit 自有简化版）。
//
// 上游对应：packages/client/ui-primitives/src/LinkIcon.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
//   （官方那份的 LinkIconMedium 与 classifyLinkPath）
//
// 为什么不用官方那份（2026-11-06，issue 005）：
//   官方的 LinkIcon 走 `SiteGlyph` → **simple-icons**（36 个站点 mark 的运行时依赖），
//   还有 FileTypeIcon 那一整套 DSH 文件类型表（品牌件）。第三方插件带 simple-icons
//   只是为了「链接前面放个站点图标」，代价与收益不成比例。
//
// kit 的做法：按路径猜一个**文件类型**，用 kit 已有的 inline path 图标里最贴切的一个
//   （代码 → 代码括号、数据 → 数据库、其余 → 通用文件）；认不出就用通用文件图标。
//   视觉上比官方的站点 mark 朴素，但零额外依赖。
//
// 契约（与官方对齐，调用方零改动）：
//   classifyLinkPath(path) → 链接种类（kit 自己的枚举）
//   LinkIconMedium({ kind, className }) → 图标节点

import type { ReactNode } from 'react'
import clsx from 'clsx'
import {
  IconDatabaseOutlineRegular, IconFileOutlineRegular, IconGlobeOutlineRegular, IconWarningOutlineRegular,
} from './icons.tsx'

/** 链接/文件引用的种类（kit 自有枚举，语义对齐官方的 classifyLinkPath）。 */
export type MarkdownLinkKind = 'code' | 'image' | 'data' | 'doc' | 'link' | 'url'

/**
 * 按路径猜链接种类。
 * @param path - 链接目标（路径或 URL）。
 * @returns 种类。
 */
export function classifyLinkPath(path: string): MarkdownLinkKind {
  const lower = path.toLowerCase()
  if (/\.(?:png|jpe?g|gif|webp|svg|bmp|avif)$/.test(lower)) return 'image'
  if (/\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|c|h|cpp|cs|rb|php|sh|bash|zsh)$/.test(lower)) return 'code'
  if (/\.(?:json|jsonc|ya?ml|toml|ini|csv|parquet)$/.test(lower)) return 'data'
  if (/\.(?:md|mdx|txt|pdf|docx?|rst)$/.test(lower)) return 'doc'
  return 'url'
}

/**
 * 链接图标。
 * @param props.kind - 链接种类。
 * @param props.className - 额外类名。
 * @returns 图标节点。
 */
export function LinkIconMedium({ kind, href, className }: {
  kind: MarkdownLinkKind
  /** 官方签名带 href（图标本体不用它，调用方按官方形态传）→ 接受但不使用。 */
  href?: string | undefined
  className?: string | undefined
}): ReactNode {
  void href
  const Icon = kind === 'data'
    ? IconDatabaseOutlineRegular
    : kind === 'image'
      ? IconWarningOutlineRegular
      : kind === 'link' || kind === 'url'
        ? IconGlobeOutlineRegular
        : IconFileOutlineRegular
  return <Icon size={14} className={clsx(className)} />
}
