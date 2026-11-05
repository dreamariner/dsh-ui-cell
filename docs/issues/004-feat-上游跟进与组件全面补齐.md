---
id: 004
type: feat
title: 上游跟进 0.2.2-rc.1 + 官方组件补齐 + shadcn base 对齐 + 内容块落地
status: done
priority: P1
labels: [上游同步, 组件补齐, shadcn, 内容块]
created: 2026-11-06
updated: 2026-11-06
assignee: jianan
related: [001, 002, 003]
---

# 004 · 上游跟进 0.2.2-rc.1 + 官方组件补齐 + shadcn base 对齐 + 内容块落地

## 背景

林老师拍板三件事：① 上游跟进 0.2.2-rc.1；② 官方组件除品牌件与内容块外补齐；③ 按
shadcn base 逐个对比补缺失（功能相同、样式沿用 DSH 设计）；④ 内容块若 shadcn 有对应
则参考实现，一并落地。

## 落地账目

### P0 上游跟进（0.2.1-rc.3 @ 1f81c047fc → 0.2.2-rc.1 @ 66491b05e3）

- Button：outline 改 DPR-aware inset stroke（新宿主上下文变量 `--dsh-hairline-width` /
  `--dsh-button-outline-color` 进 vendor hostContext 白名单）；全部 hover 规则包进
  `@media (hover: hover)`
- Modal close / SegmentedControl tab：hover 同上
- use-modal-layer：焦点归还守卫（仅当焦点仍留在保留 dialog 内才归还）
- focus：新增 isMobileDevice
- icons：官方改文档级 sprite（`<use href>`），kit 刻意不跟（复制即独立）；
  五图标 path 与新 artwork.ts 逐字节比对零变化
- token 清单 vendor 重生成；锚更新

### P1 官方组件补齐（23 个 ready + 4 图标）

pill / state-dot / checkbox / disclosure-row / fold-toggle / shortcut-keys /
path-label / config-field / connection-indicator / text-shimmer / segmented-tabs /
command-text / inline-editor / toast / hover-card / image-lightbox / image-preview /
animated-rows / user-message-bubble / zoom-controls；planned 三件套（tooltip / menu /
switch）转正。path-label 的 pathPartsOf 内联（官方 workspace-path 包不引入）。

**结构性改动**：共享行为模块独立成条目（focus / keyboard-composition / modal-layer /
pointer-grace / overlay-top-margin / anchored-position / dismiss-on-outside-pointer /
clipboard / clipboard-copy / head-tail-cap），modal / menu / tooltip / hover-card 改依赖
引用——此前 use-modal-layer 同时挂在 modal 与 menu 的 files 里，所有权映射被后者覆盖，
产生幻影依赖（guard 抓到后重构）。

**转换器升级**：链式类选择器支持（官方 menu/toast 在用 `.list.compactList` 等，
lead 集扩 `(?<=[\w-])` lookbehind 零宽避免重叠消费）；官方 CSS Modules 的 `:global()`
在拷贝时剥离（运行时注入不认识该语法）。

**护栏升级**：vendor 补 static / shadow / specific / dsBase / dshTheme 五类（309→428）；
存在性护栏新增「同文件定义」「条目 JS inline 设置」两条已知规则 + `--dsh-anchored-*` /
`--dsh-menu-*` / `--dsl-*` 前缀白名单（组件钩子与宿主页面级覆盖钩子，全部带 fallback）；
纪律护栏新增官方复制件例外登记表（OFFICIAL_EXCEPTIONS，逐文件写理由：tooltip/toast 的
static、hover-card 字面深底、zoom-controls light-dark 阴影、json-tree rgba 等）。

### P2 shadcn base 对齐（39 个 kit 自有）

- 简单件 12：separator / aspect-ratio / label / skeleton / progress / spinner / avatar /
  breadcrumb / button-group / empty / item / field
- 容器件 9：card / alert / collapsible / accordion / scroll-area / table / data-table /
  toggle / toggle-group（data-table 内置排序不引表格库；accordion 用 grid-rows 动画）
- 浮层件 8：popover / combobox / command / context-menu / menubar / sheet（含 drawer
  形态）/ navigation-menu / pagination（context-menu / menubar / navigation-menu 复用
  官方 Menu 的 contextual 指针模式与 anchor 渲染；popover / combobox 走官方锚定钩子）
- 复杂件 10：slider / radio-group / input-otp / calendar / date-picker / carousel /
  resizable / sidebar / chart / form

全部：样式只用 alias token；行为手写；动画尊重 prefers-reduced-motion。

**shadcn 对齐的功能性偏离（有意为之）**：chart 不引 recharts（极简柱/线/迷你图，
文档声明不做坐标轴体系）；form 不引 react-hook-form（提交期 pending 语义 + field
字段壳）；data-table 不引 tanstack（列配置 + 表头排序）；sheet 合并 drawer 形态；
navigation-menu 为简化版（无 mega panel）。

### P3 内容块（6 个官方轻量 + 4 个替身模块）

保真复制：json-tree / json-block / search-block / code-toolbar / diff-block /
terminal-block（+ head-tail-cap / use-clipboard-copy helpers）。

零依赖替身（kit 自有，诚实声明）：
- **mini-diff**：LCS 行级 diff 替 `diff` 包（同 hunk 形状，context 窗口 +
  maxEditLength 预算，超限走官方同款整段回退）
- **ansi-lite**：SGR 子集解析替 `anser`（基础 16 色照官方 TOKEN_BY_BASIC_RGB 映射落
  主题 token，256/truecolor 落字面 rgb）
- **code-highlighting-lite**：supportsHighlighting 恒 false（工具栏自动降级为纯
  复制/换行）+ languageForPath 扩展名映射

**暂缓并留档（本 issue 的明确不做）**：markdown 家族（MarkdownText / render / parse /
shiki 高亮 / KaTeX / 高亮版 CodeBlock）、ReadBlock、WebBlock、QuotePreview、
DetailDocument。理由：micromark+mdast+shiki+KaTeX 依赖族（兆级、数十包）与 kit 零
运行时依赖纪律正面冲突，且 shadcn base 同样没有对应物（其生态把 markdown/code 渲染
交给应用层与第三方）。重启条件：真实消费需求出现时，以「内容块依赖分层」议题拍板
（要么为内容块单开带依赖的 tier，要么做轻渲染）。

### shadcn 对照结论（base 全集覆盖）

已覆盖 45 个 base 组件（同 functionality）：button/input/textarea/select/badge→tag/
checkbox/switch/tooltip/hover-card/toast→toast/dropdown-menu→menu/dialog→modal/
alert-dialog→risk-confirmation/tabs→segmented-control+segmented-tabs/kbd→shortcut-keys
+command-text/label/collapsible/accordion/alert/avatar/breadcrumb/card/carousel/chart/
combobox/command/context-menu/data-table/date-picker/drawer→sheet/form/hover-card/
input-otp/menubar/navigation-menu/pagination/popover/progress/radio-group/resizable/
scroll-area/separator/sheet/sidebar/skeleton/slider/table/toggle/toggle-group/
empty/item/field/spinner/button-group + 官方独有的 30 个保真件。

base 中无对应而未做的：aspect-ratio 已做；其余无。

## 验收标准

- [x] 上游 0.2.2-rc.1 锚更新 + vendor 重生成 + 既有 9 组件逐文件 diff 同步
- [x] 官方非品牌件、非重依赖内容块全部 ready（30 保真 + 6 轻量内容块）
- [x] shadcn base 缺失组件全部补齐（41 kit 自有），样式全 DSH token、行为手写零依赖
- [x] 内容块落地（6 保真轻量 + 3 替身模块），暂缓清单留档
- [x] 19 条护栏全绿（含 checkout 在场时的「与上游逐字节一致」实测）+ typecheck 零错
- [x] 消费端 luna-dsh 重新 add 受影响组件并重建
- [x] README / AGENTS 组件清单改为按来源分组（registry.json 为权威清单，文档不重复维护 87 行表）

## 提交链

1336901（P0 上游跟进）→ 028db75（P1 官方补齐）→ be130b7（P2 批次 1）→ ba544a7（批次 2）
→ 0dee84f（批次 3）→ 224dfaf（批次 4）→ eb60327（P3 内容块）→ 本提交（P4 文档收口）。

## 进度日志

- 2026-11-06  jianan  立项即收官（同日四阶段）。实施中的自纠错：①管线写 `//` 头注进
  css（非法 CSS 注释，注入后会吞后续规则）→ 改 `/* */`；②模板串转义把真实控制字节
  （\u001B/\r）落进 ansi-lite → node 按行重写；③图标提取正则漏掉第三种 artwork 形态
  （单引号串 + 无 strokeWidth）→ 三形态兼容；④mini-diff 参数类型与官方 7 参调用形态
  对齐（normalize 传拼接串 → string | readonly string[] 双形态）。
