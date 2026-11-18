---
id: 028
type: feat
title: Sidebar 收起态经 Context 下发（SidebarNav 自动读取 + useSidebarCollapsed 槽内感知）
status: done
priority: P2
labels: [新能力, 本仓自有件, 收起态]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [021, 027]
---

# 028 · feat · Sidebar 收起态经 Context 下发

## 背景

复审 shadcn sidebar 的组件族对照时发现唯一真缺口：**收起状态的共享**。
shadcn 用 `useSidebar()` 让 Header/Footer 里的触发器、任意子组件都感知收起态；
本仓此前要消费端把 `collapsed` 传两遍（壳一次、SidebarNav 一次，演示里就是这么写的），
槽内容（header/footer）更是只能消费端自己在回调里手动切文案。

## 方案

对齐 shadcn 的思路，React Context 三件套：

1. **`Sidebar` 自动下发**：壳的 render 外包一层 Provider，
   value 就是它已经算好的 `collapsed`（受控/非受控统一后的结果）。
2. **`SidebarNav` 自动读取**：收起态取值改为三层
   `显式 prop > Context > 缺省展开`，独立于壳使用（不在 Sidebar 里，
   Context 为 undefined）时落回展开态，行为不变。
3. **导出 `useSidebarCollapsed()`**（对应 shadcn `useSidebar()` 的 collapsed 部分）：
   槽内容（header/footer 里任意组件）调用即可感知收起态；
   不在 Sidebar 内返回 `undefined`，由调用方决定缺省值。

显式 prop 仍可覆盖 Context（消费端要锁死某个态、或 nav 独立使用时用）。

## 联动改动

- `registry.json`：`sidebar-nav` 声明 `dependencies: ["sidebar"]`
  （护栏「单加即坏」当场抓住跨条目导入，声明补上后闭包解析正常）；
  两条目的 description 同步口径。
- 演示页去掉双份传参：SidebarNav 不再接 `collapsed`，
  header/footer 改用 hook 的小组件（「助手/助」「v0.2.1/…」由 hook 切），
  示例代码与说明段同步更新。

## 护栏

`tests/sidebar-nav.spec.tsx` 新增 4 例：壳收起则 nav 与槽内 hook 同步、
壳展开三层缺省落到展开、显式 prop 覆盖 context（且槽内 hook 不受影响）、
独立使用时 hook 为 `undefined` 且 nav 缺省展开。

## 结果

`pnpm test` 150 通过 1 跳过（含新增 4 例）、`pnpm typecheck` 绿、文档站已重建。

## 待办

- 消费端要吃到需 `add --force` 重新复制 sidebar / sidebar-nav
  （sidebar-nav 的依赖闭包会自动带上 sidebar）
- shadcn `useSidebar()` 其余能力（toggle 等）暂不收：触发器归消费端，
  需要时再扩 hook
