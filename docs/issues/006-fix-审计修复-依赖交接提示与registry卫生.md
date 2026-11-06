---
id: 006
type: fix
title: 审计修复：依赖交接提示、registry 卫生与文档勘误
status: done
priority: P1
labels: [dsh-ui-cell, cli, registry, 文档]
created: 2026-11-07
updated: 2026-11-07
assignee: lin
related: [005, 002, 004]
---

# 006 · 审计修复：依赖交接提示、registry 卫生与文档勘误

## 背景

2026-11-06 对 005 交付（56e0f64）做了一次全面评估与审计：重读 CLI / 护栏 / 内容块层源码，
跑全量验证（test + typecheck），并独立复做消费端冒烟（真实 add 3 个内容块组件 → 装依赖
→ React 19 类型编译）。审计结论：005 的分层机制与实现整体合格（消费端 React 19 编译
零错、跨条目 css 引用改写正确、raw 样式 note 正确点名），但抓到 1 个 P1、2 个 P2、
一批 P3，本 issue 一次修完。

## 问题清单与修法

### P1 · 安装建议把 scoped 包截断（已修）

`addComponents` 的 note 对 `pkg@range` 拼接串做 `split('@')[0]` 反解包名，
`@shikijs/langs@4.4.3` 与 `@types/mdast@^4.0.0` 都被截成空串。审计冒烟实测，建议命令
是 `pnpm add shiki  katex …`，两个包凭空消失。消费端照抄就装漏包、编译不过
（`missingDeps` 数据本身是对的，坏的是给人照抄的命令）。

修法：新增 `installCommand(missing)`，由「包名 → 范围」表直接拼命令，不做字符串往返；
note 与它同源。护栏补两条：code-block 冒烟断言建议命令含 `@shikijs/langs@4.4.3`；
`installCommand` 纯函数单测。

### P2 · 同包版本范围冲突会写出装不上的 semver（已修）

`collectNpmDependencies` 遇同名包不同范围时合并成 `a | b`，这不是合法 semver
（npm 的「或」是 `||`），`--with-deps` 会把装不上的范围写进消费端 package.json。
当前 registry 无实际冲突（全仓扫描确认），属埋雷。

修法：冲突直接报错（registry 维护事故该在最早的时刻爆出来，而不是让消费端装不上）；
护栏补「npmDependencies 同包跨条目范围一致」，从源头拦。

### P2 · registry 双重声明 + 护栏缺口（已修）

`hover-card` 既把 `overlay-top-margin.ts` 列在自己的 files，又在 dependencies 声明
共享条目 `overlay-top-margin`（约定本该二选一：同条目内文件不进 dependencies，
反过来共享件不该再列 files）。后果：全新消费端单次 add 也报
「已存在未覆盖（要覆盖加 --force）」，误导用户以为有既有文件；`--force` 时还会静默
重写。护栏没有「源文件归属唯一」的检查所以拦不住；全仓扫描确认仅此一例。

修法：registry 去掉 hover-card 的重复列文件（共享件照旧经 dependencies 引用，闭包
照常带上，产物无悬空导入）；护栏补「每个源文件只归属一个条目」。另给 add 的文件循环
加了「本轮已写目标静默去重」，从此 skipped 只剩「消费端已有文件」一种语义。

### P3 · 一批文档与注释失真（已修）

- README / AGENTS.md 仍写「87 个条目」与 30/6/41/10 旧表，「官方轻量核心」行还留着
  「重依赖以替身顶替」的 004 旧话 → 按实际重算：官方保真复制 37 / 官方内容块 6 /
  kit 自有 41 / 共享行为模块 10，合计 94
- issue 005 结果段「atom 89 / content 5」实为 atom 85 / content 9（原文漏数 6 个
  content 档条目）；「静态 10 种常用语法」实为 8 种（`LANGS` 实际 8 个语法，js 家族
  共用 ts）→ 005 原文就地勘误标注，wiki 03 同步改
- AGENTS.md 验证段「（19 条）」已过时（现 41 条）；目录结构缺 markdown 家族、
  tests/markdown.spec.tsx、scripts/import-markdown-family.mjs → 补齐
- `src/diff.ts` 头注称 npm diff 的 structuredPatch 没有 maxEditLength；实测仓内
  diff@9.0.0 支持（传 maxEditLength: 0 返回 undefined）→ 头注改为如实陈述（kit 保留
  自己那层守卫的真正理由是预算口径与调用方既有语义一致，不依赖 npm diff 内部细节）
- cli/add.ts 的 note「本仓插件见 src/client/panel/panel-css.ts」是消费仓语境残留
  （5c2f713 引入，c417407 的公开仓清洗漏了 CLI note 这一处）→ 改通用表述
  （npm 消费者的仓里没有那个路径）
- `cssClassNames` 注释说链式类 `.a.b`「两边都不认」，与正则 lookbehind 的实际行为、
  以及护栏断言（menu/toast 在用、逐段改名）相矛盾 → 注释改为如实描述
- `prefixTsxCssAccess` 是 no-op（类名表以原类名为键后就不需要改写 tsx）、
  `dynamicCssAccesses` 全仓无引用 → 两个历史接口删除，设计注释并入
  `buildStyleModule`（类名表机制的解释本来就该挂在那）

## 结果

- 护栏 27 → **33 条**（新增：文件归属唯一 / npm 范围跨条目一致 / 安装建议 scoped
  回归 / 冲突报错 / installCommand 同源 / 运行内去重）+ 8 条 markdown 渲染回归
  = **41 条**（1 条需 DSH_CHECKOUT 在场才跑）
- 全量验证：`pnpm test` 40 通过 / 1 按设计跳过；`pnpm typecheck` 零错；`pnpm build` 通过
- 冒烟复跑：`add markdown-text read-block diff-block` → 46 文件，安装建议完整含
  `@shikijs/langs@4.4.3` 与 `@types/mdast@^4.0.0`；`add hover-card` 无假性
  「已存在未覆盖」；`--with-deps` 写入消费端 package.json 正确（scoped 包作为键原样写入）
- 消费端独立编译复验（005 的结论在修复后仍成立）：React 19 + 全部内容依赖下
  `tsc --noEmit` 零错

## 遗留与边界

- `collectNpmDependencies` 的冲突报错依赖护栏先拦（CI/本地跑 test 时），
  手改 registry 不跑 test 就 add 会在 add 时报错，两层都通向同一个错误信息
- shiki 静态语法集维持 8 种（与官方 40 种懒加载的差距是 005 的有意取舍，见其遗留节）
- KaTeX 字体走 CDN、bundle 体积代价等 005 既有的边界不变
