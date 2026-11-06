---
id: 001
type: feat
title: 立项：DSH 插件专用的 shadcn 式 UI 组件框架
status: done
priority: P1
labels: [ui, 组件, 分发模型, 合规]
created: 2026-11-04
updated: 2026-11-04
assignee: jianan
related: []
---

# 001 · 立项：DSH 插件专用的 shadcn 式 UI 组件框架

## 背景

DSH 官方插件开发规范（`practices.md`）明文禁止第三方插件 load 官方 Harness Client 包
（含 `@deepseek-ai/dsh-client-ui-primitives`），理由是「它们随时会变、纯 JS 插件没有类型检查、
组件抛错会让 slot 空白」。规范给出的 sanctioned 路径是：**把 primitive 的 markup、CSS、行为
复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这与 shadcn 的核心哲学几乎同构（组件源码归你所有、复制而非依赖、token 化样式）。但 shadcn 的
组件实现层（Radix + Tailwind）落不到 DSH 环境上：

- **Tailwind 需引入构建管线**：第三方插件的 client 构建是手写 tsdown 配置，官方 clientBundle
  预设的 lightningcss 通道对外插件不可用，插件样式只能走运行时 `<style>` 注入
- **preflight 会泄漏**：Tailwind 的全局重置会影响宿主页面（插件渲染在宿主 slot 里）
- **组件需反改贴宿主**：shadcn 组件长得像 shadcn，而这套框架的核心价值恰是 match the host
  （官方 primitive 的样式已 token 化、行为已是用户习惯的）

## 决策

**搬 shadcn 的分发模型，组件层用 DSH 官方源码。**

| shadcn | dsh-ui-kit |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-kit add` |
| Radix UI | DSH 官方 ui-primitives 源码（保真复制） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

与 shadcn-vue / shadcn-svelte 等移植项目同构：保留模型、为宿主技术栈重做组件层——而我们连
重做都省了，组件层直接是宿主亲生的。

## 实现要点

- **`add` 做三件事**：① 复制组件源码进插件 `src/client/ui/`（源码归插件，与本仓解耦）；
  ② 类名前缀化（`.button` → `duk-button`），官方规范要求复制后重命名以免与插件自身样式相撞；
  ③ `.css` → `<name>-css.ts`（导出 `styles` 样式文本 + `css` 类名表），因为插件构建无 CSS 管线
- **类名表机制**：`css` 表以**原类名为键、前缀化类名为值**，于是官方组件里 `css[variant]`
  这类动态索引访问无需改写 tsx 即正确（键若也前缀化，动态索引就断了）
- **token 纪律**：只允许 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-elevation-*` /
  `--dsw-focus-ring-*`；禁 `--dsw-static-*`（调色板原子色，官方换肤会重映射）、禁
  `--dsw-specific-*`、禁字面颜色
- **行为保真清单**：Modal（焦点陷阱 / Escape / 焦点归还 / 层级栈）、SegmentedControl
  （WAI-ARIA 键盘走查 / roving tabindex）——官方点名要保的用户依赖行为，不得简化
- **自守护栏 7 条**：registry 一致性（条目↔文件）、planned 不得有源码、token 纪律、
  类名前缀化（含「CSS 小数点不是类选择器」的误伤防护用例）

## 首批组件

9 个 ready：button / input / tag / segmented-control / modal / risk-confirmation / select /
textarea / icon；3 个 planned：tooltip / menu / switch（行为组件，按需 add）。

`select` 与 `textarea` 是 kit 自有（官方无对应原子）：保留原生元素的语义与移动端体验，
只把外观收敛到 token 面。

## 影响面

- 消费侧零成本接入：一条命令 + 两步接线（import 组件、把 styles 拼进已有注入器）
- 插件侧净收益：对官方 client 包的依赖归零（issue 031 的受控违规彻底消除）
- 上游变更不影响已复制的消费者（源码归插件）——这是 shadcn 模型的核心收益

## 验收标准

- [x] 独立仓建成并推 GitHub（`git@github.com:dreamariner/dsh-ui-kit.git`）
- [x] `add` 可用：复制 + 前缀化 + CSS→TS 转换，产出组件的跨文件 import 全部可解析
- [x] `pnpm test` 7 条自守护栏全绿；`pnpm typecheck` 零错
- [x] registry 登记基线（dshVersion 0.2.1-rc.3 / commit 1f81c047fc）与各组件 upstream 出处
- [x] 首个消费者落地（姊妹插件仓的记忆插件）：65 调用点迁移，官方 client 包依赖归零
- [x] README 与 AGENTS.md 写明用法、纪律、升级流程（逐组件按 upstream 重 diff）

## 进度日志

- 2026-11-04  jianan  立项并建成。两轮讨论拍板技术路线：先问「能不能直接用 shadcn」，
  结论是搬模型不搬实现（Tailwind 管线 + preflight 泄漏 + 反改贴宿主三重障碍），组件层
  直接用官方 primitives 源码——官方本来就明文建议第三方复制它们。
- 2026-11-04  jianan  实现完成：9 组件 + 3 辅助模块 + CLI + 护栏。实施中修正三处设计错误：
  ① 类名表键必须是原名（否则 `css[variant]` 动态索引断掉）；② 非样式文件保持原扩展名
  （辅助模块是 .ts 不是 .tsx）；③ `add` 允许省略子命令词。
- 2026-11-04  jianan  首个消费者落地：姊妹插件仓的记忆插件迁移 65 调用点 + 5 处裸表单
  元素，官方 client 包依赖归零，实机验收通过（详见姊妹仓迁移验收记录）。
