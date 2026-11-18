---
id: 026
type: feat
title: Sheet 增加 radius 自定义（缺省 radius-panel，只覆盖内容侧两角）
status: done
priority: P2
labels: [新属性, 本仓自有件, 圆角]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [019]
---

# 026 · feat · Sheet 的自定义圆角

## 背景

复审问完 Sheet 圆角的来龙去脉（issue 019 口径：浮层用 panel 档）后指出：
**28px 在有些场景不合适**（小屏抽屉 / 局部容器里的详情抽屉），要能自定义。

此前 `panel` 的 `className` / `style` 不透传（inline style 只用于宽度），
改圆角只能改源码。

## API

```tsx
<Sheet radius={16}>                          {/* 数字按 px */}
<Sheet radius="var(--dsw-radius-lg)">        {/* 字符串原样引用，可传任意 radius token */}
```

缺省不给 = 样式表的 `--dsw-radius-panel`（28px），行为不变。

**只覆盖「靠内容侧」的两角，贴边侧仍是直角** —— 抽屉感的几何语义（面板像从
屏幕边缘长出来）不能被圆角值破坏。组件按 `side` 查 `RADIUS_CORNERS` 表算出
对应的两个长属性，写进 panel 的 inline style（inline 长属性优先于样式表的
side 规则，贴边侧不写就不受影响）：

| side | 覆盖的角 |
|---|---|
| right | 左上 / 左下 |
| left | 右上 / 右下 |
| bottom | 顶两角 |
| top | 底两角 |

## 实现

`sheet.tsx`：`RADIUS_CORNERS` 常量表 + panel style 合并计算
（width 原逻辑保留，radius 新增；两个都没给时 style 为 undefined，行为不变）。

## 护栏

`tests/sheet.spec.tsx` 追加 3 例：数字按 px 写进内容侧两角（贴边侧不写）、
字符串原样引用（side=bottom → 顶两角）、不给 radius 不写 inline 圆角
（保持缺省档）。

## 结果

`pnpm test` 146 通过 1 跳过（含新增 3 例）、`pnpm typecheck` 绿、
文档站已重建（1934 KB）。实机核对（side=right + radius=lg）：
inline 只有两个长属性，computed topLeft/bottomLeft = 16px，
topRight/bottomRight = 0px ✓。

## 待办

- 消费端要吃到需 `add --force` 重新复制 sheet
