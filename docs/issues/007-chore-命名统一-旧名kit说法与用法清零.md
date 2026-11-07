---
id: 007
type: chore
title: 命名统一：旧名 dsh-ui-kit 的说法与用法清零（默认前缀 duk- → duc-）
status: done
priority: P2
labels: [dsh-ui-cell, 改名, 命名一致性, 护栏]
created: 2026-11-07
updated: 2026-11-07
assignee: lin
related: [003, 006]
---

# 007 · 命名统一：旧名 dsh-ui-kit 的说法与用法清零

## 背景

003 改名（dsh-ui-kit → dsh-ui-cell）只改了仓与包名，活文档与代码里的自指说法
（「kit 自有」「kit 路径」「本 kit」）与默认前缀 `duk-`（旧名缩写）原样留着。
2026-11-07 用户指出「很多地方还存在 kit 的说法和用法」，要求排查并统一。

全量排查结论（`grep -rni kit` + `duk-`，排除 node_modules / lib / lockfile）：

| 面 | 数量 | 处置 |
|---|---|---|
| src 注释（约 100 个文件的「kit 自有 / kit 路径」头注） | ~130 行 | 全改「本仓」 |
| registry.json 描述与 upstream 标注 | 42 处 | 全改「本仓自有」等 |
| 生成脚本（build-docs / import-markdown-family / vendor-tokens / gen-barrel / gen-katex-css）的注释、模板与 `KIT`/`kitFile`/`kitStyles` 等标识符 | 53 处 | 全改；不改则下次生成会把旧名写回去 |
| tests（注释 + `uikit-*` 临时目录前缀 + `duk-` 断言） | 43 处 | 全改 |
| README / AGENTS.md / wiki md / wiki demos | ~30 处 | 全改 |
| wiki 文档站 demo 文件名 `demo-kit.tsx` | 1 文件 + 8 处引用 | 改名 `demo-cell.tsx` |
| index.html（生成物） | ~60 处 + 全量 `duk-` 样式 | 手工同步（build-docs 硬依赖 DSH_CHECKOUT，无法重建） |
| tokens/official-tokens.json 的 note | 1 处 | 手改 + 生成模板同步 |

**合法保留**（用户裁定 + 本就应保留）：

- `dsh-ui-kit` 作为**曾用名句式**（README / AGENTS.md 的改名记录与生态划分说明：
  与 neil-ji/dsh-ui-kit 运行时库无关，同名曾迫使本次改名）
- docs/issues/001-005 与 Luna 日记（2026-11-04）：历史记录不追溯改写

## 决策

**默认前缀 `duk-` → `duc-`（用户拍板，彻底清除旧名痕迹）**。代价已知：四个消费仓
（dsh-ledger / dsh-pilot / media-platforms-center / luna-dsh plugin-memory）共 59 个
已复制文件烤着 `duk-` 类名，后续重新 add 会产出 `duc-` 类名，同仓内两套前缀并存，
需要各消费仓择机迁移（见遗留）。

自指说法的替换词表：「kit 自有 → 本仓自有」「kit 路径 → 本仓路径」「本 kit → 本仓」
「kit 侧 → 本仓侧」等 30 余条有序规则（特定在前、正则兜底）。

## 过程里抓到的两个险情

- **`::-webkit-scrollbar` 误伤**：`kit-scrollbar` 规则吃进了 webkit 伪元素的子串，
  5 个文件出现 `::-webduc-scrollbar`。已修复（webduc → webkit），并把
  `webkits?` 加进护栏的合法保留面。
- **大写 `KIT` 根目录常量漏网**：四个生成脚本各有 `const KIT = ...`，批量规则的
  词表没覆盖大写孤立词。命名护栏上来第一天就抓到了（这正是要它的原因）。

## 结果

- 活面（src / cli / scripts / tests / registry.json / tokens / README / AGENTS / wiki）
  旧名说法清零；`duk-` 在活面（含 index.html）清零
- 默认前缀 `duc-`：CLI 默认值、帮助文本、全部文档示例、测试断言、wiki demo 样式
  （含文档站自用的 `duc-scrollbar-*`）统一
- **命名一致性护栏 +2**（41 → 43 条）：kit 自指清零（曾用名句式 / webkit / base64
  资产除外）与 `duk-` 清零（拼接构造 needle 防自伤），回流即红
- 全量验证：test 42 通过 / 1 按设计跳过；typecheck 零错；build 通过；
  冒烟：无参 `add button` 产出 `duc-button` / `duc-button-primary` 等类名

## 遗留与边界

- **消费端存量 `duk-` 类名**（59 文件）：各消费仓择机迁移或接受新旧并存；
  迁移时连各自的 `*-css.ts` 类名表与手写引用一起改，属消费仓自己的 issue
- **index.html 是手工同步的生成物**：下次在有 DSH_CHECKOUT 的环境跑 `pnpm docs:build`
  会从已改写的 md / registry 重新生成，届时可 diff 校验本次手改无遗漏
- 父仓 zero 的历史提交信息（如「同步 kit v0.3.0」）与 Luna 日记属历史记录，不改
