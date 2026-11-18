---
id: 012
type: feat
title: 补间距与动效规范（官方底座上扩展，本仓自有件收敛，官方件保真）
status: done
priority: P1
labels: [规范, 间距, 动效, token, 护栏]
created: 2026-11-18
updated: 2026-11-18
assignee: lin
related: [002, 005, 008]
---

# 012 · feat · 补间距与动效规范

## 背景

本仓（dsh-ui-cell）到 011 为止定的是**工程纪律**：token 纪律（只引 alias 稳定面 +
存在性校验）、命名空间（前缀 + 组件名段 + 跨组件唯一）、行为保真清单（Modal 焦点陷阱 /
SegmentedControl 键盘走查）、基线锚。

**UI 与 UX 规范一直是空的**。这不是疏漏，是当时没认领：数值刻度归谁，官方文档里写得很清楚，
`docs/web-styling.md` 有一句：

> `ui-theme` owns the `--dsw-*` static scale, semantic aliases, typography, **motion**,
> gradients, shadows, scrollbar styles... Feature packages consume semantic aliases and
> **do not define another global theme**.
> A component may define a local custom property when its value is part of that component's
> layout or presentation contract; shared colors, typography, elevation, and **motion belong
> to the theme package**.

翻官方 `ui-theme/src/styles/base.css`，动效面就四个 token：

| token | 值 |
|---|---|
| `--ds-transition-duration` | 0.2s |
| `--ds-transition-duration-fast` | 0.1s |
| `--ds-transition-duration-slow` | 0.3s |
| `--ds-ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) |

间距面**一个 token 都没有**。官方 `.agents/skills/dsh-client-ui-ux/references/spacing.md`
末句是：

> This skill defines no numeric scale.

同目录 SKILL.md 里对应的一句：

> numeric scales stay with their implementation owners.

所以官方的分工是：**语义归官方，数值归实现方**。本仓是第三方插件组件的实现方，
数值刻度这块地本来就是我们的，只是没人去种。本 issue 去种。

### 现状有多乱

本仓 41 件自有组件（`registry.json` 里 `upstream` 为空的那些）：

- **间距**：108 条声明、121 个 px 字面量，值散在
  1 / 2 / 4 / 5 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 28 / 30 / 32 / 34px 上，
  没有刻度、没有语义角色、没有护栏。
- **动效**：11 个文件带过渡或动画，交互过渡写死 100 / 120 / 140 / 150 / 160 / 180 / 200ms，
  缓动混用 `ease` / `ease-in-out` / `ease-out` / `linear` / `steps()` / 三条手写 cubic-bezier。
  官方 token 只在 `sheet` 一个文件里被用上（issue 008 补动画时顺手用的），其余各行其是。
- **降级**：27 个带动画的文件里只有 20 个有 `prefers-reduced-motion` 块，
  `collapsible` / `radio-group` / `resizable` / `chart` 四个漏了。

## 与官方是什么关系（先说清楚，免得做成第二个主题）

| 维度 | 官方拥有 | 本仓做什么 |
|---|---|---|
| 间距语义（组内外关系、可见留白、分组判据） | `dsh-client-ui-ux/references/spacing.md` + `docs/ui-design-review-cases.zh.md` §2 | **不改写、不复述**，只引用；本仓的规范文档指回上游路径 |
| 间距数值刻度 | 官方明确不设（"defines no numeric scale"，数值归实现方） | **本仓定义** `--dsh-space-*`，作为实现方补齐官方留白的那一块 |
| 动效 token（时长与缓动） | `ui-theme`（motion 归 theme 包） | **直接复用官方四��� token**，不新增任何全局动效变量 |
| 动效语义映射（哪一档用在哪） | 官方无 | **本仓定义**（三档 → 交互类型的映射表） |
| 官方保真复制件的动效与间距 | 上游 `ui-primitives` | **保真不改**，登记例外表，DSH 升级时跟随上游 re-diff |

两条不冲突的底线：

1. **不另起一个全局主题**。本仓不定义颜色、字体、层级、动效变量。间距刻度是官方没管的那块地
   （`web-styling.md` 的 owned 清单里没有 spacing），且变量名前缀是 `--dsh-space-*`
   （官方是 `--dsw-*`），不与官方命名空间撞。
2. **官方件一字不改**。53 件保真复制件自带 modal 150ms、tooltip 150ms、hover-card linear、
   detail-document 2s cubic-bezier 等，跟随上游，本仓只登记例外。

## 间距规范

### 刻度

4px 底座，2px 半步（小值区），命名即值：

| 变量 | 值 | 语义角色 |
|---|---|---|
| `--dsh-space-1` | 1px | 发丝级缝隙（1px 分隔间隙） |
| `--dsh-space-2` | 2px | 图标与文字、极紧组内 |
| `--dsh-space-4` | 4px | 组内元素（紧） |
| `--dsh-space-6` | 6px | 组内元素（中）、控件内紧凑留白 |
| `--dsh-space-8` | 8px | 控件内边距、卡片内边距 |
| `--dsh-space-12` | 12px | 块内边距 |
| `--dsh-space-16` | 16px | 区块之间 |
| `--dsh-space-20` | 20px | 大块内边距 |
| `--dsh-space-24` | 24px | 区块分隔 |
| `--dsh-space-32` | 32px | 大留白 |

`0` 不进刻度（复位值不是节奏值，`margin: 0` 保持字面量）。
`0.5px` 是发丝描边补偿（`margin-left: -0.5px`），不是间距，保持字面量。

### 归一规则（机械、可复核）

1. **独立空间决策**（单个 padding / gap / margin 值）取**最近刻度档**；正好等距时取**较小档**
   （收紧优先：DSH 是紧凑桌面 UI，内边距变大最容易让密度失衡）。
2. **组合值**（缩进、让位这类由图标尺寸与偏移推导出来的值）**登记例外**，写明构成，
   并随其构成项同步更新。官方 spacing 参考强调「距离由关系决定，不是由数值决定」，
   组合值的正确性在关系里，不在它落在哪一档。
3. 官方件（保真复制）走例外表，值不动。

### 本仓自有件的归一结果（23 处动像素，其余 98 处原值上刻度）

| 原值 | 处数 | 归一后 | 说明 |
|---|---|---|---|
| 5px | 1 | 4px | chart 图例项内 gap，等距取小 |
| 10px | 12 | 8px | 等距取小；影响 collapsible 的缩进构成（见下） |
| 14px | 4 | 12px | 等距取小 |
| 18px | 2 | 16px | 等距取小 |
| 28px | 1 | 28px（例外） | select 右内边距，组合值：8（右偏移）+ 14（chevron 图标）+ 6（间隔） |
| 30px | 1 | 28px（例外） | collapsible 内容缩进，组合值：8（触发器左内边距）+ 14（chevron）+ 6（间隔） |
| 34px | 1 | 34px（例外） | accordion 内容缩进，组合值：12（触发器左内边距）+ 14（chevron）+ 8（头部 gap） |

三处组合值的共同结构是「触发器左内边距 + 图标尺寸 + 图标与文字的间隔」，
它们保证内容与触发器文字对齐，是**关系**不是节奏，故不归一。

## 动效规范

### 三档映射（底座是官方 token，本仓只定「哪一档用在哪」）

| 交互类型 | 用哪档 | 值 |
|---|---|---|
| 即时反馈：悬停、按下、聚焦、选中、数据到达 | `--ds-transition-duration-fast` | 100ms |
| 状态切换：展开收起、显隐、开关 | `--ds-transition-duration` | 200ms |
| 大面积位移：面板进出 | `--ds-transition-duration-slow` | 300ms |

缓动统一 `var(--ds-ease-in-out)`（官方唯一 easing，Material 标准曲线）。

### 循环节律豁免

呼吸、旋转、闪烁这类 `infinite` 动画不是交互时长，塞进三档反而不对：

| 组件 | 动画 | 处理 |
|---|---|---|
| skeleton | `skeleton-pulse 1.6s ease-in-out infinite` | 字面时长保留（easing 已是官方） |
| progress 不定态 | `progress-slide 1.4s ease-in-out infinite` | 同上 |
| spinner | `spinner-rotate 700ms linear infinite` | 匀速旋转，`linear` 正确 |
| input-otp 光标 | `otp-caret 1s steps(2) infinite` | 离散闪烁，`steps()` 正确 |

豁免的前提是**必须配 `prefers-reduced-motion` 降级**。

### 可动属性白名单

默认只许动：`transform` / `opacity` / `color` / `background-color` / `border-color`。

结构性尺寸变化（`width`、`grid-template-rows`）会逐帧触发布局，登记例外：

- `sidebar` 的 `width`（侧栏收展，结构上就是改宽度）
- `accordion` 的 `grid-template-rows`（0fr → 1fr 的展开）

规范口径：**要动布局就别用 transition 改尺寸，改用 transform**；做不到就登记例外并写明理由。

### 降级

每个带动画的组件必须有 `prefers-reduced-motion: reduce` 块。本仓自有件补齐
`collapsible` / `radio-group` / `resizable` / `chart` 四个。

### 相位状态机（沿用 issue 008 的做法）

出场动画要播完才卸载 DOM，靠的是 `data-state` 驱动 + `animationend` 卸载 + 定时器兜底。
sheet 已是样板，其余组件若要补进场出场动画照此办理。

### 逐文件对照（本仓自有件）

| 组件 | 现状 | 收敛后 | 视觉影响 |
|---|---|---|---|
| sheet | 已用官方 token | 不变 | 无（现有样板） |
| accordion `.chevron` | `transform 150ms ease` | 200ms 官方档 | 慢 50ms，感知不到 |
| accordion `.content` | `grid-template-rows 180ms ease` | 200ms | 慢 20ms（逐帧 layout，登记例外） |
| collapsible `.chevron` | `transform 150ms ease` | 200ms | 同 accordion |
| progress `.indicator` | `transform 200ms ease` | 200ms + 官方 easing | 时长不变，只换曲线 |
| radio-group | `border-color/opacity/transform 120ms ease` | fast 100ms | 快 20ms |
| resizable | `background 120ms ease` | fast 100ms | 快 20ms |
| chart `.bar` / `.trendBar` | `opacity 120ms ease` | fast 100ms | 快 20ms |
| sidebar | `width 160ms ease` | 200ms | 慢 40ms（逐帧 layout，登记例外） |
| skeleton / progress 不定态 / spinner / input-otp | 循环节律 | 字面时长保留 | 无 |

官方自己也不统一用自己的 token（上游 `ui-primitives` 里 160ms×7、180ms、150ms、140ms 一堆字面量），
所以这套守则是**官方 token 面的收敛应用**：官方件保真跟随上游，自有件守规范，两边分工清楚。

## 落地方案

1. **基础层**：新增 `src/foundation.css`，`:root` 定义 `--dsh-space-*` 刻度；
   `registry.json` 登记为 `role: "base"` 的条目；`add` 每次都带上它并排在样式注入顺序**第一位**
   （被复用者先注入的规则，基础层是最底层）。
2. **间距收敛**：本仓 41 件自有件 108 条声明归一到 `var(--dsh-space-*)`，三处组合值登记例外。
3. **动效收敛**：11 个自有件文件归官方三档 + 官方 easing，补齐 4 个降级块。
4. **护栏**（`tests/registry.spec.ts` 新增）：
   - 间距：自有件里 `padding` / `margin` / `gap` 不得出现 px 字面量（0 与 0.5px 除外），
     组合值走例外表；引用的 `--dsh-space-N` 必须在 `foundation.css` 里有定义且值在刻度表内。
   - 动效：`transition` 的 duration 只许官方三档 token，easing 只许官方 easing；
     `animation` 的 `infinite` 循环按循环节律豁免放行字面时长；官方件走例外表。
   - `foundation.css` 的刻度表与测试里的期望表必须一致（改刻度是一次有意的决定，两处一起改）。
5. **文档**：`docs/wiki/04-间距与动效规范.md`（人读）+ `skills/dsh-ui-cell/references/`
   （Agent 读，随包分发）。

## 影响面

- 只改本仓 `src/`、`registry.json`、`cli/add.ts`、`tests/`、`docs/`、`skills/`；不改上游 DSH。
- 消费端（dsh-pilot / dsh-ledger）已复制的组件是快照，要 `add --force` 重装才拿到新间距与动效，
  不重装维持现状。这是「复制即独立」的设计意图，不是回归。
- 官方 53 件保真复制件的间距与动效一律不动，走例外表。

## 结果

- 本仓三门禁绿：`pnpm test` 80 通过 1 跳过、`pnpm typecheck` 绿、`pnpm build` 绿
- 新增护栏 6 条（间距与动效规范一组）：基础层刻度与期望表一致、基础层被 add 每次带上且排第一、
  引用的 `--dsh-space-*` 都在基础层有定义、间距声明不写 px 字面量、过渡只许官方三档时长与官方缓动、
  带动画的自有件都有 reduced-motion 降级
- 间距：自有件 108 条声明全部归一到 `var(--dsh-space-*)`，23 处动了像素（最大偏差 4px，
  多为 2px），3 处组合值登记例外（select 28px / collapsible 28px / accordion 34px）
- 动效：11 个自有件文件归官方三档 + 官方 easing；补齐 collapsible / radio-group / resizable / chart
  四个降级块，并给 progress 的进度条过渡补了降级、给 accordion 的箭头补了降级
- 文档：`docs/wiki/04-间距与动效规范.md`（人读）、`skills/dsh-ui-cell/references/spacing-motion.md`
  （Agent 读，随包分发）；`AGENTS.md` 加红线 6、`README.md` 与 wiki 索引同步
- 文档站演示：新增 `docs/wiki/demos/spec.tsx`（侧栏「规范」分组：Spacing 间距刻度尺 +
  组内/组间对照、Motion 三档时长对照 + 真组件 + 循环节律），并把既有 demo 的内联间距
  全部换成 `var(--dsh-space-*)`（文档站自己先守规范）；实测三档解析为 0.1s / 0.2s / 0.3s，
  缓动统一 `cubic-bezier(0.4, 0, 0.2, 1)`
- 实机验收（本地文档站，DSH 0.2.2-rc.1 token）：基础层变量在 `:root` 解析正常
  （`--dsh-space-8` = 8px 等）；Select 的 chevron 让位、Card / Alert 的内边距与组间距、
  手风琴与折叠区的缩进对齐均正常，Collapsible 触发器文字与内容左边界像素级对齐（都是 322px）
- 文档站重建：`pnpm docs:build` → index.html 1875 KB，registry 95 条目
- 版本号 0.5.0 → 0.6.0

## 待办（消费端）

- dsh-pilot / dsh-ledger 要吃到新间距与新动效，需 `add --force` 重新复制；不重装维持现状
  （复制即独立的设计意图，不是回归）
- 重装后必须把 `foundation-css.ts` 拼在注入器**第一段**，否则间距全没且零报错
