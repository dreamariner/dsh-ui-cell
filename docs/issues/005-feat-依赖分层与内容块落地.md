---
id: 005
type: feat
title: 依赖分层（原子零依赖 + 内容块带依赖）与 markdown 家族落地
status: done
priority: P1
labels: [dsh-ui-cell, markdown, 依赖分层, shiki]
created: 2026-11-06
updated: 2026-11-06
assignee: lin
related: [004, luna-dsh#033, dsh-ledger#002, dsh-pilot#002, media-platforms-center#001]
---

# 005 · 依赖分层与 markdown 家族落地

## 背景

**原纪律是我自己设的，不是需求。** kit 此前定「零运行时依赖」红线，导致 8 个组件暂缓
（markdown 家族 / ReadBlock / WebBlock / QuotePreview / DetailDocument）+ 3 个替身缩水
（无语法高亮 / LCS 手写 diff / 坏 CSS 的 ANSI）。

2026-11-06 用户质疑「为什么我们要零依赖？我没有要求过零依赖」。复核 DSH 官方规范后确认：
**DSH 的硬约束只有一条**（`practices.md:35` 禁止 load 官方 Harness Client 包），**普通 npm
依赖随便带**——零依赖不是官方要求，是我从「复制路线 → 复制件自担依赖 → 插件重复携带」的
推导里升级出来的纪律，且没跟用户确认。

对照样本 `bowenliang123/dsh-context`（另一条路线）反而印证了这点：它把
`@deepseek-ai/dsh-client-ui-primitives` 声明为宿主模块表供给，运行时直接 load 官方包
——**技术可行，但正是 practices.md:35 点名禁止的**；而且它 devDep 锁 0.2.0-rc.2、
运行时由宿主给 0.2.2-rc.1，类型与运行时版本错配且无编译期保护。

## 目标

按用户拍板：**分层**（原子层零重依赖 / 内容块层带 npm 重依赖），并**一次性**做完：
补齐 8 个暂缓组件、3 个替身升级为真实依赖、CLI 补上依赖交接机制。

## 方案

### ① 依赖分层机制（registry + CLI）

- registry 条目新增 `tier`（`atom` 默认 / `content`）与 `npmDependencies`（包名 → 版本范围）
- CLI `add` 收集闭包内的 npm 依赖，与消费端 package.json 对比：
  - 默认**只提示**（改消费端仓库是有副作用的动作）
  - `--with-deps` 才写进消费端 `dependencies`
- 护栏：条目声明的 npm 依赖与源码里的裸 import **双向**匹配（`@types/X` 算满足 `X`）；
  atom 档不得声明 npm 依赖；content 档的**闭包**里必须有 npm 依赖（可经依赖传递）

### ② 三个替身升级为真实依赖

| 替身 | 升级为 | 修掉的实际缺陷 |
|---|---|---|
| `mini-diff`（LCS 手写） | npm `diff` 的 structuredPatch + kit 的预算守卫做外层 | 前导 context 回填用 `lastIndexOf` 找重复行 → 位置取错 |
| `ansi-lite`（SGR 子集） | **官方 `ansi.ts` 保真复制** + npm `anser` | 256 色调色板按灰阶近似；truecolor 输出 `rgb(rgb(r,g,b))` → 浏览器整条丢弃 |
| `code-highlighting-lite`（恒 false） | kit 自有高亮内核 + shiki（JS 正则引擎 + css-variables 主题 + **静态 10 种常用语法**） | 代码块永远无高亮、语言名永不显示 |

顺带补了 `code-block` 组件（官方 `markdown/CodeBlock.tsx`）：kit 原先只有工具栏，
没有代码正文渲染器，换真 shiki 也看不见高亮。

### ③ markdown 家族落地（保真复制 + 裁剪）

新条目 5 个（markdown-text / read-block / web-block / quote-preview / detail-document），
共 22 个文件。**裁剪边界（明确不是遗漏）**：

| 裁掉 | 理由 |
|---|---|
| 流式增量解析（`incremental.ts` + `StreamingHighlightSession`） | 第三方面板不是流式场景 |
| `DraggableImage` | DSH workspace 耦合（file-drag-actions）；图片降级用 kit 的 `ImagePreview` |
| 官方 `LinkIcon` + `simple-icons` | 36 个站点 mark 的运行时依赖，收益不抵成本；换 kit 自有简化版（按扩展名猜类型 + kit 15→17 个图标） |
| 官方 `FileTypeIcon` | 品牌件（文件类型表） |
| `dsh-app://` 私有协议 | DSH Desktop 专属 |

**KaTeX CSS 文本化**：官方 `import 'katex/dist/katex.min.css'` 在消费端无 CSS 管线，
改为随组件带 `katex-css.ts`（字体 URL 指向 jsdelivr CDN；离线环境公式降级但结构可读）。

**shiki 静态语法集**：官方靠 dynamic import 懒加载 ~40 个语言，依赖宿主 package-local
chunk 登记机制（那是宿主自建包才有的基础设施），第三方插件不依赖它 → 静态打包 10 种常用语法。

### ④ 顺带修的两个现存 bug

- `code-toolbar` / `diff-block` 复制出去是**悬空导入**（`import cardCss from './code-card.css'`
  而消费端只有 `code-card-css.ts`）。原护栏只跑 `risk-confirmation` 一个条目没覆盖到；
  现改为**逐个 ready 条目全跑**（这条一改就立刻红在 code-toolbar/diff-block 上）。
- `prefixCss` 不认 `:global(...)`：官方 markdown CSS 有 11 处 `:global(.katex)` /
  `:global(.md-code-block)` / `:global(.line)`，会被错误改名 → katex/shiki 样式失配。
  现在 `:global(...)` 内既不改名也不进类名表。

### ⑤ 冒烟阶段抓到的第三个缺口：raw 样式是孤儿

消费端冒烟（`add` 9 个组件）时发现：`katex-css.ts` / `shiki-css.ts` 生成了，
但**没有任何组件 tsx 引用它们**。消费端的样式注入模式是
「显式 `import { styles }` 拼进 `<style>` 注入器」（见 dsh-ledger 的 `panel-css.ts`），
而 raw 样式的类名表是空的、组件用不上它们 → 它们天然是**孤儿**：
消费端不知道要拼，漏拼是**静默失败**（公式塌成一坨、代码高亮没颜色，零报错）。

修法：add 的 note 里显式点名 raw 样式模块，并说明为什么要自己 import。护栏盯着
（raw 样式模块必须出现在 add 的 note 里）。

核实过宿主情况：`shiki.css` 宿主 ui-theme 已全局注入（重复无害），
`katex.css` 宿主**不提供**（官方靠包内 `import 'katex/dist/katex.min.css'`），
第三方插件必须自己带上。

### ⑥ 冒烟抓到的第四个缺口：React 19 类型不兼容

冒烟用 React 19 的 `@types/react` 编译消费端产物时报：

```
src/client/ui/read-block.tsx(81,48): error TS2345:
  Argument of type 'RefObject<HTMLDivElement | null>' is not assignable to parameter of type 'RefObject<Element>'
```

原因：React 19 的 `useRef<T>(null)` 返回 `RefObject<T | null>`，而官方
`useViewportHighlighting(target: RefObject<Element>)` 没带 `| null`。
DSH 官方自己锁 React 18（`ui-primitives` 依赖 `react: ^18.2.0`）所以从没暴露，
但 kit 是给第三方用的，第三方用 React 19 就会撞上。

修法：kit 侧把签名放宽成 `RefObject<Element | null>`（kit 里其他 ref 参数本来
就是这个写法，只有这一个跟官方一样）。实测 React 18 与 19 两版类型都编译通过。

**这是 kit 唯一一处偏离官方的类型签名**，已在 `src/markdown-viewport-highlighting.ts`
的头注登记，升级重 diff 时要留意别改回去。

## 结果

- registry 87 → **94 条目**（atom 89 / content 5）
- 护栏 19 → **27 条**（新增：`:global` 不改名 / npm 依赖双向匹配 / content 档闭包有依赖 /
  atom 档无依赖 / 全条目悬空导入 / raw 样式被 note 点名 / rawStyles 登记与文件一致 /
  raw 样式不产出类名表）+ **8 条 markdown 渲染回归**（真实 shiki 高亮、KaTeX、
  GFM 表格、任务列表、不安全协议禁用、omitHtml）
- **消费端冒烟**：`add` 9 个组件 → 66 个文件 → 装依赖 → `tsc --noEmit` **零错**（证明复制产物
  真能独立编译，含跨条目 css 引用与依赖交接）；**React 18 与 19 两版 `@types/react` 都验过**
- 依赖交接实测：add 时报出 19 个缺失的 npm 包（shiki / katex / diff / anser / micromark 家族…），
  `--with-deps` 能正确写进消费端 `package.json`
- **三仓回归**：media-platforms-center（1410 测试）/ dsh-pilot（72）/ dsh-ledger（65）全绿；
  三仓只用原子件，与内容块层无交集。typecheck 报的 `import-guard.spec.ts` 的
  `isTypeOnly` 错误是**既存问题**（ts-morph 版本 API 差异，与本次改动无关）

## 遗留与边界

- **bundle 体积**：内容块层组件带真实依赖，消费端装了就变大。这是分层的**代价**，
  wiki 03 给了选档指引与量级说明。
- **shiki 版本锁 4.4.3**：官方 `patchGoGrammar` 绑死该版本的语法结构（升级即失效的地雷）；
  kit 不带 Go 语法故不需要该补丁，但版本仍锁在 4.4.3 与官方一致。
- **KaTeX 字体走 CDN**：离线环境公式降级（无字体，结构仍可读）。
- **升级纪律**：markdown 家族是保真复制 → DSH 升版要逐文件重 diff（与既有 30 个保真件同纪律）。
  搬运脚本 `scripts/import-markdown-family.mjs` 保留在仓里（机械搬运 + 导入路径改写），
  语义裁剪仍需手工过一遍。
