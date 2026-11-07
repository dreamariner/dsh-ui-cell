---
name: dsh-ui-cell
description: DSH 插件接入 dsh-ui-cell 组件的操作手册（shadcn 式复制分发：add 复制源码进插件、类名 duc- 前缀、样式转 TS 运行时注入、npm 依赖交接）。触发场景：给 DSH 插件新增或修改 client 面板、控件、内容块；被要求使用 dsh-ui-cell 组件；执行 add 后做接线（样式注入、依赖安装、raw 样式拼接）；add 产物编译报错的排查；组件升级后重新复制；原子件（atom）与内容块（content）的选型。当任务提到 DSH 插件 UI、panel-css、duc- 类名或前缀冲突时也应触发。
version: 1.0.0
author: Jianan
---

# dsh-ui-cell 接入手册（Agent 视角）

dsh-ui-cell 是 DSH 插件专用的 shadcn 式组件源：`add` 把组件**源码**复制进插件
（复制即独立，源码归插件所有），类名加 `duc-` 前缀与组件名段，CSS 转成 TS 字符串
运行时注入。官方 primitives 保真件 + shadcn 对齐件 + 内容块共 94 个条目，权威清单
在包内 `registry.json`（名字、状态、文件、依赖闭包、npm 依赖、上游出处）。

本 skill 管「在插件里把它用对」；仓库纪律（token 红线、行为保真、基线锚）见包内
`AGENTS.md`。两份都随 npm 包分发（`@dreamariner/dsh-ui-cell`），node_modules 里就有。

## ① 选型：原子件还是内容块

| 档位 | 条目 | 新增 npm 依赖 | 何时用 |
|---|---|---|---|
| atom（默认） | 85 个：button / input / modal / tooltip / menu / table / calendar / … | 无（baseline 三件套之外） | 常规控件，任何插件随便用 |
| content | 9 个：markdown 家族 4（markdown-text / read-block / web-block / detail-document）+ 代码与终端 5（code-toolbar / code-block / code-highlighting / diff-block / terminal-block） | shiki（精确锁 4.4.3）/ katex / diff / anser / micromark 家族，约 19 包 | 面板确实要渲染 markdown / 代码高亮 / diff / 终端输出才引入（bundle 数百 KB ~ 1MB 级，见源码仓 wiki 03） |

未收录：官方品牌件（BrandWordmark / FishLogo / SiteGlyph / 专用 Icon）。纯静态一次性
页面不必引入本工具，手写更省。想用的组件先查 `registry.json` 确认存在且 status=ready。

## ② 标准接入（六步）

```bash
# 1. 复制（组件依赖自动解析闭包，deps 先于本体；产物无悬空导入）
npx dsh-ui-cell add button input --to <插件根目录>
#    常用参数：--prefix <pfx>（默认 duc-）  --force（覆盖已存在文件）  --with-deps（缺失 npm 依赖直接写进消费端 package.json，默认只提示）
```

2. **读完 add 输出的每一条 note**，三类各有一件事要做：
   - 「消费端缺这些 npm 依赖」：按 note 里拼好的 `pnpm add …` 照抄安装（scoped 包是完整的，直接可用）；或下次 add 加 `--with-deps` 让 CLI 代写
   - 「原样注入的样式模块」：`shiki-css.ts` / `katex-css.ts` 这类**没有任何组件引用**的孤儿模块，必须手动 `import { styles }` 拼进注入器，漏了就是静默失败（公式不排版、高亮没颜色，零报错）
   - 「已存在未覆盖」：目标文件已存在且未加 `--force`；先确认它是不是插件的本地改动，再决定覆盖与否
3. 组件 import：`import { Button } from '<插件根>/src/client/ui/button.tsx'`
4. 样式注入（panel-css 模式）：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器
5. baseline 三件套：`react` / `react-dom` / `clsx` 是所有组件的共同前提，**不会**出现在缺失提示里，消费端必须自带
6. 验证：在插件根跑 `tsc --noEmit`，add 产物必须能独立编译（React 18 与 19 的类型都已验证）

## ③ 接线细节（机制决定写法）

- **类名表以原类名为键**：`css['primary']` 的值是 `'duc-button-primary'`。官方源里
  `css[variant]` 这类动态索引不用改写就能工作；手写代码一律通过 `css.xxx` 取类名，
  不要自己拼前缀字符串
- **同一个 `<style>` 命名空间**：全部组件样式拼成一份注入。手写样式必须带插件自己的
  前缀，裸类名会与组件类或彼此相撞（`.wrap` 这种名字是重灾区）
- **勿手改 `*-css.ts`**：生成物。临时小改可以直接动组件 tsx / css.ts 里的声明（升级
  重复制会被覆盖，自担）；规范改法是回 dsh-ui-cell 仓的 `src/*.css` 改完重新 add
- **keyframes 同规则改名**：动画名跟类名一样带前缀与组件名段，定义与引用已同步处理，
  不要在插件里再注册同名动画

## ④ 高频坑（每条都有实证）

| 症状 | 原因 | 处置 |
|---|---|---|
| tsc 报 Cannot find module 'clsx' | baseline 三件套没装 | 安装 react / react-dom / clsx |
| 公式塌成一坨 / 代码高亮没颜色，且零报错 | raw 样式（katex-css / shiki-css）没拼进注入器 | 按 note 点名补 import 与拼接 |
| 复制后组件没样式 | styles 没拼进 `<style>`，或 tsx 里手写了最终类名绕过表 | 全部走 `css.xxx` 取类名 + styles 注入 |
| 重新 add 后新旧类名对不上 | 上次用旧默认 `duk-`，本次默认 `duc-` | add 加 `--prefix duk-` 保持同一命名空间，或择机整体迁移 |
| --force 之后本地改动消失 | 覆盖是设计行为 | add 前先 diff / 备份本地修改 |

版本边界：shiki 精确锁 4.4.3（不要浮动它）；KaTeX 字体走 jsdelivr CDN，离线环境公式
结构可读但无字体；React 18 / 19 均可（唯一相对官方放宽的类型签名在
markdown-viewport-highlighting）。

## ⑤ 升级

- 消费端永远不追上游：想吃新版本才 `add --force` 重新复制；不吃的部分维持现状
- 官方 DSH 升级时的逐组件重 diff 是 dsh-ui-cell 仓的职责，消费端只面对 registry 的版本
- 重新 add 前先把插件里对复制件的本地修改整理成清单（或打 diff），覆盖后按清单重放

## ⑥ 深读（按需展开）

- 包内 `AGENTS.md`：token 纪律红线（只引 `--dsw-alias-*` 等稳定面）、行为保真清单
  （Modal 焦点陷阱 / 键盘走查不得简化）、基线锚
- 包内 `README.md`：机制总览（为什么复制式分发、css 表为什么以原类名为键）
- 包内 `registry.json`：唯一权威清单，条目的 `dependencies` / `npmDependencies` /
  `rawStyles` / `tier` 都以它为准
- 源码仓另有 `docs/wiki/`：新手教程、token 纪律与升级、依赖分层，附自包含文档站
  `index.html`（浏览器直接打开，跑的是真组件）
