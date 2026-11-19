---
id: 034
type: docs
title: skill 同步 rc.5（宿主 DSH 版本下限 + 新旧件差异清单 + 子菜单交互契约）+ 1.6.0
status: done
priority: P2
labels: [文档, skill, 上游跟进]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [030, 033]
---

# 034 · docs · skill 同步 rc.5

## 背景

skill 是**消费端 Agent 看的第一份文件**（随 npm 包分发）。rc.5 同步之后复查，
发现它缺了最要紧的一条：**宿主 DSH 版本下限**。

## 补了什么

### 1. 宿主 DSH 版本下限（最要紧的一条）

skill 通篇没提宿主要什么版本的 DSH。而 rc.5 基线把下限抬到了 **rc.5**：
`json-tree` 改用 `--dsw-alias-json-tree-*` token 族（rc.5 才有的），
宿主低于 rc.5 时那七行声明被**静默丢弃** —— JSON 树没有配色，零报错。

补在三处：
- 开头的**「宿主要求」提示块**（版本取 `registry.json` 的 `dshVersion`，当前 rc.5）
- ② 接入六步的第 **0 步**（复制前先确认宿主版本）
- ④ 高频坑加一行：「某个件没有配色但零报错」→ 宿主版本不够

### 2. ⑤ 升级段补新旧件差异

消费端换包前要知道：**哪些件变了、要 `add --force` 才吃得到**。列了 0.6.0（rc.5 基线）
相对 0.5.0 的 14 个变更条目与它们各自的新能力，并写明「不换也不坏，只是吃不到新能力」。

### 3. references/interaction.md 补子菜单契约

rc.5 把菜单族重写了，消费者自写菜单族组件时该照哪套做：四条打开路径
（悬停/聚焦/点击/ArrowRight）、ArrowLeft 回父级、Escape 先关子菜单、焦点进出、
body portal（样式作用域变化：不能靠父级上下文变量传值）、CSS anchor 定位而非 JS 测量。

### 4. frontmatter 与版本号

触发场景加「宿主 DSH 版本、组件升级」；版本 1.5.0 → **1.6.0**。

## 一并做的系统性核对

把 skill 与两份 references 里提到的**每个条目名、token、文件路径、CLI 参数**都对着代码核了一遍：

- 97 / 88 atom / 9 content 的数字断言 ✓
- content 档的 9 个名单 ✓
- CLI 参数（`--prefix` / `--force` / `--with-deps`）✓
- add 的四类 note（npm 依赖 / 原样注入样式模块 / 基础层 / 已存在未覆盖）✓
- 所有 `--dsw-*` token 都在 pinned 清单里 ✓
- 所有 registry 条目名都真实存在 ✓

## 结果

`pnpm test` 157 通过 1 跳过、站点已重建（1978 KB）。

## 待办

- 宿主版本下限这条，建议以后每次抬基线都同步改 skill 顶部提示（可以加进升级 SOP 的清单）
- 组件能力的新形态目前只在 skill 里以「件名 + 一句话」列出；若某个形态复杂
  （如菜单族），可以考虑给 skill 加一份 references/ 详解
