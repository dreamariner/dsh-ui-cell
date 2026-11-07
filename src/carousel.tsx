// carousel：本仓自有组件（功能对齐 shadcn carousel，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。
import { forwardRef, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './carousel.css'

export interface CarouselProps {
  items: ReactNode[]
  /** 每页滚动数量（scroll-snap 按项吸附）。 */
  ariaLabel?: string
  className?: string
}

/** 滑动画廊：scroll-snap 吸附 + 左右按钮 + 页点（无轮播库依赖）。 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ items, ariaLabel = '轮播', className }, ref) => {
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)
    const scrollTo = (target: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, target))
      const track = trackRef.current
      if (track !== null) {
        const child = track.children[clamped] as HTMLElement | undefined
        if (child !== undefined) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: 'smooth' })
      }
      setIndex(clamped)
    }
    return (
      <div ref={ref} className={clsx(css.carousel, className)} role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
        <div className={css.trackRow}>
          <button type="button" aria-label="上一项" className={css.arrow} disabled={index === 0} onClick={() => scrollTo(index - 1)}>‹</button>
          <div
            ref={trackRef}
            className={css.track}
            onScroll={(event) => {
              const track = event.currentTarget
              const child = track.children[0] as HTMLElement | undefined
              if (child === undefined) return
              const step = child.offsetWidth + 12
              setIndex(Math.round(track.scrollLeft / step))
            }}
          >
            {items.map((item, index2) => (
              <div key={index2} className={css.slide}>{item}</div>
            ))}
          </div>
          <button type="button" aria-label="下一项" className={css.arrow} disabled={index >= items.length - 1} onClick={() => scrollTo(index + 1)}>›</button>
        </div>
        <div className={css.dots} role="tablist" aria-hidden="true">
          {items.map((_, index2) => (
            <button
              key={index2}
              type="button"
              tabIndex={-1}
              data-current={index2 === index || undefined}
              className={css.dot}
              onClick={() => scrollTo(index2)}
            />
          ))}
        </div>
      </div>
    )
  },
)
Carousel.displayName = 'Carousel'
