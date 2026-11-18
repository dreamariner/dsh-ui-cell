---
id: 027
type: fix
title: sidebar-nav 收起态徽标圆点叠图标右上角（不再占布局位挤偏图标），点色改 brand 实心
status: done
priority: P3
labels: [样式, 本仓自有件, 收起态]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [021]
---

# 027 · fix · sidebar-nav 收起态的徽标圆点

## 背景（第一轮：没对齐 + 白圈）

复审截图：收起态里「记忆」的图标偏左、右边悬着一个来历不明的白圈。

**根因**：徽标圆点**占布局位** —— 收起态把徽标渲染成圆点后仍留在 flex 行里，
与图标并排居中 → 图标被挤偏、圆点悬在右侧（`bg-module-platform` 近白灰，
看着就是个白圈）。

**修法**：圆点改**绝对定位**，叠在图标右上角（`top/right: var(--dsh-space-4)`，
`.item` 加 `position: relative`）—— 不占布局位，图标独自居中，
圆点变成标准的「通知点」语义。实测图标中心相对格子中心偏移 = 0 ✓。

## 复审（第二轮：白点不合适，很难发现）

定位修好后复审再指出：**点色用 `bg-module-platform` 不合适** —— 近白灰压白底
几乎看不见（「这是气泡提示？很难发现」）。收起态圆点的语义是**通知标记**
（此处有徽标），可见性优先：

- 改 `--dsw-alias-brand-primary` **实心**、去掉发丝描边
  （实测 rgb(15,17,21)，6x6px 叠图标右上角，一眼可见 ✓）；
- 展开态的徽标胶囊保持中性灰不变（那里有数字，靠文字承载信息）。

## 护栏

`tests/sidebar-nav.spec.tsx` 样式契约更新：圆点必须 `position: absolute` +
右上角定位 + **brand 实心、无 outline**（占布局位或白点写法出现即红）。

## 结果

`pnpm test` 146 通过 1 跳过、`pnpm typecheck` 绿、文档站已重建（1937 KB）。

## 待办

- 消费端要吃到需 `add --force` 重新复制 sidebar-nav
