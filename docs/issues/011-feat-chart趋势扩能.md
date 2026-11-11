---
id: 011
type: feat
title: chart 趋势扩能：TrendChart（多序列分组柱 + 柱线组合 + 当前项高亮）
status: doing
priority: P1
labels: [chart, 组件行为]
created: 2026-11-12
updated: 2026-11-12
assignee: lin
related: [010]
---

# 011 · feat · chart 趋势扩能：TrendChart

## 背景

消费端（dsh-ledger 家庭资金规划，006 仪表盘重规划）需要一张收支趋势图：近 12 账期
**收入 / 支出双序列分组柱** + **存钱净结余折线叠加** + **当前账期高亮**。现有 chart 原子
（registry 描述：「极简图表：柱/线/迷你图（零依赖；shadcn chart 的 recharts 不引入）」）
只有单序列柱（BarChart）、单折线（LineChart）、迷你图（Sparkline）：

- 无多序列分组（一柱一序列）；
- 无柱 + 线组合（两个组件坐标系互不相认）；
- 无逐项高亮（无法标「当前账期」）。

仓定位是极简零依赖（不做坐标轴体系与交互刷选），本 issue 在**不碰既有三组件**的前提下
补一个 TrendChart 覆盖上述三件事，仍守零依赖与「无坐标轴」边界。

## 目标

1. 新增 `TrendChart`（chart 条目内，不动 BarChart / LineChart / Sparkline）：
   - `labels: string[]` + `series: ChartSeries[]`：分组柱，每类目 N 根并排柱（N = 序列数）；
   - `line?: ChartSeries`：叠加折线，X 对齐类目中心，独立归一化（无坐标轴，形态对比用）；
   - `highlightIndex?: number`：高亮某类目（柱满不透明 + label 提亮 + 折线打点）；
   - 图例：多序列或带折线时默认显示（dot + 系列名，`showLegend` 可关）；
   - `ChartSeries.tone`：brand（缺省）/ success / error / warn / neutral，色取
     `--dsw-alias-*` 存量 token（清单内核对过），柱 / 折线 / 图例 dot 同源。
2. 完全向后兼容：既有三组件零改动，chart 条目 `dependencies` 仍为空。
3. 测试钉住（同 010 风格：aria / role / data-* 查询，不耦合类名）。

## 方案

- 结构：绘图区两行同 flex 的槽行（柱行 + 刻度行）保证 X 对齐；折线是覆盖在柱行上的
  absolute SVG（viewBox 0 0 100 100 + preserveAspectRatio none + non-scaling-stroke），
  点位 x = (i + 0.5) / n × 100（槽中心）；高亮点用 HTML dot（百分比定位，无 svg 变形）；
- 色彩：tone 类定义组件局部变量 `--chart-tone`（同文件定义，存在性护栏按既知放行），
  柱背景 / 折线描边 / 图例 dot 统一取用；
- 序列 tone 缺省 brand；legend 文案 `name`，dot 用 tone 类。

## 影响面

- `src/chart.tsx` / `src/chart.css`（追加 TrendChart 与 tone 类，不动既有类）
- `src/index.ts`（gen-barrel 重跑）
- `registry.json`：chart 描述补趋势组合能力；`package.json` 0.4.0 → 0.5.0（feat）
- `tests/chart.spec.tsx`（新增）

## 验收标准

- [ ] 既有 BarChart / LineChart / Sparkline 行为不变
- [ ] TrendChart：分组柱逐类目 N 根、折线点位落在槽中心、高亮项（柱 / 刻度 / 打点）正确
- [ ] 图例随多序列 / 折线出现且可关；tone 换色生效且全部 token 在官方清单内
- [ ] 空 labels / 空序列不炸
- [ ] `pnpm typecheck` 0 错；`pnpm test` 全绿；`pnpm build` 通过；registry 护栏全绿

## 依赖

- 前置：无
- 阻塞项：无

## 进度日志

- 2026-11-12 01:30  lin  创建 issue（消费端 006 仪表盘趋势图前置）
