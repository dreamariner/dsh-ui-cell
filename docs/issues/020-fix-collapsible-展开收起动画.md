---
id: 020
type: fix
title: Collapsible 补上展开收起动画（对齐 Accordion 的 grid 过渡），收起态加 inert
status: done
priority: P2
labels: [动画, 本仓自有件, 可访问性, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [008, 012, 015]
---

# 020 · fix · Collapsible 的展开收起动画

## 背景

文档站上点 Collapsible 的「高级选项」，内容「啪」地出现、「啪」地消失 —— 复审问
「有没有过渡动画？看起来好像没有」。实测：**没有**。

## 现状

```tsx
{open && <div className={css.content}>{children}</div>}
```

内容瞬间挂载/卸载，只有箭头有 180° 旋转过渡（issue 012 时补的）。

而 **issue 015 的文档与 wiki 04 都写着「本仓自有的 Accordion / Collapsible 走的是
grid-template-rows 过渡」** —— 查了代码：Accordion 是真的（内容常驻 DOM +
`grid-template-rows: 0fr↔1fr` 过渡 ✓），**Collapsible 是文档说错了**，代码根本没跟上。
这正是 wiki 04 说的「其余组件若要补进出场动画照此办理」漏掉的一处。

## 方案：照 Accordion 的同一套，不用相位状态机

| | Accordion / Collapsible（本方案） | sheet / DisclosureRow（issue 008/015） |
|---|---|---|
| 内容 DOM | **常驻** | 关闭时留一拍播出场动画，播完卸载 |
| 高度 | `grid-template-rows` **transition**（0fr↔1fr） | `grid-template-rows` **animation** + opacity |
| 卸载时序 | 无（不需要） | animationend + 400ms 定时器兜底 |
| 降级 | `transition: none`（样式一条） | 样式关动画 + `usePrefersReducedMotion` 直接卸载 |

选常驻挂载的理由：Collapsible 是本仓自有件，Accordion 已经确立了「常驻 + 过渡」的
先例；不需要卸载时序就没有「动画没播完就被卸载」的兜底问题，实现与降级都简单得多。

**行为变化**：收起后 children 仍留在 DOM（此前会卸载）。副作用是内容状态在收起后
**保留**（与 Accordion 一致）；对「收起就该销毁内容」的用法，消费端自己在 children 里
控制（或用 key 重挂）。

**连带（可访问性）**：内容常驻后，收起态的内容仍可被 Tab 聚焦到（视觉上被 0fr + overflow
裁掉）→ 收起态给内容区加 **`inert`**（React 18 下以空串转发，布尔会被丢 —— 与 TextShimmer
同一写法）。Accordion 有同样的洞，一并补上 ✓。

## 实现细节（一个容易踩的坑）

高度过渡的裁剪链：`.content`（grid，0fr↔1fr）→ `.contentInner`（overflow: hidden）。
**底部内边距必须收在展开态**（`.collapsible[data-open] .contentInner` 才有
`padding-bottom`）—— 若 padding 常驻在 grid 容器或内层上，收起时 0fr 归零的是行高，
那 8px 会一直占着，内容区收不到 0（Accordion 同款处理 ✓）。

组合值例外不变：左内边距 28px（8 触发器左内边距 + 14 chevron + 6 间隔）跟着
`.contentInner` 走，仍在 `SPACING_COMPOSED` 登记 ✓。

## 护栏

新增 `tests/collapsible.spec.tsx`（8 例）：

- 内容常驻 DOM（收起时也在）；aria-expanded 与 data-open 随开合翻转（非受控点击自翻）；
- 收起态 inert、展开态无；defaultOpen 初始展开；
- Accordion 收起态同样 inert（两组件同一契约）；
- 样式表契约：grid 0fr↔1fr 过渡走官方 token、contentInner overflow hidden +
  padding-bottom 收在展开态、reduced-motion 降级（箭头与内容都直接到位）。

## 结果

`pnpm test` 118 通过 1 跳过（含新增 8 例）、`pnpm typecheck` 绿、文档站已重建（1917 KB）。

## 待办

- 消费端要吃到这处修正需 `add --force` 重新复制 collapsible（与 accordion）
- wiki 04 的「其余组件若要补进场出场动画照此办理」清单补一句：自查一遍
  `{open && children}` 写法（本次就是靠复审肉眼抓到的，护栏抓不到这种「没有动画」）
