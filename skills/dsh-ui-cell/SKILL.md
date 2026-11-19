---
name: dsh-ui-cell
description: DSH 插件接入 dsh-ui-cell 组件的操作手册（shadcn 式复制分发：add 复制源码进插件、类名 duc- 前缀、样式转 TS 运行时注入、npm 依赖交接）。触发场景：给 DSH 插件新增或修改 client 面板、控件、内容块；被要求使用 dsh-ui-cell 组件；执行 add 后做接线（样式注入、依赖安装、raw 样式拼接、foundation 基础层必须第一个注入）；add 产物编译报错的排查；组件升级后重新复制；原子件（atom）与内容块（content）的选型；写组件样式时的间距、圆角与动效取值；核对宿主 DSH 版本是否满足本包基线。当任务提到 DSH 插件 UI、panel-css、duc- 类名或前缀冲突、间距、圆角、动效、--dsh-space-*、宿主 DSH 版本、组件升级时也应触发。
version: 1.6.1
author: Jianan
---

# dsh-ui-cell 接入手册（Agent 视角）

dsh-ui-cell 是 DSH 插件专用的 shadcn 式组件源：`add` 把组件**源码**复制进插件
（复制即独立，源码归插件所有），类名加 `duc-` 前缀与组件名段，CSS 转成 TS 字符串
运行时注入。官方 primitives 保真件 + shadcn 对齐件 + 内容块共 97 个条目，权威清单
在包内 `registry.json`（名字、状态、文件、依赖闭包、npm 依赖、上游出处）。

> **宿主要求**：两个版本，各管一件事 ——
> **宿主下限 DSH ≥ 0.2.2-rc.2**（`registry.json` 的 `minHostDsh`）：本包组件引用了
> hovercard / json-tree / toast / tooltip / shadow-lv2-3 / specific-* 这批 rc.2 才有的
> token，宿主低于 rc.2 时这些件的配色会**静默失效**（var() 解析失败 → 整条声明被丢弃 →
> 零报错）。**组件源基线 DSH 0.2.2-rc.5**（`registry.json` 的 `dshVersion`）：组件源码
> 抄自哪个上游版本 —— 它比宿主下限新，不必与宿主对齐。

本 skill 管「在插件里把它用对」；仓库纪律（token 红线、行为保真、基线锚）见包内
`AGENTS.md`。两份都随 npm 包分发（`@dreamariner/dsh-ui-cell`），node_modules 里就有。

## ① 选型：原子件还是内容块

| 档位 | 条目 | 新增 npm 依赖 | 何时用 |
|---|---|---|---|
| atom（默认） | 88 个：button / input / modal / tooltip / menu / table / calendar / … | 无（baseline 三件套之外） | 常规控件，任何插件随便用 |
| content | 9 个：markdown 家族 4（markdown-text / read-block / web-block / detail-document）+ 代码与终端 5（code-toolbar / code-block / code-highlighting / diff-block / terminal-block） | shiki（精确锁 4.4.3）/ katex / diff / anser / micromark 家族，约 19 包 | 面板确实要渲染 markdown / 代码高亮 / diff / 终端输出才引入（bundle 数百 KB ~ 1MB 级，见源码仓 wiki 03） |

未收录：官方品牌件（BrandWordmark / FishLogo / SiteGlyph / 专用 Icon）。纯静态一次性
页面不必引入本工具，手写更省。想用的组件先查 `registry.json` 确认存在且 status=ready。

## ② 标准接入（六步）

```bash
# 0. 先确认宿主 DSH 版本 ≥ 宿主下限（registry.json 的 minHostDsh，当前 0.2.2-rc.2）
#    低于下限：引用了 rc.2 才有的 token 的件（json-tree / hover-card / toast / tooltip…）会静默失效
# 1. 复制（组件依赖自动解析闭包，deps 先于本体；产物无悬空导入）
npx dsh-ui-cell add button input --to <插件根目录>
#    常用参数：--prefix <pfx>（默认 duc-）  --force（覆盖已存在文件）  --with-deps（缺失 npm 依赖直接写进消费端 package.json，默认只提示）
```

2. **读完 add 输出的每一条 note**，四类各有一件事要做：
   - 「消费端缺这些 npm 依赖」：按 note 里拼好的 `pnpm add …` 照抄安装（scoped 包是完整的，直接可用）；或下次 add 加 `--with-deps` 让 CLI 代写
   - 「原样注入的样式模块」：`shiki-css.ts` / `katex-css.ts` 这类**没有任何组件引用**的孤儿模块，必须手动 `import { styles }` 拼进注入器，漏了就是静默失败（公式不排版、高亮没颜色，零报错）
   - 「基础层自动带上：foundation」：`foundation-css.ts` 是间距刻度（`--dsh-space-*`），
     组件样式靠它解析，**样式注入时必须拼在最前**，漏了就是静默失败（间距全没，零报错）
   - 「已存在未覆盖」：目标文件已存在且未加 `--force`；先确认它是不是插件的本地改动，再决定覆盖与否
3. 组件 import：`import { Button } from '<插件根>/src/client/ui/button.tsx'`
   （**先查用法**：本包 `references/components.md` 是逐组件的用法速查 —— 一句话说明 +
   最小可用片段 + 可接的 props 字段名 + 依赖；完整 API 与行为保真看复制进插件的源码头部注释）
4. 样式注入（panel-css 模式）：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器，**`foundation-css.ts` 排第一**
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
- **注入顺序按依赖序（被复用者先注入）**：复制件的类名共存于同一个 `<style>`，
  同特异性规则按注入顺序后者胜。复用别件样式的组件（segmented-tabs 复用 pill、
  terminal-block 复用 pill / state-dot / command-text）必须排在被复用件之后，
  排反了会被底件外观整个盖掉（实证：某消费插件筛选行药丸化，2026-11-10）。
  add 的 note 给出本次闭包的顺序，照抄即可；多次 add 按同规则插进已有聚合模块
- **Sidebar 的收起态经 Context 下发**：`Sidebar` 自动下发收起态，`SidebarNav`
  自动读取（**不要把 `collapsed` 传两遍**：壳一次、nav 一次）；header / footer 这类
  槽内容用导出的 `useSidebarCollapsed()` 感知（不在 `Sidebar` 内时返回 `undefined`，
  自己定缺省值）；显式传 `collapsed` 仍可覆盖 Context（`SidebarNav` 独立于壳使用）

## ④ 高频坑（每条都有实证）

| 症状 | 原因 | 处置 |
|---|---|---|
| tsc 报 Cannot find module 'clsx' | baseline 三件套没装 | 安装 react / react-dom / clsx |
| 公式塌成一坨 / 代码高亮没颜色，且零报错 | raw 样式（katex-css / shiki-css）没拼进注入器 | 按 note 点名补 import 与拼接 |
| 复制后组件没样式 | styles 没拼进 `<style>`，或 tsx 里手写了最终类名绕过表 | 全部走 `css.xxx` 取类名 + styles 注入 |
| 控件挤成一团、间距全没，但零报错 | 基础层 `foundation-css.ts` 没拼进注入器（或没排第一），组件里的 `var(--dsh-space-*)` 解析失败，那条声明被静默丢弃 | 把 foundation 的 styles 拼在注入器第一段 |
| 控件外观互相覆盖（如 segmented-tabs 的 tab 变成药丸按钮、指示器四角外露） | styles 拼接顺序违反依赖序：被复用件排在了复用件之后，复用件的覆盖规则全部失效 | 按依赖序重排聚合模块（被复用者先注入）；add 的 note 有本次闭包的顺序 |
| 重新 add 后新旧类名对不上 | 上次用旧默认 `duk-`，本次默认 `duc-` | add 加 `--prefix duk-` 保持同一命名空间，或择机整体迁移 |
| --force 之后本地改动消失 | 覆盖是设计行为 | add 前先 diff / 备份本地修改 |
| TextShimmer 明明在动，文字上却看不到那道扫光 | `--dsw-alias-label-shimmer` 是**绝对值**（亮色 30% 黑 / 暗色 45% 白），不随被作用的文字走；压在正文色上等于同色叠加 | 给它一个跟底色有对比的值：`style={{ '--dsw-alias-label-shimmer': 'var(--dsw-alias-label-secondary)' }}`（DSH 应用的跑动状态就是改这个 token 的，见组件头注） |
| 面板 / 抽屉关掉后赖着不走（几百毫秒才消失），无报错 | 消费端自己关了动画（`* { animation: none }` 或动画样式没注入）：`animationend` 永不触发，组件只能等兜底定时器（disclosure-row 400ms / sheet 800ms）。注意 `usePrefersReducedMotion()` 只看**系统**开关，读不到「样式被关了」 | 别全局关动画；交给系统的 `prefers-reduced-motion` 降级（那条路径组件认）。真要关就一并写 `@media (prefers-reduced-motion: reduce)` 块 |
| 小控件的边框看着没闭合（竖边在、横边断） | `0.5px` 边框的**水平段被设备像素对齐整段吞掉**（布局 Y 落在分数像素上时），滚动一下又「好了」= 抽签 | 小而高对比的控件（OTP 格子这类）边框用 ≥1px；`0.5px` 只留给大面积面板的横边 |
| JSON 树 / 某个件**没有配色**，但零报错 | 宿主 DSH 低于宿主下限（当前 rc.2）：引用了 rc.2 才有的 token（json-tree 的 `--dsw-alias-json-tree-*` 族、hovercard / toast / tooltip / shadow-lv*）→ var() 解析失败 → 整条声明被静默丢弃 | 升宿主到 rc.2+；或查 `registry.json` 的 `minHostDsh` 与宿主实际版本 |

版本边界：shiki 精确锁 4.4.3（不要浮动它）；KaTeX 字体走 jsdelivr CDN，离线环境公式
结构可读但无字体；React 18 / 19 均可（唯一相对官方放宽的类型签名在
markdown-viewport-highlighting）。

## ⑤ 升级

- 消费端永远不追上游：想吃新版本才 `add --force` 重新复制；不吃的部分维持现状
- 官方 DSH 升级时的逐组件重 diff 是 dsh-ui-cell 仓的职责，消费端只面对 registry 的版本
- 重新 add 前先把插件里对复制件的本地修改整理成清单（或打 diff），覆盖后按清单重放
- **换新版本包前先看宿主要求**：`registry.json` 的 `minHostDsh` 是宿主下限，
  `dshVersion` 是组件源基线（后者比前者新是正常的）。宿主升不上去就别急着换
- **0.6.0（DSH rc.5 基线）相对 0.5.0 变了这些件**，要吃到得 `add --force` 重新复制：
  `menu`（含新拆出的 menu-row / submenu-panel / use-menu-submenu / menu-submenu-position）、
  `code-block`（新增 diff 围栏逐行渲染）、`icon`、`json-tree`（配色改用 alias token）、
  `modal`（新增 `tone="warning"`）、`checkbox`（新增 `modalAutofocus`）、
  `risk-confirmation`、`quote-preview`（新增 `summary` 形态）、
  `animated-rows`、`context-menu`、`anchored-position`、`tooltip`、`toast`、`button`。
  不换也不坏，只是吃不到新能力（旧件仍在插件里）。

## ⑥ 写自有组件时的间距与动效

改本仓自有件（`registry.json` 里 `upstream` 为空的那些）的样式时，护栏会查下面几条，
写之前先对齐（细则见本包 `references/spacing-motion.md`）：

- **间距只用 `var(--dsh-space-*)`**（刻度 1/2/4/6/8/12/16/20/24/32），
  不写 px 字面量；缩进、让位这类**由图标尺寸推导**的组合值可登记例外，但要写明构成
- **圆角按体量选档**：`--dsw-radius-md`（控件与内容块）/ `lg`（卡片与浮层）/
  `panel`（**只给浮到内容之上的面板**，如 Modal / Sheet）。内容容器用 panel 档会显突兀
  （28px 在 320px 宽的卡片上占掉九分之一）
- **过渡只许官方三档**：即时反馈 `--ds-transition-duration-fast`、
  状态切换 `--ds-transition-duration`、大面积位移 `--ds-transition-duration-slow`，
  缓动统一 `var(--ds-ease-in-out)`；不写字面时长与字面曲线
- **循环节律**（呼吸 / 旋转 / 闪烁）可写字面时长与 `linear` / `steps()`，但必须配降级
- **带动画的组件必须有 `prefers-reduced-motion` 降级块**；
  系统开关与「样式把动画关掉」是两回事，后者组件侧读不到，只能靠兜底定时器收尾
- **小控件的边框用 ≥1px**：`0.5px` 的水平段会被设备像素对齐整段吞掉（竖边正常、横边消失），
  `0.5px` 只留给大面积面板的横边
- **悬停样式不能盖住选中态**：写悬停规则时显式 `:not([data-selected])`，
  否则点完选中、鼠标没移开的那一瞬是「白字压浅底」的脏中间态（用户读作闪一下）
- **控件的字不许跟随宿主字号**（不写 `font: inherit`，钉在 `--dsw-font-*` 档位）；
  「标签 + 控件」成对出现时要同档（标签 13px、控件 14px）
- **原生 `<select>` 要收掉浏览器自绘箭头**（`appearance: none` + DSH chevron）：
  自绘箭头不随字号缩放、颜色纯黑，且实测 Chromium 不随 `padding-right` 移动，CSS 挪不动
- 官方保真复制件不受这组检查约束（保真优先，跟随上游；本仓已登记的偏离见各条目 `upstream` 字段）

## ⑥' 写拖拽类组件（Resizable 这类）

细则见本包 `references/interaction.md`，三条最容易犯且**都不报错**：

- **百分比按「拖拽条中心对准光标」反解**（分子减半个条宽，分母用容器宽）
- **百分比必须等于渲染出来的宽度**：给百分比的那一栏**不能吃 `flex-grow`**
  （grow 会把剩余空间按比例分给两栏，于是「状态 45%」渲染成 72.5%，越拖越偏）
- **松手必须收尾**：指针捕获 + `pointerup` / `pointercancel` / 窗口 `blur` 三路兜底；
  漏掉「在窗口外松手」这一路，之后每次移动鼠标都会继续改布局（极易误触）

## ⑦ 深读（按需展开）

- 本包 `references/components.md`：**逐组件用法速查**（按分组：原子件 / 容器与布局 /
  浮层与反馈 / 输入进阶 / 内容块；每条一句话说明 + 最小可用片段 + props 字段名 + 依赖）。
  生成物，改 demo 后跑 `pnpm skill:usage` 重生成
- 本包 `references/spacing-motion.md`：**写自有组件时的间距与动效规则**（间距刻度、
  圆角档位、发丝线口径、官方动效三档映射、组合值例外、降级要求、进出场收尾），
  以及消费端 foundation 必须第一个注入
- 本包 `references/interaction.md`：**交互状态规则**（拖拽的跟手算式、百分比与渲染宽度对齐、
  松手三路收尾、命中区与可访问值；悬停与选中并存时的特异性打架；层级菜单的子菜单打开与收尾契约）
- 包内 `AGENTS.md`：token 纪律红线（只引 `--dsw-alias-*` 等稳定面）、行为保真清单
  （Modal 焦点陷阱 / 键盘走查不得简化）、基线锚
- 包内 `README.md`：机制总览（为什么复制式分发、css 表为什么以原类名为键）
- 包内 `registry.json`：唯一权威清单，条目的 `dependencies` / `npmDependencies` /
  `rawStyles` / `tier` 都以它为准
- 源码仓另有 `docs/wiki/`：新手教程、token 纪律与升级、依赖分层、间距与动效规范，
  附自包含文档站 `index.html`（浏览器直接打开，跑的是真组件）
