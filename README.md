# dsh-ui-cell

**DSH 插件专用的复制式 UI 组件源（shadcn 式 registry）**。

名字里的 cell 是认真的：**复制即独立**。组件被复制进插件后源码归插件所有，像细胞一样自带全部遗传物质（源码、token 纪律、前缀命名空间、行为）离体存活，本仓与宿主各自升级互不影响。

```
npm i -D @dreamariner/dsh-ui-cell
npx dsh-ui-cell add button input tag --to path/to/plugin
```

## 为什么

DSH 官方插件开发规范明文禁止第三方插件 load 官方 Harness Client 包（含 `@deepseek-ai/dsh-client-ui-primitives`），并给出 sanctioned 的替代路径：**把 primitive 的 markup、CSS、行为复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这正是 shadcn 的核心模型（组件源码归你所有、复制而非依赖、token 化样式）。本仓把这套模型落到 DSH 上：

| shadcn | dsh-ui-cell |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-cell add` |
| Radix UI 行为库 | **DSH 官方 ui-primitives 源码**（宿主亲生的行为与 token） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token（宿主换肤自动跟随） |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

**不引入 Tailwind、不引入 Radix**：第三方插件的 client 构建没有 CSS 管线（DSH 官方 client 预设的 lightningcss 通道对外插件不可用），Tailwind 的 preflight 还会泄漏到宿主页面。组件层直接用官方源码，无需重造。

## 细胞的三条生存机制

1. **遗传物质自足**：复制走的不只是 markup，还有行为（Modal 焦点陷阱/层级栈、SegmentedControl 键盘走查）、样式（转成 TS 字符串运行时注入）与命名空间（`duc-` 前缀 + 组件名段）
2. **独立代谢**：源码归插件，官方与本仓各自升级都影响不到已复制的组件；想吃到新版本时主动重新 `add --force`
3. **分裂不排异**：add 时刻的转换器保证类名与 keyframes 跨组件、跨插件不撞车，token 只引用 alias 稳定面且逐一过存在性校验

## 用法

```bash
dsh-ui-cell add <component...> --to <pluginDir> [--prefix duc-] [--force]
```

组件依赖自动解析闭包：`add risk-confirmation` 会同时复制 `button` / `modal` / `icon`（deps 先于本体），产物无悬空导入。

复制后插件侧做两件事：

1. 组件文件进 `src/client/ui/`，`import { Button } from '../ui/button.tsx'`
2. 样式注入：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器

`css` 表以**原类名为键、最终类名为值**（`'primary': 'duc-button-primary'`；与组件同名的根类免组件段，`'button': 'duc-button'`），所以官方组件里 `css[variant]` 这类动态索引访问不用改写也能正确工作。值里带组件名段的原因：消费端把全部组件样式拼进**同一个 `<style>`**，官方 CSS Modules 的 per-file 哈希隔离在这里不存在，只加插件前缀时 input 与 select 的 `.wrap` 会互覆（复审实证过）。`@keyframes` 名是文档级命名空间，同规则改名。

## 组件

**94 个条目全部 ready**（权威清单与依赖闭包见 `registry.json`；每条带 `upstream` 出处或 `本仓自有` 标注）：

| 来源 | 数量 | 内容 |
|---|---|---|
| 官方保真复制 | 37 | 官方除品牌件的全部原子：button / input / tag / segmented-control / modal / risk-confirmation / tooltip / menu / switch / pill / state-dot / checkbox / disclosure-row / toast / hover-card / image-lightbox / zoom-controls / …（icon 集 15 个，inline path，不依赖宿主 sprite）+ markdown 家族 5（markdown-text / read-block / web-block / quote-preview / detail-document，裁剪版见 issue 005）+ code-block + code-highlighting（契约对齐的 本仓自写内核） |
| 官方内容块 | 6 | json-tree / json-block / search-block（零依赖）+ code-toolbar / diff-block / terminal-block（issue 005 起带真实依赖 diff / anser / shiki） |
| 本仓自有 | 41 | shadcn base 功能对齐、样式全部 DSH token、行为手写：card / alert / accordion / popover / combobox / command / table / data-table / sheet（含 drawer 形态）/ calendar / date-picker / slider / radio-group / carousel / sidebar / chart（极简柱线图）/ form / … |
| 共享行为模块 | 10 | 官方行为件独立成条目供多组件共享：modal-layer / focus / keyboard-composition / pointer-grace / anchored-position / dismiss-on-outside-pointer / clipboard / clipboard-copy / overlay-top-margin / head-tail-cap |

**未收录（issue 005 留档）**：官方品牌件（BrandWordmark / FishLogo / SiteGlyph / artwork / 专用 Icon）。

**依赖分层（issue 005 起）**：条目分两档 —— `atom`（默认，零重依赖）与 `content`（带 npm 重依赖）。markdown 家族 / ReadBlock / WebBlock / QuotePreview / DetailDocument 已落地（见 issue 005）；内容块层的重依赖由消费端自己装（add 时会报出缺哪些包，或用 `--with-deps` 直接写进 package.json）。

## 纪律

- **样式只引用 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-elevation-*` / `--dsw-focus-ring-*`**：禁 `--dsw-static-*`（调色板原子色，官方换肤会重映射）、禁 `--dsw-specific-*`、禁字面颜色。官方规范说 alias 层是唯一稳定语义面。
- **token 名必须真实存在**：拼错或官方已删除的 token 会让**整条声明被静默丢弃**（var() 解析失败）——界面少样式但零报错。本仓 有 pinned 的官方 token 清单（`tokens/official-tokens.json`）+ 存在性护栏逐个校验，DSH 升级时用 `DSH_CHECKOUT=<path> pnpm vendor` 重生成（范式同 protocol 仓的 `vendor`/`vendor:check`）。
- **类名一律带插件前缀 + 组件名段**：复制进插件后必须重命名，且最终类名必须**跨组件唯一**（同一 `<style>` 命名空间）。`add` 负责这件事（`.button` → `duc-button`，input 的 `.wrap` → `duc-input-wrap`，keyframes 同规则），不要手抄组件绕过。
- **行为保真清单**：Modal 的焦点陷阱/Escape/焦点归还、SegmentedControl 的键盘走查与 roving tabindex、Modal 的层级栈——官方点名要保的用户依赖行为，不得简化。
- **不改 DSH 内核**：组件源从 checkout 只读复制。
- **基线锚**：`registry.json` 的 `dshVersion` / `dshCommit` 标注组件源基线（人工维护，DSH 升级时更新并按各条目 `upstream` 逐组件重 diff，改的是本仓 `src/`，消费者已复制走不受影响）；`tokens/official-tokens.json` 的同名字段由 `pnpm vendor` 从 checkout 自动派生（根 package.json 的 version + HEAD commit），不手改。

## 生态划分（同名与近邻声明）

- 与 **neil-ji/dsh-ui-kit**（npm `dsh-ui-kit`，运行时组件库）**无关**：那边是 `import` 使用的运行时依赖，这边是复制式源码分发，模型不同、代码无关。
- 与 **seed-forge/dsh-plugin-ui-components**（插件外壳与交互契约层）**层级互补**：那边做 `PluginSurface` / `ApprovalGate` / `TabRegistry` 等插件骨架，这边做设计系统原子。

## 仓库

- `registry.json` — 组件清单（名字、状态、文件、dependencies 依赖闭包、上游出处、DSH 基线）
- `src/` — 权威组件源码（tsx + css，类名保留上游原名便于 diff）
- `cli/` — `add` 实现（复制 + 前缀化[组件名段] + keyframes 改名 + CSS→TS 转换 + 依赖闭包解析 + 依赖分层交接[tier/npmDependencies/rawStyles 原样注入]）
- `docs/wiki/` — 组件 Wiki（新手教程 + 可视文档站 index.html，组件用法与实时效果）
- `tests/` — 自守护栏：`registry.spec.ts`（registry 一致性 + token 纪律 + 存在性 + 命名空间唯一性 + 依赖闭包 + 分层交接）与 `markdown.spec.tsx`（内容块渲染回归）
- `AGENTS.md` — 定位与红线（改本仓前先读）
- `skills/dsh-ui-cell/SKILL.md` — Agent 接入手册（随 npm 包分发；消费端拷进插件的 `.agents/skills/`）

## 许可

Apache-2.0。组件源码源自 DSH 官方 ui-primitives（Apache-2.0），按官方插件开发规范
（practices.md 的 sanctioned 复制路径）保真复制并加了插件前缀；逐文件出处见
`registry.json` 的 `upstream` 字段与各源码头注，相对上游的改动（导入路径、类名机制、
裁剪边界）已在头注显著标注。

与 shadcn/ui 的关系：仅借鉴其「registry + CLI + 复制分发」的模型与组件 API 形状，
未复制其任何代码（shadcn/ui 为 MIT；本仓组件的样式与行为均为原创实现，走 DSH
token 体系而非 Tailwind / Radix）。

## 致谢

- [shadcn/ui](https://github.com/shadcn-ui/ui)：复制式分发的模型来源，本仓的
  registry + add 交付形态与「源码归插件所有」的理念由此而来
- DSH 官方 ui-primitives（Apache-2.0）：全部官方保真件的组件源，宿主亲生的行为与
  token 纪律的锚点
- 内容块层的开源基础：[shiki](https://github.com/shikijs/shiki)（语法高亮）、
  [KaTeX](https://github.com/KaTeX/KaTeX)（数学排版）、
  [micromark / mdast 家族](https://github.com/micromark/micromark)（markdown 解析）、
  [diff](https://github.com/jsdiff/jsdiff)（差异计算）、
  [anser](https://github.com/IonicaBizau/anser)（ANSI 解析）
