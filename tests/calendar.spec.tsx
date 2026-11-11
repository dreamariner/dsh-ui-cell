// dsh-ui-cell :: calendar / date-picker 月份模式（issue 010）
//
// 钉五条契约：
//   1. month 模式渲染 12 个月格，头部只出年份，‹ › 按年翻（跨年正确）；
//   2. 点选月份回调该月 1 日；今日格带 data-today；
//   3. disabled 谓词在 month 模式按月生效；
//   4. 受控值 day（YYYY-MM-DD）与 month（YYYY-MM）都能解析出选中态（fromIso `\d` 修复回归）；
//   5. 传 disabled 谓词时触发器仍可打开（触发器误禁修复回归）。
//
// 注意：本仓内部测试的 css import 被 vitest 桩掉（css.monthLabel 为 undefined），
// 一切查询走 aria-label / role / data-* / 结构位置，不耦合类名。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Calendar } from '../src/calendar.tsx'
import { DatePicker } from '../src/date-picker.tsx'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLDivElement | undefined

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = undefined
  container = undefined
})

const render = (element: ReactElement): void => {
  act(() => { root?.render(element) })
}

/** 头部年月文案：‹ 按钮（结构上第一个导航钮）的父节点第二子。 */
function headerLabel(scope: ParentNode): string | null {
  const nav = scope.querySelector('[aria-label="上一年"], [aria-label="上个月"]')
  return nav?.parentElement?.children[1]?.textContent ?? null
}

function gridCells(scope: ParentNode): HTMLButtonElement[] {
  return [...scope.querySelectorAll('[role="gridcell"]')] as HTMLButtonElement[]
}

describe('Calendar mode="month"', () => {
  it('渲染 12 个月格，头部只出年份', () => {
    render(createElement(Calendar, { mode: 'month', defaultMonth: new Date(2026, 10, 1) }))
    const cells = gridCells(container!)
    expect(cells).toHaveLength(12)
    expect(cells[0].textContent).toBe('1 月')
    expect(cells[10].textContent).toBe('11 月')
    expect(cells[11].textContent).toBe('12 月')
    expect(headerLabel(container!)).toBe('2026 年')
  })

  it('点选月份回调该月 1 日；今日格带 data-today', () => {
    let picked: Date | undefined
    const realMonth = new Date()
    render(createElement(Calendar, {
      mode: 'month',
      defaultMonth: new Date(realMonth.getFullYear(), 0, 1),
      onSelect: (d) => { picked = d },
    }))
    const cells = gridCells(container!)
    act(() => { cells[2].click() })
    expect(picked!.getFullYear()).toBe(realMonth.getFullYear())
    expect(picked!.getMonth()).toBe(2)
    expect(picked!.getDate()).toBe(1)
    const todayCell = cells.find((c) => c.hasAttribute('data-today'))
    expect(todayCell?.textContent).toBe(`${realMonth.getMonth() + 1} 月`)
  })

  it('disabled 谓词按月生效（月格禁用，回调不触发）', () => {
    let picked: Date | undefined
    render(createElement(Calendar, {
      mode: 'month',
      defaultMonth: new Date(2026, 0, 1),
      disabled: (d) => d.getFullYear() === 2026 && d.getMonth() >= 6,
      onSelect: (d) => { picked = d },
    }))
    const cells = gridCells(container!)
    expect(cells[6].disabled).toBe(true)   // 7 月
    expect(cells[5].disabled).toBe(false)  // 6 月
    act(() => { cells[6].click() })
    expect(picked).toBeUndefined()
  })

  it('‹ › 按年翻页且跨年正确', () => {
    render(createElement(Calendar, { mode: 'month', defaultMonth: new Date(2026, 0, 1) }))
    const prev = container!.querySelector('[aria-label="上一年"]') as HTMLButtonElement
    const next = container!.querySelector('[aria-label="下一年"]') as HTMLButtonElement
    act(() => { prev.click() })
    expect(headerLabel(container!)).toBe('2025 年')
    act(() => { next.click() })
    act(() => { next.click() })
    expect(headerLabel(container!)).toBe('2027 年')
  })

  it('day 模式默认不受影响：月头出年月、格子数随当月天数', () => {
    render(createElement(Calendar, { defaultMonth: new Date(2026, 1, 1) })) // 2026-02，28 天
    expect(gridCells(container!)).toHaveLength(28)
    expect(headerLabel(container!)).toBe('2026 年 2 月')
  })
})

describe('DatePicker mode', () => {
  const openPopover = (): HTMLElement => {
    const trigger = container!.querySelector('button')!
    act(() => { trigger.click() })
    return document.body
  }

  it('month 模式：受控 YYYY-MM 高亮对应月格，选择回调 YYYY-MM（fromIso 修复回归）', () => {
    let picked: string | undefined
    render(createElement(DatePicker, { mode: 'month', value: '2026-11', onChange: (v) => { picked = v } }))
    const body = openPopover()
    const selected = body.querySelectorAll('[role="gridcell"][data-selected], [role="gridcell"][aria-selected="true"]')
    expect(selected).toHaveLength(1)
    expect(selected[0].textContent).toBe('11 月')
    act(() => { (selected[0] as HTMLButtonElement).click() })
    expect(picked).toBe('2026-11')
  })

  it('day 模式：受控 YYYY-MM-DD 高亮对应日（fromIso `\d` 修复回归）', () => {
    render(createElement(DatePicker, { value: '2026-11-11' }))
    const body = openPopover()
    const selected = body.querySelectorAll('[role="gridcell"][data-selected], [role="gridcell"][aria-selected="true"]')
    expect(selected).toHaveLength(1)
    expect(selected[0].textContent).toBe('11')
  })

  it('传 disabled 谓词时触发器仍可打开（触发器误禁修复回归）', () => {
    render(createElement(DatePicker, { disabled: () => false }))
    const trigger = container!.querySelector('button')!
    expect(trigger.disabled).toBe(false)
    const body = openPopover()
    expect(body.querySelectorAll('[role="grid"]').length).toBeGreaterThanOrEqual(1)
  })

  it('month 模式缺省占位「选择月份」，day 模式「选择日期」', () => {
    render(createElement(DatePicker, { mode: 'month' }))
    expect(container!.querySelector('button')!.textContent).toContain('选择月份')
    render(createElement(DatePicker, { mode: 'day' }))
    expect(container!.querySelectorAll('button')[0].textContent).toContain('选择日期')
  })
})
