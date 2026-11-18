---
id: 021
type: feat
title: 新增 sidebar-nav（侧栏导航）：分组/图标/徽标/选中态/收起态，补上 Sidebar 缺的条目层
status: done
priority: P2
labels: [新组件, 本仓自有件, 收起态, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [020]
---

# 021 · feat · sidebar-nav（侧栏导航）

## 背景

复审 Sidebar 时问「没有 sidebar 内对应的导航组件？」—— 确认**没有**：

- `sidebar` 只是布局壳（宽度 + 三段），导航条目要消费端手写 div（文档站演示就是凑的）；
- 现有的都不对位：`navigation-menu` 是顶部横向导航、`item` 是卡片式列表项、`menu` 是浮层菜单。

shadcn sidebar 对应的是一整族（SidebarMenu / MenuItem / GroupLabel / Badge…）；
本仓取精简版合成一个 **`sidebar-nav`**（条目列表 + 分组标题 + 徽标 + 收起态）。

## API

```tsx
<SidebarNav label="助手导航" collapsed={collapsed}
  items={[{ value: 'memories', label: '记忆', icon: <…/>, badge: 12, disabled? }]}
  value={nav} onSelect={setNav} />
// 分组：groups={[{ label: '工作区', items: [...] }, { items: [...] }]}
```

- **选中**：受控 `value` / 非受控 `defaultValue`；`aria-current="true"`；
  点已选中项不重复回调；禁用项 `disabled` + 不回调。
- **收起态**：`collapsed` 从 Sidebar 的 `data-collapsed` 传进来 ——
  文字不渲染（`title` 保悬浮提示）、分组标题不渲染、徽标缩成圆点、
  条目收成图标位（宽度由 Sidebar 的 `collapsedWidth` 决定）。
- **语义**：`<nav aria-label>` + 按钮；不做 roving tabindex
  （竖排导航逐项 Tab 是标准做法，shadcn 同款）。

## 样式（全走 token，护栏已覆盖）

- 条目：`--dsw-font-s-14` 钉档（不继承宿主字号 —— issue 014 同款坑，这次直接写对）+
  `label-secondary`；选中 `button-ghost-active-fill` + 1px 内描边 + `label-primary`；
  悬停 `interactive-bg-hover`；过渡走 `--ds-transition-duration-fast`（即时反馈档）。
- 徽标：`bg-module-platform` 胶囊 + `font-xs-13`；收起态圆点（6px，描边 `border-l4`）。
- 间距全 `--dsh-space-*`；`prefers-reduced-motion` 降级块 ✓。

## 演示

Sidebar 演示的手写 div 换成 SidebarNav：选中态切换、徽标 12、禁用项置灰、
收起态图标位 + 圆点徽标，三态截图核对 ✓。

## 护栏

新增 `tests/sidebar-nav.spec.tsx`（9 例）：选中契约（非受控自翻 / 受控说了算 /
点已选不回调 / 禁用不可选）、收起态（文字不渲染 + title + data-collapsed、
徽标缩点、分组标题隐藏）、样式表契约（字号钉档、官方过渡 token + 降级、
data-collapsed 驱动）。

## 计数

registry 96 → **97** 条目（本仓自有 41 → 42，atom 87 → 88）；
README / AGENTS.md / SKILL.md 同步。

## 结果

`pnpm test` 129 通过 1 跳过（含新增 9 例）、`pnpm typecheck` 绿、
文档站已重建（1928 KB，registry 97 条目）。

## 待办

- 消费端 `add sidebar-nav`（或随 `sidebar` 一起重新 add --force）
- shadcn sidebar 菜单族还有 MenuAction（行内按钮）/ MenuSub（子级折叠），
  有真实需求再按本 issue 的口径扩
