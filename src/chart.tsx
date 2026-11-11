// chart：本仓自有组件（功能对齐 shadcn chart，样式沿用 DSH 设计 token）。
// 上游来源：无官方对应原子；行为手写、零第三方依赖。（诚实声明：shadcn chart 基于 recharts；本实现是零依赖的极简柱/线/迷你图 + 趋势组合图，满足轻量展示，不做坐标轴体系与交互刷选）
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

/** 序列色调：映射组件局部变量 --chart-tone（色值全取官方清单内的 alias token，brand 缺省）。 */
export type ChartTone = 'brand' | 'success' | 'error' | 'warn' | 'neutral'

/** 序列：TrendChart 的分组柱与叠加折线共用。values 与 labels 按下标对齐，短了按 0 补。 */
export interface ChartSeries {
  name: string
  values: number[]
  tone?: ChartTone
}

export interface TrendChartProps {
  /** 类目（X 轴）标签，如账期月份。 */
  labels: string[]
  /** 分组柱序列：每个类目下并排 series.length 根柱。 */
  series: ChartSeries[]
  /** 叠加折线：X 对齐类目中心，**独立归一化**（本组件无坐标轴，只比形态；精确读数看 title 与配套数字）。 */
  line?: ChartSeries
  /** 高亮的类目下标（如当前账期）：柱满不透明 + 刻度提亮 + 折线打点。 */
  highlightIndex?: number
  height?: number
  /** 图例（dot + 系列名）：多序列或带折线时缺省显示。 */
  showLegend?: boolean
  className?: string
  ariaLabel?: string
}

const TONE_CLASS: Record<ChartTone, string | undefined> = {
  brand: css.toneBrand,
  success: css.toneSuccess,
  error: css.toneError,
  warn: css.toneWarn,
  neutral: css.toneNeutral,
}

/**
 * 趋势组合图：分组柱 + 叠加折线 + 当前项高亮。
 * 结构：绘图区（柱行 + 覆盖其上的 absolute 折线 SVG）与刻度行是两组同 gap 同等分的 flex 槽，
 * 槽中心天然对齐；折线点位 x = (i + 0.5) / n × 100（viewBox 归一化 + preserveAspectRatio none
 * 拉伸，non-scaling-stroke 保线宽）；高亮打点用 HTML dot（百分比定位，无 SVG 变形问题）。
 */
export const TrendChart = forwardRef<HTMLDivElement, TrendChartProps>(
  ({ labels, series, line, highlightIndex, height = 140, showLegend = true, className, ariaLabel = '趋势图' }, ref) => {
    const count = labels.length
    const toneClass = (s: ChartSeries): string | undefined => TONE_CLASS[s.tone ?? 'brand']
    if (count === 0 || series.length === 0) {
      return <div ref={ref} role="img" aria-label={ariaLabel} className={clsx(css.trendChart, className)} style={{ height }} />
    }
    const barMax = Math.max(...series.flatMap((s) => s.values), 1)
    const lineMax = line !== undefined ? Math.max(...line.values, 0) : 0
    const lineMin = line !== undefined ? Math.min(...line.values, 0) : 0
    const lineSpan = lineMax - lineMin || 1
    const slotCenter = (i: number): number => ((i + 0.5) / count) * 100
    const linePoints = line !== undefined
      ? line.values.map((v, i) =>
          slotCenter(i).toFixed(2) + ',' + (100 - ((v - lineMin) / lineSpan) * 100).toFixed(2),
        ).join(' ')
      : undefined
    const slotTitle = (i: number): string => {
      const parts = series.map((s) => `${s.name} ${s.values[i] ?? 0}`)
      if (line !== undefined) parts.unshift(`${line.name} ${line.values[i] ?? 0}`)
      return `${labels[i]}: ${parts.join(' / ')}`
    }
    const hasLegend = showLegend && (series.length > 1 || line !== undefined)
    const dotTop = highlightIndex !== undefined && line !== undefined && line.values[highlightIndex] !== undefined
      ? 100 - ((line.values[highlightIndex]! - lineMin) / lineSpan) * 100
      : undefined
    return (
      <div ref={ref} role="img" aria-label={ariaLabel} className={clsx(css.trendChart, className)} style={{ height }}>
        <div className={css.plot}>
          <div className={css.barsRow}>
            {labels.map((label, i) => (
              <div key={label + ':' + i} className={css.slot} data-highlight={i === highlightIndex || undefined} title={slotTitle(i)}>
                <div className={css.barStack}>
                  {series.map((s) => (
                    <div
                      key={s.name}
                      className={clsx(css.trendBar, toneClass(s))}
                      style={{ height: Math.max(((s.values[i] ?? 0) / barMax) * 100, 0) + '%' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {line !== undefined && (
            <svg className={css.lineLayer} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline className={clsx(css.line, toneClass(line))} points={linePoints} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {dotTop !== undefined && (
            <span
              className={clsx(css.lineDot, toneClass(line!))}
              style={{ left: slotCenter(highlightIndex!) + '%', top: dotTop + '%' }}
            />
          )}
        </div>
        <div className={css.labelRow}>
          {labels.map((label, i) => (
            <span key={'label:' + i} className={css.slotLabel} data-highlight={i === highlightIndex || undefined}>{label}</span>
          ))}
        </div>
        {hasLegend && (
          <div className={css.legend}>
            {series.map((s) => (
              <span key={'legend:' + s.name} className={css.legendItem}>
                <span aria-hidden="true" className={clsx(css.legendDot, toneClass(s))} />
                {s.name}
              </span>
            ))}
            {line !== undefined && (
              <span key="legend:line" className={css.legendItem}>
                <span aria-hidden="true" className={clsx(css.legendLine, toneClass(line))} />
                {line.name}
              </span>
            )}
          </div>
        )}
      </div>
    )
  },
)
TrendChart.displayName = 'TrendChart'
