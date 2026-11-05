// avatar：kit 自有组件（功能对齐 shadcn avatar，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import css from './avatar.css'

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string
  alt?: string
  /** 加载失败或无 src 时的回退内容（通常为首字母）。 */
  fallback?: React.ReactNode
  /** 方边长（px），默认 24。 */
  size?: number
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, fallback, size = 24, className, style, ...props }, ref) => {
    const [failed, setFailed] = useState(false)
    return (
      <span
        ref={ref}
        className={clsx(css.avatar, className)}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42), ...style }}
        {...props}
      >
        {src !== undefined && !failed
          ? <img className={css.image} src={src} alt={alt ?? ''} onError={() => setFailed(true)} />
          : <span className={css.fallback}>{fallback}</span>}
      </span>
    )
  },
)
Avatar.displayName = 'Avatar'
