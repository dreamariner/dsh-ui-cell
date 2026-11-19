---
id: 031
type: chore
title: 沉淀 DSH 升级经验：八步 SOP（docs/wiki/05）+ 十个教训 + 版本注记一致性护栏
status: done
priority: P2
labels: [文档, 流程, 护栏, 上游跟进]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [029, 030, 012]
---

# 031 · chore · DSH 升级经验沉淀（SOP + 护栏）

## 背景

rc.5 这一轮升级（issue 029 / 030）踩了几个坑，都是**同一类**：
注册表说一套、文件是另一套，没有检查能报。升级一次要长记性，
否则下一轮（rc.6 / rc.7）原样再踩。

本 issue 把经验固化成三样东西：**一份 SOP**、**一组护栏**、**一处欠账清零**。

## 一、欠账清零：8 个文件的版本注记

审计发现：registry 的 `upstream` 注记已经写成 rc.5，而这些源文件的**头注记还写 rc.1**
（内容其实已是 rc.5 或与 rc.5 等价 —— 上游 rc.1→rc.5 没改这些文件）：

`button.tsx` / `tooltip.tsx` / `tooltip-placement.ts` / `input-modality.ts` /
`path-label.tsx` / `path-parts.ts` / `use-clipboard-copy.ts` / `json-tree.tsx`

**注册表在撒谎**：看注记以为跟上了，看文件头以为没跟上，谁也说不清哪些件真就绪。
已全部对齐到 rc.5。

## 二、新护栏：注记版本 = 文件头版本

`tests/registry.spec.ts` 新增一例：registry 的 `upstream` 注记里声明了版本、
且源文件头也声明了版本时，两者必须一致。

红绿验证（把 `tooltip.tsx` 头注记改回 rc.1 → 护栏红；还原 → 绿）✓

这条护栏的由来正是「注记先写、内容后补」：**只要有人先改了 registry 的注记、
后补内容，中间那段窗口期就会被抓住**，而不是等到下次升级才发现。

## 三、SOP：docs/wiki/05-DSH升级SOP.md

八步流程，每步带验收标准：

| 步骤 | 做什么 | 验收 |
|---|---|---|
| 0 | checkout 切到目标 tag，记下 HEAD commit | 记下的 commit 就是新锚 |
| 1 | **先看上游改了什么**（`pnpm upstream:diff --base <旧锚>`），不要先动代码 | 输出三类：一致 / 滞后 / 上游新增删除 |
| 2 | 逐件决定跟或不跟（三问：行为还是外观？在不在裁剪范围内？token 存不存在？） | 结论写进 `upstream` 字段 |
| 3 | `pnpm vendor` 重生成 token 快照，**顺手看例外表要不要减** | 例外表只减不增 |
| 4 | 改 `src/`，**同步文件头注记的版本号** | 改完这个件在比对里变成 `✓` |
| 5 | 同步 registry 的 `dependencies` | 依赖闭包护栏绿 |
| 6 | `pnpm test && pnpm typecheck` | 五条必过的护栏 |
| 7 | 重建站点 + **实机抽查**（亮暗两套、改了 token 的件） | diff 看不出暗色还对不对 |
| 8 | **最后**改锚点 | 两个锚一致；重跑比对应只剩已登记偏离 |

附：十个教训表（每条带实证与对应护栏）、常见上游变化的处理对照
（换 token / 拆文件 / 加 prop / 修 bug / 删文件 / 改名 / 加重依赖）、
以及一份「别做的事」清单。

## 四、入口接好

- `docs/wiki/README.md`：目录 + 入口表加 05
- `docs/wiki/02-token纪律与升级.md`：升级流程段升级为速查版，指向 05，
  并补了「最容易犯的三个错」
- `AGENTS.md` 红线 5：补「锚点是总结论，不是过程动作」「版本注记与源文件内容要一起改」
  「升级流程见 docs/wiki/05-DSH升级SOP.md」

## 结果

`pnpm test` 156 通过 1 跳过（新增 1 例）、`pnpm typecheck` 绿、站点已重建（1964 KB）。

## 待办

- SOP 里那三条最容易被跳过的护栏（下单加即坏 / 基线锚一致 / 注记版本一致），
  可以再考虑接进 CI（当前只在本机跑 `pnpm test`）
- 工具的下一步：把「已登记偏离」从 registry 注记解析出来，
  让 `upstream:diff` 直接区分「正当偏离」与「真缺口」，而不是给一份差异清单让人读
