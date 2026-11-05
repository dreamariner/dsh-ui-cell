// data-table：kit 自有组件（功能对齐 shadcn data-table，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；token 纪律与类名约定同 kit 全体。
import { useState } from 'react'
import clsx from 'clsx'
import css from './data-table.css'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'

export interface DataTableColumn<T> {
  key: string
  header: string
  /** 单元格渲染；缺省直接显示 row[key]。 */
  render?: (row: T) => React.ReactNode
  /** 可排序时给出取值；缺省取 row[key]。 */
  sortValue?: (row: T) => string | number
  /** 对齐表头指示箭头方向：asc / desc。 */
  align?: 'left' | 'right'
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** 行 key 取值，缺省用数组下标。 */
  rowKey?: (row: T, index: number) => string
  /** 空态文案。 */
  emptyText?: string
}

/** 轻数据表：排序内置（点击表头切换 asc/desc），无外部表格库依赖。 */
export function DataTable<T>({ columns, rows, rowKey, emptyText = '暂无数据' }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | undefined>()
  const sorted = (() => {
    if (sort === undefined) return rows
    const column = columns.find((c) => c.key === sort.key)
    if (column === undefined) return rows
    const value = column.sortValue ?? ((row: T) => (row as Record<string, string | number>)[sort.key])
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va === vb) return 0
      return (va > vb ? 1 : -1) * dir
    })
  })()
  const toggleSort = (key: string, sortable: boolean) => {
    if (!sortable) return
    setSort((prev) => (prev?.key !== key ? { key, dir: 'asc' } : prev.dir === 'asc' ? { key, dir: 'desc' } : undefined))
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              aria-sort={sort?.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              className={clsx(css.headButton, column.align === 'right' && css.right)}
            >
              <button
                type="button"
                className={css.sortButton}
                onClick={() => toggleSort(column.key, true)}
              >
                {column.header}
                <span className={css.arrow} data-state={sort?.key === column.key ? sort.dir : undefined} aria-hidden="true">↕</span>
              </button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0
          ? <TableRow><TableCell className={css.empty}>{emptyText}</TableCell></TableRow>
          : sorted.map((row, index) => (
            <TableRow key={rowKey !== undefined ? rowKey(row, index) : index}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.align === 'right' ? css.right : undefined}>
                  {column.render !== undefined ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
