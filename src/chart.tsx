// chart：本仓自有组件（功能对齐 shadcn chart，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。（诚实声明：shadcn chart 基于 recharts；本实现是零依赖的极简柱/线/迷你图，满足轻量展示，不做坐标轴体系与交互刷选）
import { forwardRef } from 'react'
import clsx from 'clsx'
import css from './chart.css'

export interface ChartDatum {
  label: string
  value: number
}

export interface BarChartProps {
  data: ChartDatum[]
  height?: number
  className?: string
  ariaLabel?: string
}

/** 极简柱状图：div 条 + 别名色，label/title 由 title 属性提供。 */
export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(
  ({ data, height = 120, className, ariaLabel = '柱状图' }, ref) => {
    const max = Math.max(...data.map((d) => d.value), 1)
    return (
      <div ref={ref} role="img" aria-label={ariaLabel} className={clsx(css.barChart, className)} style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className={css.barSlot} title={d.label + ': ' + d.value}>
            <div className={css.bar} style={{ height: (d.value / max) * 100 + '%' }} />
            <span className={css.barLabel}>{d.label}</span>
          </div>
        ))}
      </div>
    )
  },
)
BarChart.displayName = 'BarChart'

export interface LineChartProps {
  values: number[]
  height?: number
  className?: string
  ariaLabel?: string
}

/** 极简折线：SVG polyline，viewBox 归一化。 */
export const LineChart = forwardRef<SVGSVGElement, LineChartProps>(
  ({ values, height = 80, className, ariaLabel = '折线图' }, ref) => {
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const span = max - min || 1
    const step = values.length > 1 ? 100 / (values.length - 1) : 0
    const points = values.map((v, i) => (i * step).toFixed(2) + ',' + (100 - ((v - min) / span) * 100).toFixed(2)).join(' ')
    return (
      <svg
        ref={ref}
        role="img"
        aria-label={ariaLabel}
        className={clsx(css.lineChart, className)}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <polyline className={css.line} points={points} vectorEffect="non-scaling-stroke" />
      </svg>
    )
  },
)
LineChart.displayName = 'LineChart'

export interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  className?: string
}

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(
  ({ values, width = 72, height = 20, className }, ref) => {
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const span = max - min || 1
    const step = values.length > 1 ? width / (values.length - 1) : 0
    const points = values.map((v, i) => (i * step).toFixed(1) + ',' + (height - ((v - min) / span) * height).toFixed(1)).join(' ')
    return (
      <svg ref={ref} aria-hidden="true" className={clsx(css.sparkline, className)} width={width} height={height} viewBox={'0 0 ' + width + ' ' + height}>
        <polyline className={css.line} points={points} />
      </svg>
    )
  },
)
Sparkline.displayName = 'Sparkline'
