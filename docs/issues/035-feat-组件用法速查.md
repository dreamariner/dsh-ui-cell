---
id: 035
type: feat
title: 组件用法速查（从 demo 生成，随包分发）—— 消费端「这个组件怎么用」有答案了
status: done
priority: P2
labels: [文档, skill, 分发]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [033, 034]
---

# 035 · feat · 组件用法速查

## 背景

复审问了一个真问题：**具体插件项目用 dsh-ui-cell 时，怎么知道每个组件怎么用？**

盘了消费端拿到的全部东西（npm 包 `files`：lib / src / skills / registry.json /
AGENTS.md / README.md）：

| 有什么 | 能解决什么 | 缺什么 |
|---|---|---|
| `SKILL.md` | 接入流程、接线细节、坑位 | **没有逐组件用法** |
| `registry.json` | 名字 / 状态 / 依赖闭包 / 一句话描述 | 够选型，不够使用 |
| `src/`（复制进插件的源码） | props 接口 + JSDoc（权威） | 只有签名，没有组合示例 |
| `docs/` | 文档站有 demo | **不在 npm 包里** → 消费端拿不到 |

所以消费端只有两条路：读复制到插件里的 TS 源码（权威但费 token），或翻公开文档站
（GitHub Pages 上的 HTML，给人看的，Agent 不便消费）。

而**用法示例其实早就有了** —— 文档站每个 Demo 的 `code` 段就是最小可用片段。

## 做法：从 demo 生成，随包分发

`scripts/gen-component-usage.mjs` → `skills/dsh-ui-cell/references/components.md`。

每条给四样东西：

1. **一句话选型说明**（registry 的 description）
2. **最小可用片段**（文档站 demo 的真代码，不是手写的第二份）
3. **可接的 props 字段名**（从源码的 props 声明抓：三种形态都认 ——
   `export interface XxxProps` / `type XxxProps = {…}` / 函数签名里的内联对象类型；
   类型不展开，让 Agent 看源码 —— 源码就在插件目录里）
4. **依赖**（registry 的 dependencies，`add` 会自动带上）与 **npm 依赖**（content 档）

按文档站的分组排列（原子件 / 容器与布局 / 浮层与反馈 / 输入进阶 / 内容块），
末尾列出没有 demo 的条目。

**为什么从 demo 生成而不是手写**：手写的第二份用法文档必然与 demo 漂移
（示例会过期、两个地方不一致）。生成的则永远跟 demo 一致，护栏查得到。

## 防漂移

- `pnpm skill:usage` 重新生成；`pnpm skill:usage:check` 只校验
- **护栏 +1**（`tests/registry.spec.ts`）：生成物与 demo 不一致就红
- **CI +1 步**：`guardrails` job 里跑 `pnpm skill:usage:check`

## 顺带纠正一个此前的误判

上一轮说「97 个 ready 条目里 8 个在站点没有演示」—— **数错了**
（当时是从 import 语句 grep 的，把上下文行里的名字也算进去了）。
按 demo 的 `id` 实点：**77 个有 demo，20 个没有**，其中 12 个是行为模块
（focus / modal-layer / clipboard / pointer-grace / keyboard-composition /
overlay-top-margin / dismiss-on-outside-pointer / head-tail-cap /
clipboard-copy / use-prefers-reduced-motion / foundation / anchored-position），
本来就不需要 demo；**8 个是可视组件欠演示**：
`chart`（三个图）/ `carousel` / `command` / `web-block` / `user-message-bubble` /
`sidebar-nav` / `animated-rows` / `icon`。

## 结果

`pnpm test` 158 通过 1 跳过（新增 1 例）、`pnpm typecheck` 绿。
npm 包文件数 221 → **222**（多了 `skills/dsh-ui-cell/references/components.md`）。

## 待办

- 8 个欠演示的可视组件（chart / carousel / command / web-block / user-message-bubble /
  sidebar-nav / animated-rows / icon）—— 补了 demo，速查表会自动长出对应条目
- 另一条更彻底的路：**组件源文件头加「用法」块**（复制进插件后就在手边，
  Agent 读 `src/client/ui/xxx.tsx` 即得用法，不依赖额外文件）。97 个件逐个写，
  成本高；可先挑高频 20 个试点
