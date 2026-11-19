---
id: 029
type: chore
title: 上游跟进 DSH v0.2.2-rc.5（五个保真件重导入 + token 快照重生成；锚点与全量重 diff 留待办）
status: done
priority: P2
labels: [上游跟进, 基线锚, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [012, 013, 028]
---

# 029 · chore · 上游跟进 DSH v0.2.2-rc.5

## 背景

工作树里出现了一轮**部分上游重导入**（源文件头注记与 `tokens/official-tokens.json`
都已指向 rc.5），但 `registry.json` 没跟上，护栏 3 条红：

```
risk-confirmation: 实际依赖 [button, checkbox, modal]，声明 [button, modal, icon]
risk-confirmation.tsx → ./checkbox.tsx（单加即坏：悬空导入）
```

根因很直接：上游 rc.5 把 `RiskConfirmation` 的**警告图标上收到 Modal 的
`tone='warning'`**，勾选框改用**共享 `Checkbox` 组件**，于是它的直接导入从
`icons` 变成 `checkbox`。registry 的依赖声明还停在 rc.1 的形状。

## 本次做了什么

### 1. 依赖声明跟上实际导入（护栏定义的真相）

`risk-confirmation` 的 `dependencies` 改为 `button / checkbox / modal`
（去掉 `icon`、加上 `checkbox`）。这是「声明必须等于实际相对导入」这条护栏
的直接要求，声明错 = `add` 的依赖闭包解析错 = 消费端单加这个件就编译不过。

### 2. 上游注记逐件改到 rc.5

五个已重导入的件，注记从 rc.1 改成 `v0.2.2-rc.5 (9c2670d3bc)`：
`animated-rows` / `checkbox` / `modal` / `quote-preview` / `risk-confirmation`。
其中 `quote-preview` 原来写着 rc.1，而文件已经是 rc.5，属**假声明**，必须改。

### 3. 顶层锚点**不动**（沿用 rc.2 时的先例）

`dshVersion` / `dshCommit` 保持 `0.2.2-rc.1` / `66491b05e3`：

- 历史上锚点只在**全量重同步**时动过（0.2.1-rc.3 → 0.2.2-rc.1，2026-11-06）；
- 上次 token 清单走到 rc.2 时，锚点也没动（提交信息写明「registry 组件基线仍
  rc.1，重 diff 另立 issue」）；
- 现在是**部分**重导入（97 个件里 5 个是 rc.5），把锚点写成 rc.5 会**过度声称**
  其余 92 个件也是 rc.5 的复制件。

组件基线是混合态这件事写进了 `registry.json` 的顶层 `notes`，免得下一个人
误读锚点。

### 4. token 快照已是 rc.5（`pnpm vendor` 跑过）

`tokens/official-tokens.json`：rc.2 → rc.5（`9c2670d3bce…`）。这是上游 token
定义的 pinned 快照，与组件基线是两回事，可以单独前进。

## 护栏

`pnpm test` 150 通过 1 跳过、`pnpm typecheck` 绿。

## 待办

- **剩余 ~92 个件的逐条重 diff**（rc.1 → rc.5）：按各条目的 `upstream` 字段
  逐组件比对，重点看行为保真清单（Modal 焦点陷阱 / SegmentedControl 键盘走查 /
  Modal 层级栈）与 token 引用是否变过
- rc.5 新增的两个 API 要复审是否与本仓侧改动冲突：
  `Modal` 的 `tone='warning'`、`Checkbox` 的 `modalAutofocus`
- 全量重 diff 完成后，锚点一次性改到 rc.5
- 消费端要吃到需 `add --force` 重新复制受影响的件
