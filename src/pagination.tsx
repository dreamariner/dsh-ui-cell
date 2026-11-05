// pagination：kit 自有组件（功能对齐 shadcn pagination，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；锚定/ dismissal 行为复用 kit 的官方行为模块。
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './pagination.css'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange?: (page: number) => void
  /** 当前页两侧保留的页码数，默认 1。 */
  siblingCount?: number
  className?: string
}

function pageWindow(page: number, totalPages: number, siblings: number): (number | 'ellipsis-l' | 'ellipsis-r')[] {
  const pages: (number | 'ellipsis-l' | 'ellipsis-r')[] = []
  const start = Math.max(2, page - siblings)
  const end = Math.min(totalPages - 1, page + siblings)
  if (start > 2) pages.push('ellipsis-l')
  for (let p = start; p <= end; p += 1) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis-r')
  return [1, ...pages, totalPages]
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  ({ page, totalPages, onPageChange, siblingCount = 1, className }, ref) => {
    if (totalPages <= 1) return null
    const go = (target: number) => { if (target >= 1 && target <= totalPages && target !== page) onPageChange?.(target) }
    return (
      <nav ref={ref} aria-label="分页" className={clsx(css.pagination, className)}>
        <button type="button" className={css.navButton} disabled={page === 1} aria-label="上一页" onClick={() => go(page - 1)}>‹</button>
        {pageWindow(page, totalPages, siblingCount).map((entry) =>
          entry === 'ellipsis-l' || entry === 'ellipsis-r'
            ? <span key={entry} className={css.ellipsis} aria-hidden="true">…</span>
            : (
              <button
                key={entry}
                type="button"
                aria-current={entry === page ? 'page' : undefined}
                aria-label={'第 ' + entry + ' 页'}
                data-current={entry === page || undefined}
                className={css.pageButton}
                onClick={() => go(entry)}
              >
                {entry}
              </button>
            ),
        )}
        <button type="button" className={css.navButton} disabled={page === totalPages} aria-label="下一页" onClick={() => go(page + 1)}>›</button>
      </nav>
    )
  },
)
Pagination.displayName = 'Pagination'
