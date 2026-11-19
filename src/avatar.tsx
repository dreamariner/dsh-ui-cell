// avatar：本仓自有组件（功能对齐 shadcn avatar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同本仓全体。
//
// 回退文字的字号按字数缩放（2026-11-18，issue 018）：圆形头像的可用宽度是**内切正方形**
// （边长 size/√2 ≈ 0.707·size），一行 n 个全角字要放得下，字号比例就不能超过 0.707/n。
// 原来的固定 0.42 比例在两个字时就超了（实测 32px 头像里「助手」两个字占 30px，
// 而内切正方形只有 22.6px）→ 字的左右两端被圆形裁掉，看着像缺笔画。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Avatar } from './avatar.tsx'
//   <Avatar fallback="林" />
//   <Avatar src={badUrl} fallback="L" /> {/* 加载失败自动回退 */}
// ────────────────────────────────────────────────────────────────────────

import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './avatar.css'

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string
  alt?: string
  /** 加载失败或无 src 时的回退内容（通常为首字母；纯文本超过 3 个字只取前 3 个）。 */
  fallback?: React.ReactNode
  /** 方边长（px），默认 24。 */
  size?: number
}

/** 回退文字的最大字数（再多也放不下，只取前 3 个）。 */
const MAX_FALLBACK_CHARS = 3

/**
 * 回退文字的字号比例（按字数档）。
 * 内切正方形约束：n 个全角字的宽度 = n × 字号 ≤ 0.707 × 边长。
 * 1 个字给 0.42（好看且留足余量），2 个 0.33，3 个 0.22（都留了一点余量）。
 */
const FALLBACK_RATIO = [0.42, 0.33, 0.22] as const

/** 纯文本回退：截到最多 3 个字，并给出对应的字号比例。 */
function fallbackText(text: string): { text: string; ratio: number } {
  const chars = [...text]
  const shown = chars.slice(0, MAX_FALLBACK_CHARS)
  return {
    text: shown.join(''),
    ratio: FALLBACK_RATIO[Math.min(shown.length, MAX_FALLBACK_CHARS) - 1]!,
  }
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, fallback, size = 24, className, style, ...props }, ref) => {
    const [failed, setFailed] = useState(false)
    // 纯文本回退按字数缩字号；非文本（图标等）交给使用方自己定尺寸
    const text = typeof fallback === 'string' ? fallbackText(fallback) : undefined
    return (
      <span
        ref={ref}
        className={clsx(css.avatar, className)}
        style={{ width: size, height: size, fontSize: Math.round(size * (text?.ratio ?? FALLBACK_RATIO[0])), ...style }}
        {...props}
      >
        {src !== undefined && !failed
          ? <img className={css.image} src={src} alt={alt ?? ''} onError={() => setFailed(true)} />
          : <span className={css.fallback}>{text?.text ?? fallback}</span>}
      </span>
    )
  },
)
Avatar.displayName = 'Avatar'
