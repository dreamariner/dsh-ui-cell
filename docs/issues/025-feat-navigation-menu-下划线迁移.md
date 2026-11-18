---
id: 025
type: feat
title: NavigationMenu 当前指示补非受控模式（defaultCurrentId，点击自迁移下划线）
status: done
priority: P2
labels: [交互, 本仓自有件, 受控与非受控, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [021]
---

# 025 · feat · NavigationMenu 的下划线迁移

## 背景

复审：点击「场景」后底部的下划线游标不动（截图圈出）。

## 根因

下划线此前**只有受控声明**：per-item `current: true`，组件自己不跟踪点击。
演示把 `current: true` 写死在「记忆」上 → 点「场景」只回调 `onNavigate`，
没有任何人更新声明 → 下划线纹丝不动。最简用法（占位链接 + 想点谁亮谁）完全走不通，
像坏了。

这与 Sidebar 收起态（issue 021 前的演示缺口）同一类问题：组件给了受控 API，
但最简用法没有非受控起步。

## 方案：双模式（与 Sidebar / Collapsible 同一套仓库约定）

| 模式 | 用法 | 下划线归属 |
|---|---|---|
| **非受控** | `defaultCurrentId="memories"` | 点击条目**自迁移**（组件内部状态）|
| **受控** | 任一条目声明 `current: true` | 以声明为准，点击只回调 `onNavigate`（路由是真相的消费端用这个）|

细节：

- 非受控下点击「id 在顶层条目里」的项才迁移；**子菜单选中不迁移父项下划线**
  （子项 id 不在 items 里，父项才是「当前页」——「更多」选了「审计日志」，
  下划线留在原处而非消失）；
- `aria-current="page"` 跟随下划线（链接语义）；
- 受控判定：`items.some(i => i.current)` —— 声明任一即整组受控，不做逐项混用。

## 演示

改为 `defaultCurrentId="memories"` + 无声明的条目，点「场景」下划线迁移可看；
说明段写清双模式取舍。

## 护栏

新增 `tests/navigation-menu.spec.tsx`（6 例）：非受控迁移 + 回调、无起步值点击迁移、
受控声明不迁移（只回调）、**子菜单选中不迁移父项**、aria-current 跟随、
下划线 `::after` 样式契约（品牌色）。

测试基建注记：子菜单条目渲染在 body 级 portal 且要先开菜单，spec 里先点触发器
再全局找子项点击。

## 结果

`pnpm test` 143 通过 1 跳过（含新增 6 例）、`pnpm typecheck` 绿、文档站已重建（1933 KB）。
DOM 实测：点「场景」前 `data-current` 在记忆、之后在场景，`::after` 品牌色 ✓。

## 待办

- 消费端要吃到需 `add --force` 重新复制 navigation-menu
