---
id: 008
type: feat
title: sheet 补开合动画（相位状态机）+ 复制件前缀统一到 duc-
status: done
priority: P1
labels: [sheet, 动画, 组件行为, 护栏]
created: 2026-11-09
updated: 2026-11-09
assignee: lin
related: [007]
---

# 008 · feat · sheet 补开合动画（相位状态机）+ 复制件前缀统一到 duc-

## 背景

消费端（dsh-pilot 插件）把项目详情做成侧滑面板后，反馈两条：

1. **sheet 打开和关闭缺少动画**
2. 消费端早先装的控件还带着 `duk-` 前缀

### 一、动画为什么没有

本仓的 sheet 是**自有组件**（`upstream: null`，对齐 shadcn sheet），但初版是照官方
ui-primitives 的 Modal 写法来的：

```tsx
if (!open) return null
```

`open` 一变 false，面板当场从 DOM 消失 → **出场动画没有任何机会播**；进场只有
`translateX(24px)` 的小幅位移 + 淡入（24px 在 520px 宽的抽屉上几乎看不出来）。
两者叠加，观感就是「没动画」。

官方自己不需要出场动画（面板由宿主统一管理），但**插件里的抽屉需要**，
而 sheet 是本仓自有组件，可以按 shadcn 的抽屉体验补齐。

### 二、`duk-` 前缀的来龙去脉

007（2026-11-07）把默认前缀从 `duk-`（旧名 dsh-ui-kit 的缩写）改成 `duc-`。
消费端早于 007 装的那批控件仍是 `duk-`，改默认只影响**之后**新装的组件，
所以消费端出现了两套前缀并存（sheet 是新装的 `duc-`，按钮 / 下拉 / 页签 / 通知是旧的 `duk-`）。

消费端把全部组件样式拼进**同一个 `<style>`**：官方 CSS Modules 的 per-file 哈希隔离
在这里不存在，前缀不统一 = 类名跨组件互覆的土壤（本仓红线 2）。

## 方案

### 一、sheet 相位状态机（`src/sheet.tsx`）

- `mounted`（DOM 在不在）与 `phase`（`open` / `closed`，写进根节点 `data-state`）分开管。
  关闭：`phase='closed'` → DOM 留着播出场动画 → `animationend` → 才卸载。
- **相位切换必须在渲染期**（React 官方「按 props 调整 state」写法），不能在 effect 里：
  effect 里切会让 DOM 比 `open` 晚一个提交才出现，于是 `useModalLayer` 的 layout effect
  跑在 DOM 出现之前 → **层级栈不注册 → Escape 关不掉、焦点也不进对话框**。
- 降级：`prefers-reduced-motion: reduce` 时 CSS 关掉动画（没有 `animationend`），
  组件侧自己判断并直接卸载。
- 兜底：出场段另有定时器（800ms > 官方 `--ds-transition-duration`），动画事件没来也照样卸载。

### 二、样式（`src/sheet.css`）

- 进出场两段都由 `data-state` 驱动；位移量走自定义属性 `--sheet-shift-x` / `--sheet-shift-y`
  （方向规则只改这两个值，进出场共用同一对 keyframes，不必四个方向各写一条）：
  - `sheet-in`：面板从视口边缘滑入（位移 = 面板自身尺寸）+ 淡入；遮罩 `mask-in` 淡入
  - `sheet-out`：面板滑回边缘 + 淡出；遮罩 `mask-out` 淡出
- 时长改用官方 token `var(--ds-transition-duration)`（此前写死 160ms，与本仓 Modal 不一致），
  缓动用 `var(--ds-ease-in-out)`。
- `prefers-reduced-motion` 降级：`animation: none`。

### 三、回归测试（`tests/sheet.spec.tsx`，9 例）

钉住：① 关闭时 DOM 先留着（`data-state="closed"`），`animationend` 之后才卸载；
② 减少动效时直接卸载；③ **从关闭态打开**这条路径上，Escape 能关、焦点能进对话框；
④ 样式表的动画契约（两段动画 + 位移自定义属性 + 降级块）。

⚠ 第 ③ 条要测「从关闭态打开」而不是「初始就是打开」：初版测试只测后者，测不出上面那个
DOM 时序回归（是先在消费端实机踩到、再回头把护栏补成能咬人的形态）。

## 影响面

- 只动 sheet 自有组件（`src/sheet.tsx` / `src/sheet.css`）+ 新增测试文件；
  `useModalLayer` 等官方保真复制件**没动**（本仓红线 3）。
- 消费端需要重新 `add sheet --force` 才能拿到修复（复制件是生成物，不重装就还是旧行为）。

## 结果

- 本仓三门禁绿：`pnpm test` 52 通过 1 跳过、`pnpm typecheck` 绿、`pnpm build` 绿
- 消费端（dsh-pilot）重装后实机验证：进场 transform 520px → 0、出场 0 → 518px、
  opacity 1 → 0，动画播完才摘除 DOM；Escape 可关；焦点进对话框后能归位
- 消费端 7 个复制件统一 `duc-` 前缀，`duk-` 零残留（消费端 issue 005 记）

## 留痕

- 本 issue 的另一半（前缀统一）在消费端完成：kit 侧 007 已把默认前缀定成 `duc-`，
  这里只是把「早于 007 装的那批」在消费端重装对齐；kit 自身无需改动。
