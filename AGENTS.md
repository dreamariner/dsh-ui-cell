# dsh-ui-cell — DSH 插件专用的复制式 UI 组件源

> 名字即论点（cell = 细胞）：**复制即独立**。组件复制进插件后源码归插件所有，
> 自带遗传物质（token 纪律、前缀命名空间、行为）离体存活，本仓与宿主升级互不影响。
> 模型照 shadcn（registry + copy CLI + 源码归插件），组件源用 DSH 官方 primitives，
> 第三方 DSH 插件**复制即用**，不依赖任何官方 client 包。

> 生态划分：与 neil-ji/dsh-ui-kit（运行时组件库，npm `dsh-ui-kit`）无关；
> 与 seed-forge/dsh-plugin-ui-components（插件外壳与契约层）层级互补。
> 本仓曾用名 dsh-ui-kit，2026-11-06 因与上述运行时库同名而改（docs/issues/003）。

## 项目定位

DSH 官方插件开发规范（`packages/preset/agent-preset/skills/cordis-plugin-development/references/practices.md`）明文禁止第三方插件 load 官方 Harness Client 包（含 `@deepseek-ai/dsh-client-ui-primitives`），并给出 sanctioned 的替代路径：**把 primitive 的 markup、CSS、行为复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这正是 shadcn 的核心模型（组件源码归你所有、复制而非依赖、token 化样式）。本仓把这套模型落到 DSH 上：

| shadcn | dsh-ui-cell |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-cell add` |
| Radix UI 行为库 | **DSH 官方 ui-primitives 源码**（宿主亲生的行为与 token） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token（宿主换肤自动跟随） |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

**不引入 Tailwind、不引入 Radix**：第三方插件的 client 构建没有 CSS 管线（DSH 官方 client 预设的 lightningcss 通道对外插件不可用），Tailwind 的 preflight 还会泄漏到宿主页面。组件层直接用官方源码，无需重造。

## 红线（破坏即返工）

1. **样式只引用 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-elevation-*` / `--dsw-focus-ring-*`**：禁 `--dsw-static-*`（调色板原子色，官方换肤会重映射）、禁 `--dsw-specific-*`（场景级）、禁字面颜色（hex / rgb / 具名色）。官方规范原话是 alias 层是唯一稳定语义面。

   ⚠ **「类别对」不等于「token 对」**：token 名拼错、或官方在某版本删了它，CSS 规范是**整条声明被静默丢弃**（var() 解析失败），样式不生效且**无任何报错**。故除了类别护栏，还有一条**存在性校验**：`tokens/official-tokens.json`（pinned 快照，官方 ui-theme 的 token 定义）里必须能查到每个 `var(--x)`。清单外的 token 只有两类合法例外：宿主上下文变量（`--dsh-frame-*`，宿主 AppFrame 注入）与组件自有变量（`--dsh-segment-*`，组件自己 inline 设置）。DSH 升级时跑 `pnpm vendor` 重生成清单（范式同 `dreamariner/dsh-typert-protocol` 的 `vendor`/`vendor:check` 两段式）。
2. **类名一律带插件前缀 + 组件名段，且跨组件唯一**：复制进插件后必须重命名，否则与插件自身样式撞车。且最终类名必须**跨组件唯一**：消费端把全部组件样式拼进**同一个 `<style>`**，官方 CSS Modules 的 per-file 哈希隔离在这里不存在，只加插件前缀不够（input 与 select 都有 `.wrap`、button 与 input 都有 `.icon`，2026-11-05 复审实证二者互覆，按钮 icon 被染成 input 的 tertiary 色）。`dsh-ui-cell add` 负责这件事：与组件同名的根类免组件段（`.button` → `duc-button`），其余加组件名段（input 的 `.wrap` → `duc-input-wrap`）；`@keyframes` 名是文档级命名空间，同规则改名且定义与引用同步。不要手抄组件绕过。
3. **行为保真清单**（官方点名要保的用户依赖行为，不得简化）：
   - Modal：焦点陷阱（Tab 环绕）、Escape 关闭、关闭后焦点归还触发控件、`data-modal-autofocus` 初始焦点
   - SegmentedControl：WAI-ARIA tabs 键盘走查（Arrow/Home/End 环绕、跳过 disabled）、roving tabindex、选中后焦点跟随
   - Modal 层级栈：`useModalLayer` 的 WeakMap 栈（嵌套时只有最上层拥有 Escape）
4. **不改 DSH 内核**：组件源来自 checkout 只读复制，不改上游任何文件。
5. **基线锚**：`registry.json` 的 `dshVersion` / `dshCommit` 是组件来源的真相源（人工维护，升级时更新）。`tokens/official-tokens.json` 的同名字段由 `pnpm vendor` 从 checkout 自动派生（根 package.json 的 version + HEAD commit），**不手改**（旧实现把锚写成手写字面量，升级重跑后清单谎报来源且 --check 照样过，复审已修）。DSH 升级时按各条目的 `upstream` 字段逐组件重 diff，不是整包覆盖。**重 diff 用 `pnpm upstream:diff`**（`scripts/diff-upstream.mjs`：默认逐条比对全部有上游出处的条目；`--base <commit>` 按上游变更集驱动；`--only a,b` 限定条目）。两个锚**必须一致**（护栏查）：token 快照到 rc.5 而 registry 还停 rc.1 的错位，此前没有任何护栏会报（issue 030 补了这条）。   **锚点是总结论，不是过程动作**：只在全部条目对齐之后改一次；中途改锚点，注册表就开始对尚未跟上的件说谎。**版本注记与源文件内容要一起改**：`upstream` 字段写了 rc.5，源文件的头注记与内容也要到 rc.5（rc.5 升级留了 8 个文件的欠账，issue 030 补了「注记版本 = 文件头版本」护栏）。**升级流程见 `docs/wiki/05-DSH升级SOP.md`**（八步流程 + 十个教训 + 常见上游变化对照）。 **偏离登记制**：本仓与上游的**有意偏离**逐条登记在 `docs/upstream-deviations.json`（每条带理由），`pnpm upstream:check` 断言「实际偏离集合 == 登记集合」——多一条少一条都红。偏离不是永久豁免：上游改了对应文件，登记就会失配，逼你重新审视一遍。 **CI**（`.github/workflows/ci.yml`，2026-11-19 起，issue 032）三个 job：护栏测试、构建与发布面清单、上游保真核对（克隆公开上游的基线 tag → token 清单逐字节一致 + 逐件保真 + 文档站新鲜度）。
6. **间距与动效走规范面**（2026-11-18 起，issue 012）：本仓**自有件**（`upstream` 为空）的间距只许 `var(--dsh-space-*)`（刻度定义在 `src/foundation.css`），动效只许官方三档 duration token（`--ds-transition-duration{,-fast,-slow}`）与官方 easing（`--ds-ease-in-out`），不写 px 字面量与字面时长曲线；带动画的组件必须有 `prefers-reduced-motion` 降级。控件的字不许跟随宿主字号（不写 `font: inherit`），渲染原生 `<select>` 的组件要 `appearance: none` 收掉浏览器自绘箭头、改挂 DSH chevron（issue 014）。官方保真复制件**保真不改**，走例外表（本仓已登记的偏离写在各条目 `upstream` 字段）。组合值（缩进、让位这类由图标尺寸推导的值）登记例外并写明构成。细则见 `docs/wiki/04-间距与动效规范.md`。
7. **公开面不写本机与个人私有信息**（2026-11-18 起，issue 013）：本仓是公开仓，文档站会发到 GitHub Pages、npm 包会发到 registry。示例里写本机绝对路径（`/Users/<名>/` 之类）等于把使用者用户名与目录结构贴到公开面上；个人私有项目与人格相关名字同理，一律用通用表述（「姊妹插件仓」「内部插件仓」）。护栏扫活面（含生成物 `docs/wiki/index.html`）：改了源文件没重建站点，护栏会红。
8. **拖拽类组件跟手且能收尾**（2026-11-18 起，issue 016）：拖拽条有宽度，百分比要按「条中心对准光标」反解（分子减半个条宽、分母用容器宽）；给百分比的那一栏**不能吃 `flex-grow`**（grow 会让百分比失真，状态 45% 渲染成 72.5%，越拖越偏）；松手必须三路收尾 —— 指针捕获 + `pointerup` / `pointercancel` / 窗口 `blur`，漏掉「在窗口外松手」这一路，之后每次移动鼠标都会继续改布局（极易误触）。细则见 `skills/dsh-ui-cell/references/interaction.md`。
9. **圆角按体量选档**（2026-11-19 起，issue 019）：本仓自有件用 `--dsw-radius-*` 家族，档位口径 —— `md`（12px）给控件与内容块、`lg`（16px）给卡片与浮层、`panel`（28px）**只给浮到内容之上的面板**（Modal / Sheet）。内容容器误用 panel 档会显突兀（28px 在 320px 宽卡片上占掉九分之一）。浮层面板要改档时给组件加 `radius` 属性，按侧边只圆「靠内容侧」两角，贴边侧保持直角（issue 026）。
10. **小控件边框用 ≥1px、悬停不盖选中**（2026-11-19 起，issue 022 / 024）：`0.5px` 边框的水平段会被设备像素对齐整段吞掉（竖边正常、横边消失，滚动一下又「好了」），小而高对比的控件一律 ≥1px，`0.5px` 只留给大面积面板的横边；悬停规则必须显式 `:not([data-selected])`，否则点完选中、鼠标没移开的那一瞬是「白字压浅底」的脏中间态（用户读作闪一下）。

## 目录结构

```
dsh-ui-cell/
├── AGENTS.md            # 本文件
├── package.json         # @dreamariner/dsh-ui-cell（bin: dsh-ui-cell）
├── registry.json        # 组件清单（名字、状态、文件、dependencies 依赖闭包、上游出处、DSH 基线）
├── src/                 # 权威组件源码（tsx + css，类名为上游原名）
│   ├── foundation.css                             # 基础层：间距刻度 --dsh-space-*（role=base，add 每次带上且排注入第一位）
│   ├── button.tsx/.css、input、tag、segmented-control、modal、risk-confirmation
│   ├── select.tsx/.css、textarea.tsx/.css        # 本仓自有（官方无对应原子）
│   ├── markdown-*.ts(x)、read-block、web-block、quote-preview、detail-document、
│   │   code-block、code-highlighting、ansi.ts、diff.ts   # 内容块层（content 档，带 npm 重依赖）
│   ├── icons.tsx                                 # 官方 icons/ 的子集（5 个）
│   ├── use-modal-layer.ts、focus.ts、keyboard-composition.ts   # Modal 行为依赖
│   └── index.ts                                  # 本仓 barrel（消费端不用它）
├── docs/wiki/             # 组件 Wiki（新手教程 + token 纪律 + 依赖分层 + 间距与动效规范 + 自包含文档站 index.html；docs:build 重建）
├── tokens/official-tokens.json  # 官方 token 清单（pinned 快照，护栏据此做存在性校验；锚由 vendor 派生）
├── scripts/vendor-tokens.mjs    # 从 DSH checkout 同步 token 清单（升级期；vendor / vendor:check）
├── scripts/import-markdown-family.mjs  # markdown 家族的机械搬运脚本（升级期；语义裁剪仍需手工）
├── scripts/build-docs.mjs       # 文档站重建（docs:build；token 从 checkout 拼装）
├── scripts/lib/paths.mjs        # DSH_CHECKOUT 解析（显式指定，无默认推导）
├── cli/add.ts           # add 实现（复制 + 前缀化[组件名段] + keyframes 改名 + CSS→TS 转换 + 依赖闭包解析 + 依赖分层交接[tier/npmDependencies/rawStyles 原样注入]）
├── cli/index.ts         # CLI 入口
├── skills/dsh-ui-cell/SKILL.md  # Agent 接入手册（随 npm 包分发；消费端拷进插件 .agents/skills/）
│   ├── references/spacing-motion.md  # 写自有组件时的间距与动效规则（Agent 视角）
│   └── references/interaction.md     # 写拖拽类组件的规则（跟手算式、百分比对齐、松手收尾）
└── tests/               # 自守护栏：registry.spec.ts（一致性 + token 纪律/存在性 + 命名空间唯一性 + 依赖闭包 + 分层交接 + 间距动效规范）+ markdown.spec.tsx（渲染回归）
```

## 用法

```bash
# 把组件复制进插件（源码进插件自己的仓，提交后即与本仓解耦）
npx dsh-ui-cell add button input tag --to path/to/plugin --prefix duc-

# 参数
#   --to <pluginDir>   目标插件目录（其下自动建 src/client/ui/）
#   --prefix <pfx>     类名前缀，默认 duc-
#   --force            覆盖已存在文件（默认跳过，避免盖掉插件的本地改动）
#
# 组件依赖自动解析闭包：add risk-confirmation 会同时复制 button / modal / icon。
```

复制后插件侧要做的两件事：

1. 组件文件进 `src/client/ui/`，`import { Button } from '../ui/button.tsx'`
2. 样式注入：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` **按依赖序**拼进插件已有的 `<style>` 注入器（被复用者先注入，add 的 note 给出本次闭包的顺序）。类名共存于同一个 `<style>`，同特异性规则按注入顺序后者胜：复用别件样式的组件（segmented-tabs 复用 pill 等）必须排在被复用件之后，排反了会被底件外观覆盖（2026-11-10 实证）

⚠ **基础层 `foundation-css.ts` 必须排在注入顺序第一位**：它是间距刻度（`--dsh-space-*`），
组件样式里的 `var(--dsh-space-*)` 靠它解析。漏注入 = 那条声明被静默丢弃 = 间距全没、零报错
（add 每次都会带上它并排在最前，别把它从聚合模块里删掉）。

`css` 表以**原类名为键、最终类名为值**（`'primary': 'duc-button-primary'`；与组件同名的根类免组件段，`'button': 'duc-button'`），所以官方组件里 `css[variant]` 这类动态索引访问不用改写也能正确工作。值带组件名段的原因见红线 2。

## 组件清单

**97 个条目全部 ready**（权威清单与依赖闭包见 `registry.json`，每条带 upstream 出处或 本仓自有标注）：

| 来源 | 数量 | 内容 |
|---|---|---|
| 官方保真复制 | 37 | 官方除品牌件的全部原子（含 icon 集 15 个，inline path 不依赖宿主 sprite）+ markdown 家族 5（markdown-text / read-block / web-block / quote-preview / detail-document，裁剪版见 issue 005）+ code-block + code-highlighting（契约对齐的 本仓自写内核） |
| 官方内容块 | 6 | json-tree / json-block / search-block（零依赖）+ code-toolbar / diff-block / terminal-block（issue 005 起带真实依赖 diff / anser / shiki） |
| 本仓自有 | 42 | shadcn base 功能对齐（card/alert/accordion/popover/combobox/command/table/data-table/sheet/calendar/slider/sidebar+sidebar-nav/…），样式全 DSH token、行为手写 |
| 共享行为模块 | 11 | modal-layer / focus / keyboard-composition / pointer-grace / anchored-position / dismiss-on-outside-pointer / clipboard / clipboard-copy / overlay-top-margin / head-tail-cap / use-prefers-reduced-motion |
| 基础层 | 1 | foundation：间距刻度 `--dsh-space-*`（`role=base`，add 每次带上并排在注入顺序第一位） |

**未收录（issue 005 留档）**：官方品牌件（BrandWordmark / FishLogo / SiteGlyph / artwork / 专用 Icon）。

**依赖分层（issue 005 起）**：条目分两档 —— `atom`（默认，零重依赖，只用 react + clsx）与 `content`（带 npm 重依赖：markdown 家族 / diff / anser / shiki）。markdown 家族已于 issue 005 落地（裁流式臂 / DraggableImage / 官方 LinkIcon）。

## 维护

- **加组件**：从 DSH checkout 复制对应 `.tsx` + `.module.css` 到 `src/`（保留上游类名原样，便于日后 diff），在 `registry.json` 登记（含 `upstream` 出处），并把对其他组件的相对导入如实填进条目的 `dependencies`（add 靠它解析闭包；护栏会校验声明与实际导入一致，Modal 的 `use-modal-layer` / `focus` / `keyboard-composition` 是同条目内文件，不需要进 dependencies；反过来，已是独立条目的共享件不要再列进条目 files，护栏「文件归属唯一」会拦）。
- **加图标**：从官方 `icons/index.tsx` 复制对应 `Icon*Artwork` 函数体 + Regular 导出，保持 `Icon{Name}OutlineRegular` 命名与 currentColor 契约。
- **DSH 升级**：更新 `registry.json` 的 `dshVersion` / `dshCommit`，逐组件按 `upstream` 重 diff，把改动同步到 `src/`（**改的是 `src/`，不是消费者**——消费者已经复制走，不会被上游变更影响）。

## 验证

```bash
pnpm test        # registry 护栏（一致性 + token 纪律/存在性 + 命名空间唯一性 + 依赖闭包 + 分层交接 + 间距动效规范）+ markdown 渲染回归（41 条，其中 1 条需 DSH_CHECKOUT 在场才跑）
pnpm typecheck   # 组件源码类型检查
```

## 与上游同步（升级期动作）

```bash
DSH_CHECKOUT=<与 dshVersion 同版的 checkout> pnpm vendor          # 同步清单
DSH_CHECKOUT=<...> pnpm vendor:check                               # 只校验
```

范式照 `dreamariner/dsh-typert-protocol` 的 `vendor-protocol.mjs`：同一套「同步 + 校验」
两段式、checkout 显式指定零默认推导、`--check` 逐字节比对。差别是 protocol 同步**源码**
（生成器要读声明面），本仓同步**token 名清单**（只需名字与分类）——故不拷文件、不改
version、不动 LICENSE，出处记在清单的 `source` 字段与组件源码头注释。

自守护栏里有一条「清单与上游逐字节一致」的检查：**checkout 在场时跑、不在场则跳过**
（pinned 快照本就是为了「没有 checkout 也能工作」）。

## token 正确性的两道防线

| 防线 | 抓什么 | 怎么抓 |
|---|---|---|
| **类别护栏** | 引用了不该引用的 token 层（static / specific）、字面颜色 | 正则扫 CSS（`tests/registry.spec.ts`） |
| **存在性护栏** | token 名拼错、官方已删除、官方改名 | 对 `tokens/official-tokens.json`（pinned 快照）逐个查 |

两者都不可省：类别对但名字错的情况（如 `--dsw-alias-label-prIMARY`）只会让**该条声明被
静默丢弃**，界面少一个样式但没有任何报错——这是最隐蔽的一类失败。

例外白名单（不在官方清单里但合法）：宿主上下文变量 `--dsh-frame-chrome-top` /
`--dsh-frame-overlay-top`（宿主 AppFrame 注入，带 fallback）、组件自有变量
`--dsh-segment-count` / `--dsh-segment-index`（SegmentedControl 在 inline style 里设置）。
