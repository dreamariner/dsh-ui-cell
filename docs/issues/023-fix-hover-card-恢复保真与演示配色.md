---
id: 023
type: fix
title: HoverCard 恢复上游保真（字面深底 → hovercard alias token 族），演示补正确配色用法
status: done
priority: P2
labels: [官方复制件偏离, token, 演示]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [012, 014]
---

# 023 · fix · HoverCard 的「一片黑」

## 背景

文档站上 HoverCard 悬停后**黑上黑**：恒暗卡片上压着继承来的深色正文，几乎读不了
（复审截图）。

## 样式是怎么决定的（先回答机制）

HoverCard 是官方保真复制件，卡片观感由两层决定：

1. **底色**：组件 CSS 里 `background: var(--dsw-alias-hovercard-bg)`，
   主题定义 = `neutral-bluish-850`，**亮暗两套主题同值**（上游 tooltip 语言：
   浮层恒暗，浮在任何内容上都成立）。
2. **内容配色**：组件**不设**文字色，由消费端用配套的 `hovercard-label-*` token 族
   （primary = `neutral-bluish-00` 近白 / secondary / tertiary）—— 上游的
   SessionScheduleMark、工作区 Rows 都是这个配法。

## 为什么一片黑（两层原因叠加）

1. **副本偏离了现行上游**：`src/hover-card.css` 里是旧版写法的字面色 ——
   本地变量 `--dsw-hovercard-bg: #2C2C2E` + `.copied { color: #FFFFFF }`，
   而现行上游已改为 `--dsw-alias-hovercard-bg` / `--dsw-alias-hovercard-label-primary`。
   字面深底恰好与 token 同观感（都是恒暗面），所以底色本身「碰巧没错」；
   护栏的 `OFFICIAL_EXCEPTIONS` 还登记着这个字面 hex，把偏离合法化了。
2. **演示传了裸文字**：`content` 是不带颜色的 div → 文字继承宿主正文色
   （#1f2328 深色）→ 深字压恒暗面 = 黑上黑。上游消费端从来不会这么用。

## 处置

1. **组件恢复保真**：`src/hover-card.css` 三处对齐现行上游（bg / copied 色 / 补回
   darwin no-drag 的 :global 块），`diff` 确认与上游 **逐字节一致** ✓；
2. **护栏收紧**：`hover-card.css` 退出 `OFFICIAL_EXCEPTIONS` 的字面 hex 豁免
   （只剩 `--dsw-specific-*` 一项，`.media` 在用）—— 此后这个文件再出现字面色直接红；
3. **演示改正确用法**：内容三层文字分别用 `hovercard-label-primary/secondary/tertiary`
   （title / 正文 / 提示），代码示例同步；说明段落讲清「底色恒暗 → 内容必须用
   hovercard-label 族」的因果。

## 实测（亮色主题，悬停实开）

| 项 | 值 |
|---|---|
| 卡片底色 | `rgb(44,44,46)`（= `neutral-bluish-850`，token 驱动）|
| 标题 / 正文 / 提示 | `rgb(255,255,255)` / `rgb(207,211,214)` / `rgb(173,178,184)` ✓ 清晰可读 |

暗色主题：token 定义与亮色**逐字节相同**（design-platform.css 226-231 行 = 378-383 行），
渲染一致。

## 结果

`pnpm test` 136 通过 1 跳过、`pnpm typecheck` 绿、文档站已重建（1931 KB）。

## 待办

- 消费端要吃到需 `add --force` 重新复制 hover-card
- 复查其余在 `OFFICIAL_EXCEPTIONS` 里的字面色文件（tooltip / toast / zoom-controls /
  json-tree）是否也存在「上游已 token 化、本仓副本还是旧字面」的情况 —— 升级期逐个
  re-diff 时按本 issue 的路数处理
