---
id: 030
type: chore
title: 上游 rc.5 重 diff 与审计（53 个有上游出处的条目逐条比对；落 2 处真实缺口；锚点改到 rc.5）
status: done
priority: P2
labels: [上游跟进, 审计, 基线锚, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [029, 012, 013]
---

# 030 · chore · 上游 rc.5 重 diff 与审计

## 背景

issue 029 记的是「rc.5 部分重导入，锚点留待办」。本 issue 做那件待办：
**把上游 rc.1 → rc.5 的变化逐条比对本仓复制件，并审计每一处偏离是否正当**，
做完才能动基线锚。

手搓 `diff` 不现实：上游是 PascalCase + `.module.css`，本仓是 kebab-case + `.css`，
直接 diff 全是噪声；而且本仓把上游一个文件拆成多件（Tooltip → tooltip.tsx +
tooltip-placement.ts + input-modality.ts），按文件配对会满屏误报。

故先做工具：**`scripts/diff-upstream.mjs`**（本仓固有职责，红线 5 说的「逐组件重 diff」）。

| 模式 | 作用 |
|---|---|
| 默认 | 把本仓 53 个有上游出处的条目逐条与上游当前版本归一化比对 |
| `--base <commit>` | 按「上游自 base 以来的变更文件」驱动：先看上游改了什么，再看本仓跟没跟上 |
| `--only a,b` | 只看指定条目 |
| `--diff` | 附逐行差异 |

归一化做三件事：剥掉文件开头的注释块（本仓的「来源」头注记 vs 上游的文档注释）、
把 import 路径归到同一模块（`./icons/index.tsx` ≡ `./icons.tsx`、
`./useModalLayer.ts` ≡ `./use-modal-layer.ts`、`./Modal.module.css` ≡ `./modal.css`）、
把改名收录的模块按别名对齐（`highlight` ≡ `code-highlighting`、
`link-icon` ≡ `markdown-link-icon`）。内容相同、只是声明顺序不同的单列一档，不算差异。

## 上游 rc.1 → rc.5 变了什么

`git diff 66491b05e3..9c2670d3bc -- packages/client/ui-primitives/src`：
**35 个文件，+1436 / -515**。分三类：

| 类别 | 文件 | 性质 |
|---|---|---|
| 视觉与 token 修正 | JsonTree.module.css、Tooltip.module.css、Toast.module.css | 上游把字面/static 换成 alias token |
| 交互与能力 | AnimatedRows.tsx（视口裁剪）、Menu.tsx + MenuRow/SubmenuPanel/useMenuSubmenu/menu-submenu-position（菜单族拆分）、icons（新增 4 组图形） | 上游重构与修 bug |
| 内容块家族 | markdown/CodeBlock、MarkdownText、MarkdownDelegate、render、FenceBlocks、copy-tex、diff-fence、highlight | 上游 markdown 家族大改 |

## 审计结论（53 个条目逐条过）

**42 个逐字一致**（含 5 个已在本轮重导入的：animated-rows / checkbox / modal /
quote-preview / risk-confirmation）。

**10 个有偏离，全部正当**，且理由已写进各自的 `upstream` 字段：

| 条目 | 偏离 | 判定 |
|---|---|---|
| icon | 上游改 sprite 化（`<use href>`），本仓走 inline path | 已登记：插件要「复制即独立」，不依赖宿主 sprite |
| code-highlighting | 上游带懒加载与流式会话，本仓是静态语法集 | 已登记：内容块层的重依赖由消费端自装 |
| markdown-text | 裁流式臂 / DraggableImage / 官方 LinkIcon / KaTeX CSS 文本化 | 已登记（issue 005） |
| read-block | 裁流式臂（去掉 useSyncExternalStore 增量订阅） | 已登记（issue 005），**本次补登记** |
| code-block | 上游 rc.5 的 diff 围栏，本仓用自研 diff-fence.ts 对应件 | 已登记 |
| disclosure-row | 内容区改相位状态机（展开收起动画） | 已登记（issue 015） |
| config-field | 控件字号归主题档位、select 换 DSH chevron | 已登记（issue 014） |
| path-label | 上游依赖 workspace 包，本仓内联为 path-parts.ts | **本次补登记**（插件不依赖 DSH workspace 包） |
| clipboard-copy | setTimeout 的 ref 类型放宽为 number（浏览器与 Node 都能编译） | **本次补登记** |
| button | 上游注释措辞多一个词（"backed by its"） | 本次同步（保真件的注释也跟） |

**1 个部分对应**：`anchored-position`（上游 rc.5 删掉了 useAnchoredPosition.ts，改用
CSS anchor 定位；本仓保留此件供自有 popover / combobox 用，不再被 menu 依赖）——已登记。

**7 个上游文件本仓未收录**：FileTypeIcon / code-file-types（品牌件与文件类型件）、
icons/artwork（上游的图标源，本仓 inline）、index（上游 barrel）、
markdown/FenceBlocks / copy-tex / render 的新拆分（已登记不跟）。

## 本次落的 2 处真实缺口

### 1. json-tree：字面色板 → alias token（并删掉暗色覆盖块）

上游 rc.5 把 `.root` 的 7 个 `--json-tree-*` 变量从字面色（`#881391` 等）改成
`var(--dsw-alias-json-tree-*)`，并**删掉了 `:global(body[data-ds-dark-theme])` 覆盖块**
（暗色由 alias token 自己接管）。本仓还在用字面色，当年靠 `OFFICIAL_EXCEPTIONS` 兜着。

处置：跟上游。`--dsw-alias-json-tree-*` 七个 token 在 rc.5 的 pinned 清单里**全部存在**
（已核对）→ 可安全引用。跟完后 **json-tree 退出版例外表**。

### 2. tooltip：macOS 桌面端的 app-region

上游 rc.5 给气泡加了 `:global(:where(html[data-platform='darwin'])) .bubble
{ -webkit-app-region: no-drag; }` —— 气泡浮在可拖拽的标题栏区域上时，不关掉拖拽会被
窗口拖动带走。本仓缺这一行，补上（注释保持上游英文原文，保真件不夹带自撰注释）。

### 附带：例外表瘦身

`OFFICIAL_EXCEPTIONS` 里 **tooltip.css / toast.css 的 `--dsw-static-*` 例外也已失效**
（上游 rc.5 把气泡文字色 `--dsw-static-neutral-bluish-00`、toast 动作色
`--dsw-static-deepseek-400` 都换成了 alias token，本仓已跟）→ 一并摘掉。

例外表现在只剩上游仍在用 static/specific/字面色的那几个文件：
hover-card / image-lightbox / user-message-bubble / zoom-controls / shiki /
code-block / markdown-text。

## 基线锚改到 rc.5

重 diff 做完的前提成立：**53 个有上游出处的条目，逐条要么与 rc.5 一致，要么偏离已登记**。
于是 `registry.json` 的 `dshVersion` / `dshCommit` 从 `0.2.2-rc.1` / `66491b05e3`
改到 `0.2.2-rc.5` / `9c2670d3bce5275e0d1610272958121af87787bb`，与 pinned token 快照对齐。

> 注意：json-tree 现在引用 rc.5 才有的 alias token，**宿主 DSH 需 rc.5+**。

## 护栏

`tests/registry.spec.ts` 新增 5 例：

- **基线锚一致**：registry 的 `dshVersion`/`dshCommit` 必须等于 pinned token 快照的。
  这条是补一个真实漏洞：此前 token 清单到 rc.5、registry 还停 rc.1 的错位，
  **没有任何护栏会报**（那次的红是别的原因带出来的）。
- json-tree 必须用 `--dsw-alias-json-tree-*` 族，且不得再有字面色与暗色覆盖块
- tooltip 必须有 darwin 的 `no-drag` 行
- animated-rows 必须有 `visibleViewport` 且快照里带 viewport
- button 的上游注释措辞已同步

`pnpm test` 155 通过 1 跳过、`pnpm typecheck` 绿、站点已重建（1964 KB，页头显示
「DSH 0.2.2-rc.5」）。

## 待办

- 消费端要吃到需 `add --force` 重新复制受影响件（json-tree / tooltip / button 等）
- 宿主 DSH 低于 rc.5 的插件：json-tree 的配色会失效（alias token 解析不到），
  如需兼容旧宿主可保留字面色版式，但那是**显式的兼容分支**，不做默认
- 工具可以再进一步：把「已登记偏离」从 registry 注记里解析出来，自动区分
  「正当偏离」与「真缺口」，让默认模式直接给出结论而不是差异列表
