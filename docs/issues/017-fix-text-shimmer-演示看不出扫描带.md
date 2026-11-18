---
id: 017
type: fix
title: TextShimmer 演示看不出扫描带（微光层是文字色的半透明副本，深色底上等于同色叠加）
status: done
priority: P3
labels: [文档站, 演示, 官方复制件, token]
created: 2026-11-18
updated: 2026-11-18
assignee: lin
related: [012, 014]
---

# 017 · fix · TextShimmer 演示看不出扫描带

## 背景

文档站上看到 TextShimmer 演示不动，怀疑组件没动画。实测下来：**动画一直在跑**，
只是**看不出来**。

## 实测（文档站，DSH 0.2.2-rc.1 token）

| 项 | 实测 |
|---|---|
| `animation-name` | `duc-text-shimmer-dsh-row-shimmer-sweep` ✓（keyframes 在站点样式表里） |
| `animation-duration` / timing | 1.5s / `steps(48)` ✓，两段动画 `playState = running` ✓ |
| 扫描带位移 | 400ms 内 sweep 从 −24px 走到 +96px ✓（确实在动） |
| 文字逐列最暗值（6 帧） | 几乎不变（30 上下）→ **肉眼看不出** |

## 根因：微光层是「文字色的半透明副本」

上游 `TextShimmer.module.css` 的做法是：真文字照常渲染，另起一层 `position: absolute`
的副本（`.decoration > .sweep > .highlight`），副本用 `color: var(--dsw-alias-label-shimmer)`，
再用一个移动的 `mask-image` 带把副本露出一条（40%~60% 的渐变带），
两层用**相反的 transform** 保证字形始终对齐。

而那个 token 的定义是：

| 主题 | 定义 | 实际值 |
|---|---|---|
| 亮色 | `color-mix(in srgb, var(--dsw-static-neutral-1000) 30%, transparent)` | `rgb(0 0 0 / 0.3)` |
| 暗色 | `color-mix(in srgb, var(--dsw-static-neutral-00) 45%, transparent)` | `rgb(255 255 255 / 0.45)` |

也就是**文字色本身降一档透明度**。这份副本是盖在真文字**上面**的：

- 底色是正文色（近黑 `#1f2328`）→ 30% 黑盖在近黑上 = 近黑（30 → 21），
  逐像素都看不出变化；
- 底色是中灰（次级色）→ 30% 黑盖在中灰上 = 明显变深（107 → 75）✓ 一眼看得见。

**所以「有没有动画」取决于底色，不取决于动画。**

## 上游产品是怎么用的

DSH 应用里跑动状态（`ChatView.module.css` 的 `.running`）**重新定义了这个 token**：

```css
.running {
  --dsw-alias-label-shimmer: var(--dsw-alias-label-deep-diving-shimmer);
  color: var(--dsw-alias-label-deep-diving);
}
```

文字用 `deep-diving`（70% 品牌色 + 蓝 950），微光层用 `deep-diving-shimmer`（同一色 30% 混合），
两者是**同色不同深浅** → 扫描带显形 ✓。

也就是说：**组件本身没问题，是用法上要挑一个跟底色有对比的 shimmer 色**。

## 本仓侧的处置

组件是官方保真复制件（CSS 与上游逐字节一致），**不改**。改的是文档站的演示：

1. 演示改成三行并各带标签：「扫描带（shimmer 色改成高对比的浅灰）」/「默认 token（正文色上几乎看不出在动）」/
   「静置态（无动画）」；
2. 第一行把 `--dsw-alias-label-shimmer` 重新定义成 `var(--dsw-alias-label-caption)`
   （亮色主题实测 rgb(173,178,184)），扫描带立刻显形（实测字形亮度在 30 与 150 之间来回跳，
   约 5 倍对比 ✓）；
3. 文字写长一点：扫描带宽度是文字宽的 20%，字多则带宽，好盯着看；
4. 演示补一段说明：微光层是文字色的半透明副本，底色越深越看不出来；
   动画是循环的（一轮 1.5s：0.3s 延迟 → 1s 扫过分 48 格跳 → 0.5s 静止）；
   另注明系统开了「减少动态效果」时组件整体不显示微光（可访问性降级）；
5. 暗色主题同样验过：两段动画 `running`，扫描带可见 ✓。

**踩过的坑**：一开始把 shimmer 色改成了 `--dsw-alias-label-primary-dimmed`，以为它是「浅一档的正文色」，
实测 rgb(21,21,23) —— 跟正文 rgb(15,17,21) 几乎一样，等于没改（还是看不见）。
**token 名里的 dimmed 不等于「浅」**，亮色主题里 dimmed 反而更深。选色要看实测值，别看名字。

## 一个容易踩的坑：文档站是静态文件

演示改完必须 `pnpm docs:build` 重建，浏览器还要强刷（Cmd+Shift+R）。
只点页面里的锚点不会重新加载文档 —— 改完重建后看到「还是老样子」，
先怀疑缓存，再怀疑组件。

## 顺带留一句给消费端

插件里用 TextShimmer 时，记得给 `--dsw-alias-label-shimmer` 一个跟底色有对比的值，
否则「以为没动画」会浪费很多时间（组件是好的）。

## 结果

`pnpm test` 101 通过 1 跳过、`pnpm typecheck` 绿、文档站已重建（1902 KB）。
