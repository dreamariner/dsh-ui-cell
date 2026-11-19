---
id: 033
type: docs
title: 文档站演示补齐 rc.5 的新能力（Modal warning / Menu 子菜单 / QuotePreview summary / CodeBlock diff 围栏）
status: done
priority: P2
labels: [文档, 演示, 上游跟进]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [030, 031, 032]
---

# 033 · docs · 文档站演示补齐 rc.5 的新能力

## 背景

rc.5 同步（issue 029 / 030）把组件源对齐了，但**文档站的演示没跟上**：
读者在站点上看到的仍是 rc.1 的能力，看不出上游这轮改了什么。

查了一遍「registry 条目 ↔ 文档站演示」的对应关系：**97 个 ready 条目里 8 个在站点上
完全没有演示**（icon / animated-rows / user-message-bubble / command / carousel /
chart / web-block / quote-preview），另有若干「有演示但没体现新行为」的。

## 本次补的四处（都是 rc.5 引入的）

| 组件 | rc.5 的变化 | 演示怎么补 |
|---|---|---|
| **Modal** | 新增 `tone='warning'`（琥珀标题图标 + 标题正文间距收紧） | 演示区加「警告态模态」按钮与实例，说明段讲清什么时候用 |
| **Menu** | 菜单族重写：条目可带 `submenu`、悬停/聚焦/点击/ArrowRight 打开、ArrowLeft 回父级、Escape 先关子菜单、子菜单走 body portal、CSS anchor 定位 | 「导出」条目加子菜单（Markdown / JSON / 复制到剪贴板 ⌘⇧C），说明段列新交互 |
| **QuotePreview** | 新增 `summary` 形态（可读摘要替代长结构化原文） | **该组件此前完全没演示** → 新增演示段：原文形态（截断才弹悬浮全文）+ summary 形态（摘要行替代原文，悬浮看详情） |
| **CodeBlock** | 新增 diff 围栏逐行渲染（行色按标记列，新旧两侧各自 tokenize） | 演示区加一个 unified-diff 代码块，说明段点出解析在 `diff-fence.ts` |
| **RiskConfirmation** | 警告图标上收到 Modal 的 `tone='warning'`、勾选框换共享 `Checkbox`（带 `modalAutofocus`） | 演示原本就有（内部变化自动生效），说明段补上这两处 |

## 顺带修的一处站点保真偏差

复审时看到警告态模态的**正文偏大**，查下来不是 rc.5 带来的（上游 rc.5 的
Modal.module.css 只加了 warning 三条规则，字号与尺寸一字未改），而是**站点自己的问题**：

- Modal 的 `.body` 区域**不设字号**（上游如此）→ 插槽内容继承宿主 body 字号；
- 宿主 DSH 应用的内容字号是 `--dsh-content-font-size`，默认 **14px**；
- 而**文档站的 body 压根没写 font-size** → 浏览器默认 **16px** → 比真应用大两号。

后果：站点上所有「消费端自己写的插槽文本」（Modal 正文、卡片段落……）都比真插件大 2px，
标题与正文同档（16 vs 16），层次也塌了。

修法：站点 `body` 显式设 `font-size: 14px`（模拟宿主），并在 wiki 的演示约定里加第四条
「插槽内容不必自己写字号」。组件自身的字号一律不动（那是组件的账）。

实测（站点 body 14px 后）：正文 14px 一行放下，标题仍 16px/500，模态宽度 380px 不变。

## 实机核对

- Modal warning、Menu 子菜单、QuotePreview summary、CodeBlock diff 四处均已渲染
- Menu 子菜单实测：`[role="menu"]` 计数从 1 变 2（子菜单走 portal 挂在 body 上），
  子菜单项「复制到剪贴板」在页面中；视觉上是主菜单右侧弹出带 › 箭头的卡片

## 仍未覆盖的演示（历史欠账，非 rc.5 引入）

`icon` / `animated-rows` / `user-message-bubble` / `command` / `carousel` /
`chart` / `web-block` 七个条目在文档站没有演示入口。其中 `chart`（三个图）、
`carousel`、`command` 是常用件，欠得最久 —— 另立 issue 补。

## 结果

`pnpm test` 157 通过 1 跳过、`pnpm typecheck` 绿、站点已重建（1978 KB）。

## 待办

- 历史欠账的 7 个演示（chart / carousel / command 优先）
- 演示站点新增段落时，同步更新 wiki 里的「演示约定」（quiet 态注释三条）
