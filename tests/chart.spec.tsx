// dsh-ui-cell :: chart 趋势扩能（issue 011）
//
// 钉五条契约：
//   1. 既有 BarChart / LineChart / Sparkline 行为不变（单序列糖回归）；
//   2. TrendChart 分组柱：逐类目 series.length 根柱，title 汇总读数；
//   3. 叠加折线：点位落在类目槽中心（x = (i + 0.5) / n × 100）；
//   4. highlightIndex：柱槽 / 刻度 / 折线打点三处联动；
//   5. 图例随多序列 / 折线出现且可关；空数据不炸。
//
// 注意：css import 在本仓测试里被 vitest 桩掉（css.toneBrand 为 undefined），
// 一切查询走 role / aria / data-* / title / 结构位置，不耦合类名。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BarChart, LineChart, Sparkline, TrendChart } from '../src/chart.tsx'

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

const LABELS = ['2025-12', '2026-01', '2026-02']

describe('既有三组件行为不变（回归）', () => {
  it('BarChart：单序列柱与 label、title 读数', () => {
    render(createElement(BarChart, { data: [{ label: '一月', value: 3 }, { label: '二月', value: 6 }] }))
    const slots = container!.querySelectorAll('[title]')
    expect(slots).toHaveLength(2)
    expect(slots[1].getAttribute('title')).toBe('二月: 6')
    expect(slots[0].textContent).toContain('一月')
  })

  it('LineChart：polyline 点数与值一致', () => {
    render(createElement(LineChart, { values: [1, 2, 3] }))
    const points = container!.querySelector('polyline')!.getAttribute('points')!.split(' ')
    expect(points).toHaveLength(3)
  })

  it('Sparkline：尺寸透传', () => {
    render(createElement(Sparkline, { values: [2, 4], width: 40, height: 10 }))
    const svg = container!.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('height')).toBe('10')
  })
})

describe('TrendChart 分组柱与折线', () => {
  const series = [
    { name: '收入', values: [10, 20, 30], tone: 'success' as const },
    { name: '支出', values: [5, 8, 12], tone: 'error' as const },
  ]

  it('逐类目 series.length 根柱；title 汇总折线与柱读数', () => {
    render(createElement(TrendChart, {
      labels: LABELS, series,
      line: { name: '存钱净结余', values: [100, 110, 120] },
    }))
    const slots = container!.querySelectorAll('[title]')
    expect(slots).toHaveLength(3)
    for (const slot of slots) {
      // 每类目两根柱（收入 / 支出）
      expect(slot.children[0]!.childElementCount).toBe(2)
    }
    expect(slots[0].getAttribute('title')).toBe('2025-12: 存钱净结余 100 / 收入 10 / 支出 5')
  })

  it('折线点位落在类目槽中心：x = (i + 0.5) / n × 100', () => {
    render(createElement(TrendChart, {
      labels: LABELS, series,
      line: { name: '存钱净结余', values: [100, 110, 120] },
    }))
    const points = container!.querySelector('polyline')!.getAttribute('points')!.split(' ')
    expect(points).toHaveLength(3)
    const xs = points.map((p) => Number(p.split(',')[0]))
    expect(xs[0]).toBeCloseTo((0.5 / 3) * 100, 1)
    expect(xs[1]).toBeCloseTo((1.5 / 3) * 100, 1)
    expect(xs[2]).toBeCloseTo((2.5 / 3) * 100, 1)
  })

  it('highlightIndex：柱槽与刻度联动标记，折线打点出现', () => {
    render(createElement(TrendChart, {
      labels: LABELS, series,
      line: { name: '存钱净结余', values: [100, 110, 120] },
      highlightIndex: 2,
    }))
    const highlighted = container!.querySelectorAll('[data-highlight]')
    // 柱槽 + 刻度两处
    expect(highlighted).toHaveLength(2)
    expect(highlighted[1]!.textContent).toBe('2026-02')
    // 打点：一个圆点 span
    expect(container!.querySelectorAll('span[style*="left"]').length).toBeGreaterThan(0)
  })

  it('无高亮时无 data-highlight、无打点', () => {
    render(createElement(TrendChart, {
      labels: LABELS, series,
      line: { name: '存钱净结余', values: [100, 110, 120] },
    }))
    expect(container!.querySelectorAll('[data-highlight]')).toHaveLength(0)
    expect(container!.querySelectorAll('span[style*="left"]')).toHaveLength(0)
  })

  it('图例：多序列 + 折线默认出现，showLegend=false 可关', () => {
    render(createElement(TrendChart, {
      labels: LABELS, series,
      line: { name: '存钱净结余', values: [100, 110, 120] },
    }))
    const text = container!.textContent!
    expect(text).toContain('收入')
    expect(text).toContain('支出')
    expect(text).toContain('存钱净结余')

    render(createElement(TrendChart, {
      labels: LABELS, series, showLegend: false,
      line: { name: '存钱净结余', values: [100, 110, 120] },
    }))
    expect(container!.textContent).not.toContain('存钱净结余')
  })

  it('单序列柱不带折线时不显示图例（无信息可图例）', () => {
    render(createElement(TrendChart, { labels: LABELS, series: [{ name: '支出', values: [1, 2, 3] }] }))
    expect(container!.textContent).not.toContain('支出')
  })

  it('空 labels / 空序列不炸，role=img 仍在', () => {
    render(createElement(TrendChart, { labels: [], series: [] }))
    expect(container!.querySelector('[role="img"]')).not.toBeNull()
    expect(container!.querySelectorAll('[title]')).toHaveLength(0)
    // 短序列：values 比 labels 短按 0 补
    render(createElement(TrendChart, { labels: LABELS, series: [{ name: '支出', values: [4] }] }))
    const slots = container!.querySelectorAll('[title]')
    expect(slots[1]!.getAttribute('title')).toBe('2026-01: 支出 0')
  })
})
