---
id: 038
type: fix
title: 发射的 styles 文本剥掉 :global(...) 外壳（浏览器不认，规则被静默丢弃）
status: done
priority: P1
labels: [分发, css, 消费端, 护栏]
created: 2026-11-20
updated: 2026-11-20
assignee: lin
related: [005, 036]
---

# 038 · fix · 发射样式剥 :global 壳

## 发现（升级消费端时带出来的）

给 5 个消费插件仓升 0.6.0 复制件时审 diff，看到 mpc 的 tooltip-css.ts 里有一行：

```
:global(:where(html[data-platform='darwin'])) .duc-tooltip-bubble { -webkit-app-region: no-drag; }
```

这是官方 CSS Modules 源里的写法。问题：复制件的 styles 是**运行期 `<style>` 注入的
纯 CSS 文本**（第三方插件的 client 构建无 CSS 管线，这是本仓模型的前提），没有任何
构建期处理再碰它，而**浏览器不认识 `:global` 这个伪类**。CSS 的规则：选择器里有未知
伪类 = 整条选择器无效 = **该规则被静默丢弃**（零报错）。这正是本仓 README 里
「token 拼错 = 整条声明被丢弃」的同款隐蔽失败，只是这次发生在选择器层。

## 影响面

全库扫 `:global(`（26 处，都在官方复制件的 css 源里）：

| 条目 | 处数 | 丢的是什么 |
|---|---|---|
| tooltip | 1 | macOS 的 no-drag（`html[data-platform='darwin']`） |
| menu / menu-group | 1 + 1 | 键盘输入模态判定（`html:not([data-input-modality='keyboard'])`）与 darwin 分支 |
| hover-card | 2 | macOS no-drag |
| markdown-text | 11 | katex 展示、表格宽屏钩子（`.md-table-wide`）、代码块类名钩子 |
| code-block / read-block / web-block / quote-preview / detail-document | 3 + 1 + 3 + 1 + 1 | shiki 行 span、宿主钩子 |

对 5 个消费仓的直接影响：mpc 与 dsh-image-design 的 tooltip（各 1 条）、
dsh-image-design 的 menu / menu-group（2 条）。

## 修法

发射前剥壳：`:global(X)` → `X`。

- 外壳只是「内层不参与哈希」的**构建期声明**；内层本来就是全局契约
  （katex / shiki / 宿主 html 属性钩子），剥掉后直接写就是合法纯 CSS，语义不变
- 内层类名**不改名**（保护机制照旧）：`.katex` / `.line` / `.md-table-wide` /
  `html[data-platform]` 都是第三方契约，改了就失配
- 源 css 不动（`pnpm upstream:check` 照过：偏离集合仍是登记的 10 个）

两处实现：

1. `cli/add.ts` 的 `buildStyleModule`：发射的 styles 文本过 `unwrapGlobals`
   （原样注入通道也过，今天无行为差）
2. `scripts/build-docs.mjs`：站点聚合样式走的是 `prefixCss` 直调（不走
   buildStyleModule，因为只需要文本不需要类名表），同样补剥壳；
   `unwrapGlobals` 导出复用

顺带把 `:global(...)` 的**边界识别**从 `[^)]*` 正则换成平衡括号扫描：嵌套形态
（`:global(:where(html[...]))`、`:global(html:not([...]))`）会被 `[^)]*`
截在第一个 `)` 上。保护扫描（类名不改名）同样换掉，两处共用 `globalSpans`。

## 护栏

- 「发射的 styles 文本不含 :global」：全部 ready 条目逐文件断言（抓 styles 字面量
  JSON.parse 后查）
- 「剥壳后的选择器语义不变」：tooltip / menu / menu-group / markdown-text 四个
  形态逐条断言（含嵌套括号）

## 结果

`pnpm test` 162 通过 1 跳过（新增 2 例）、`pnpm typecheck` 绿、
`upstream:check` / `vendor:check` / `skill:usage:check` 全绿、站点重建后 `:global(`
零残留（1979 KB）。发 0.6.1。

## 待办

- 5 个消费仓用 0.6.1 重新 add（本次升级本来就要全量重复制，顺路覆盖）
- 此前发过 0.6.0 的消费端（若有）需要重新 add 上面列的条目
