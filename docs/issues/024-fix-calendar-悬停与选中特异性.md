---
id: 024
type: fix
title: Calendar 悬停底色排除选中格（点击后样式打架把选中态「洗白」，看似闪烁）
status: done
priority: P2
labels: [样式, 本仓自有件, 特异性, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: []
---

# 024 · fix · Calendar 点击日期后的「闪一下」

## 背景

复审截图：点击日历的 17 后，格子变成**浅灰底 + 近白字**的「幽灵态」，
鼠标一移开又变回实心选中 —— 看起来像点完闪一下。

## 根因：不是动画，是特异性打架

```css
.cell:hover:not(:disabled)  { background: var(--dsw-alias-interactive-bg-hover); }  /* 特异性 (0,3,0) */
.cell[data-selected]        { background: var(--dsw-alias-brand-primary); color: 白; }  /* (0,2,0) */
```

点击后**鼠标仍停在格子上**：`:hover`（class + 伪类 + :not 参数，(0,3,0)）
压过 `[data-selected]`（(0,2,0)）→ 底色换成浅灰悬停色，但白字没变 →
**白字压浅灰底，整格像被洗白**；鼠标移开「啪」地变回品牌蓝。
用户感知为「闪一下」，实为样式冲突的中间态被截图逮个正着
（复审截图里 17 的幽灵态就是它）。

`monthCell` 同款写法同款问题。

## 处置

悬停底色排除选中格（两条规则同步改）：

```css
.cell:hover:not(:disabled):not([data-selected])      { background: hover; }
.monthCell:hover:not(:disabled):not([data-selected]) { background: hover; }
```

选中格悬停时保持品牌底白字不动（悬停反馈对未选中格照常生效）。

## 实测（文档站）

点 17 后鼠标停在原位（`document.elementFromPoint` 确认命中）：
`bg = rgb(15,17,21)`（brand 底）、`color = rgb(255,255,255)` —— **实心选中态保持** ✓。

## 护栏

`tests/calendar.spec.tsx` 追加样式表契约（+1 例）：`.cell` / `.monthCell` 的
悬停规则必须带 `:not([data-selected])`，且不允许出现不带排除的旧写法。

## 结果

`pnpm test` 137 通过 1 跳过（含新增 1 例）、`pnpm typecheck` 绿、文档站已重建（1932 KB）。

## 待办

- 消费端要吃到需 `add --force` 重新复制 calendar（date-picker 内嵌 calendar，同需）
