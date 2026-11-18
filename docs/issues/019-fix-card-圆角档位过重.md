---
id: 019
type: fix
title: Card 圆角从 radius-panel(28px) 降到 radius-lg(16px)，并写下圆角档位口径
status: done
priority: P3
labels: [样式, 本仓自有件, token, 圆角]
created: 2026-11-18
updated: 2026-11-18
assignee: lin
related: [012]
---

# 019 · fix · Card 的圆角档位

## 背景

文档站上看到 Card 的圆角「显得很突兀」，问圆角是怎么定的、能不能改。

## 事实

**Card 是本仓自有件**（`src/card.tsx` 头注：功能对齐 shadcn card，样式沿用 DSH 设计 token；
**上游 DSH 没有 Card 原子** ✓）→ 可以直接改 ✓。

圆角不是组件自己定的数，而是引用主题的档位：

```css
.card { border-radius: var(--dsw-radius-panel); }   /* = 28px */
```

主题的 radius 家族在 `ui-theme/src/styles/base.css`（两套主题同值 ✓）：

| token | 值 |
|---|---|
| xs / sm / md / lg / xl / panel | 4 / 8 / 12 / 16 / 20 / **28** px |

## 根因：档位用错了

查上游各组件实际用哪一档：

| 用 `radius-panel`（28px）的 | 是什么 |
|---|---|
| `ui-primitives/Modal` | 模态框 |
| `ui-settings-general/SettingsRoot` | 设置面板 |
| `ui-conversation/skeleton/InputBar` | 输入栏 |
| `ui-message-feedback/FeedbackDialog` | 对话框 |
| `ui-dockkit` | 停靠面板 |

→ **`panel` 是「浮到内容之上」那一档** ✓（模态框 / 浮层面板 ✓）。

| 用 `radius-lg`（16px）的 | 是什么 |
|---|---|
| `ui-chat/GenericCommandCard` / `MessageItem` | **卡片** |
| `ui-chat/stat-dialog` / `ui-plan/PlanPreview` | 卡片 |
| `ui-settings-account/AccountSection` | 卡片（用 xl 20px）|

→ **上游的卡片是 lg(16) / xl(20)** ✓，没有一张用 28px ✓。

本仓也一样：`radius-panel` 只有 `card.css` 与 `modal.css` 在用 ✓（modal 与上游一致 ✓），
而本仓的浮层（hover-card / toast / menu-surface / code-card）都是 lg ✓。

**结论**：Card 把「模态框那一档」用在了内容卡片上 ✗ → 28px 在 320px 宽的卡片上圆角占了
整卡的九分之一 ✓ 显得突兀 ✓ —— 用户的判断是对的 ✓。

## 处置

1. `src/card.css`：`radius-panel` → **`radius-lg`（16px）** ✓
   （与上游卡片一致 ✓，与本仓浮层组件同档 ✓，与控件档 md(12px) 拉开一档 ✓）；
2. **圆角档位口径写进 wiki 02**（新增「二、圆角档位：按组件的体量选」✓），
   把家族、各档的典型使用者、以及「panel 只给浮到内容之上的面板」写成规则 ✓；
3. Card 演示补一段说明（取哪一档、为什么不是 panel、怎么自己覆盖 ✓）。

## 结果

`pnpm test` 110 通过 1 跳过、`pnpm typecheck` 绿、文档站已重建。

## 附：想自己改圆角

Card 的 props 是 `React.HTMLAttributes`，`className` / `style` 都透传 ✓：

- `style={{ borderRadius: 'var(--dsw-radius-md)' }}` → inline 优先级最高 ✓
- 消费端自己的类 → 同特异性时**后注入者胜** ✓（消费端样式要排在组件样式之后 ✓）
