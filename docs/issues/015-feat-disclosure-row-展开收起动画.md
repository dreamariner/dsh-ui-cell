---
id: 015
type: feat
title: DisclosureRow 展开收起改相位状态机，内容区有动画
status: done
priority: P2
labels: [动画, 官方复制件偏离, 相位状态机, 护栏]
created: 2026-11-18
updated: 2026-11-18
assignee: lin
related: [008, 012, 014]
---

# 015 · feat · DisclosureRow 的展开收起动画

## 背景

文档站上点 DisclosureRow 的展开收起，观感硬：内容「啪」地出现、「啪」地消失。

根因是上游的写法：

```tsx
{open && children}
```

内容在开与关之间**瞬间挂载/卸载**，中间没有任何过渡。官方 `DisclosureRow.tsx` 与
`DisclosureRow.module.css` 与本仓副本逐字节一致（本仓复制无偏差），也就是说这是上游的设计，
不是复制时丢的。

而本仓自有的 Accordion / Collapsible 走的是 `grid-template-rows` 过渡（手感的分界线就在这），
同一个组件库里两套手感，是不协调的。

## 方案

沿用 issue 008 的**相位状态机**（sheet 同一套范式）：

```
open  → phase='open'（内容展开 + 淡入）
close → phase='closed'，DOM 留着播出场动画，播完（animationend）才卸载
```

- 相位切换在**渲染期**做（React 官方「按 props 调整 state」写法）。
- 高度用 `grid-template-rows: 0fr → 1fr`（与本仓自有 Accordion 同一手法），淡入淡出用 opacity。
- 时长与缓动走官方动效 token：`var(--ds-transition-duration) var(--ds-ease-in-out)`（200ms）。
- 出场兜底：动画事件没来（样式被覆盖、元素不可见）时，定时器（400ms）也要卸载。
- 系统「减少动态效果」时：样式关了动画就没有 animationend，组件侧直接卸载。

### 连带的两件事

1. **`usePrefersReducedMotion` 抽成共享条目**（`use-prefers-reduced-motion`）：
   sheet 里本来就有一份，disclosure-row 又需要一份，复制两份会漂。抽成 registry 条目后，
   sheet 与 disclosure-row 都声明它为依赖，`add` 时随闭包复制。
2. **图标入场动画**：展开态的上箭头是新挂载的元素（上游是硬切），给它一段入场
   （淡入 + 轻微旋转），避免图标「啪」地换掉。收起方向仍是硬切（idle 图标重新挂载，
   若也加入场动画，页面初次加载时整页图标会一起淡入，反而更吵）。彻底解决要改成
   「同一个箭头旋转」，那是 DOM 级改动，单独评估。

### 偏离登记

DisclosureRow 是官方保真复制件，本 issue 改了 DOM（内容区多了两层包裹）与行为
（关闭后内容短暂留在 DOM 里，播完卸载）。偏离登记在 registry 的 `upstream` 字段，
DSH 升级逐组件 re-diff 时保留本仓这段。

## 实测（文档站，200ms 官方缓动）

展开（轨道高度 / opacity）：

| t | 0ms | 60ms | 120ms | 180ms | 240ms |
|---|---|---|---|---|---|
| grid-template-rows | 0px | 0.23px | 19.6px | 29.7px | 32.5px |
| opacity | 0 | 0.09 | 0.78 | 0.96 | 1.00 |

收起：

| t | 0ms | 60ms | 120ms | 180ms | 240ms |
|---|---|---|---|---|---|
| grid-template-rows | 32.5px | 27.2px | 1.6px | 0.008px | **已卸载** |
| opacity | 1.00 | 0.91 | 0.22 | 0.02 | — |

## 顺带发现并修掉的两个问题

1. **演示没走 children**：文档站的 DisclosureRow 演示把内容渲染在组件**外面**
   （`{open && <div>…</div>`），组件的动画根本管不到它。演示改成把内容作为 children 传入
   （上游自己的用法也是 children，见 `ui-chat/ReasoningRow.tsx`）。
2. **图标在 React 里报非法 DOM 属性**：本仓把上游的图标内联成 JSX（上游是原始 SVG 字符串 +
   innerHTML 渲染，不报警告），内联后 `stroke-width="1"` 变成非法属性，React 每次渲染都告警。
   8 处改成 `strokeWidth={1}`。

## 护栏

新增 `tests/disclosure-row.spec.tsx`（7 例），钉住相位状态机的契约：

- 展开时内容挂载且 `data-state="open"`
- 从没打开过就不渲染内容区
- 收起时**先留在 DOM 里**（`data-state="closed"`），animationend 之后才卸载
- 系统「减少动态效果」时直接卸载
- 样式表契约：两段动画都由 data-state 驱动、动画走官方动效 token、有 reduced-motion 降级

## 结果

`pnpm test` 90 通过 1 跳过（含新增 7 例）、`pnpm typecheck` 绿、文档站已重建（1897 KB，96 条目）。
