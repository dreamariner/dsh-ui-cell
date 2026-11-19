---
id: 036
type: feat
title: 组件源文件头加「用法块」（生成物）+ 宿主版本下限落到 add 的 note（并纠正为 rc.2）+ 版本号定 0.6.0
status: done
priority: P2
labels: [分发, skill, 上游跟进, 护栏]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [034, 035]
---

# 036 · feat · 用法块 + 宿主版本下限 + 版本决策

## 决定（三件事）

1. **组件源文件头加「用法块」**（生成物，与 demo 同源）
2. **版本号用 0.6.0，不拆分**（0.6.0 从未发布过，rc.5 同步落在它之内，不另开 0.7.0）
3. **宿主版本下限写进 add 的 note**（消费端安装期唯一会看到的通道）

## 一、用法块：消费端复制到插件里就有用法

上一轮给了「用法速查表」（`references/components.md`，随包分发）。但还有一条更近的路：
**组件源文件本身** —— 消费端复制过去的就是源文件，用法块写在它的头部，Agent 读文件即得。

做法：`scripts/gen-component-usage.mjs` 从文档站 demo 生成，注入到 77 个组件源文件的头部
（既有来源注记之后、import 之前）：

```
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { Button } from './button.tsx'
//   <Button variant="primary">主操作</Button>
//   <Button variant="ghost">次操作</Button>
//   props：variant / size / icon / className / children
// ────────────────────────────────────────────────────────────────────────
```

- **幂等**：块被替换而不是堆叠（删除用全局匹配）。第一版栽过一次 ——
  把「模板字符串 + 含 `${}` 的正则字面量」嵌套在一起，模板字符串的插值被提前截断，
  解析出来的模式不对 → 每次跑都多插一份，77 个文件各积到 3 份。改成字符串拼接构造正则后正常。
- **不破坏保真判定**：`diff-upstream` 的归一化会剥掉开头的注释块，用法块在那个范围内 →
  逐件比对仍判「一致」（`pnpm upstream:check` 通过，偏离集合仍是登记的 10 个）。
- **防漂移**：`pnpm skill:usage:check` 同时校验速查表与源文件里的块（护栏 +1 例、CI 已接）。

## 二、宿主版本下限：**纠正为 rc.2**（此前写成 rc.5 是错的）

上一轮（issue 034）说「宿主需 rc.5+，因为 json-tree 用了 rc.5 才有的 token」——
**这个说法错了**，把两件事混了：

| 是什么 | 值 | 管什么 |
|---|---|---|
| 组件源基线 `dshVersion` | 0.2.2-rc.5 | 组件源码抄自哪个上游版本（行为与结构） |
| 宿主下限 `minHostDsh` | **0.2.2-rc.2** | 消费端的宿主至少要有多新（token 层面） |

实测：本仓引用 101 个 `--dsw-*` token，其中 16 个不在 rc.1 清单里（hovercard / json-tree /
toast / tooltip / shadow-lv2-3 / specific-* 族），但**这 16 个在 rc.2 就都有了**；
rc.2 → rc.5 之间本仓没引用任何新 token → **宿主下限是 rc.2，不是 rc.5**。

于是：

- `registry.json` 加顶层 `minHostDsh: 0.2.2-rc.2`（条目级 `minHostDsh` 留给个别更高的件）
- `cli/add.ts` 的 note 里输出宿主下限，并说明「低于此版本时这些件的配色会静默失效」
- skill 的提示块 / 接入第 0 步 / 高频坑 / 升级段全部改成「两个下限，各管一件事」（skill 1.6.1）

### 下限要被验证，不能只是声明

把 rc.2 的 token 快照留档进仓（`tokens/official-tokens@0.2.2-rc.2.json`，
取自上游历史的 `9f94c53`），再加两条护栏：

- **引用的每个 token 都必须存在于下限对应的快照里** —— 下限定低了会红
- **下限不得高于组件源基线** —— 下限定高了说不通

以后抬基线时，若引入的新 token 在下限快照里没有，护栏当场报出来，逼着把下限一起抬。

## 三、版本决策：0.6.0 一发，不拆

0.6.0 在 9bc4796 就升了，但**从未发布过**（npm 上最新是 0.5.0）。rc.5 同步、CI、SOP、
用法块这些都落在 0.6.0 之内，不存在「已发布的 0.6.0 和现在不一样」的尴尬 → 合成一发。
版本号不再承担「基线变了」的信号，那个信号由 `registry.json` 的 `dshVersion` /
`minHostDsh` 与文档承担。

## 结果

`pnpm test` 160 通过 1 跳过（新增 3 例）、`pnpm typecheck` 绿、站点已重建（1979 KB）。
77 个组件源文件头部带用法块；`npm pack` 222 → 223 个文件（多了 token 快照？不 —— 快照在
tokens/ 不在 files 里；多的是 components.md 已在上一轮）。

## 待办

- 20 个没有 demo 的条目（12 个行为模块 + 8 个可视组件）没有用法块；可视组件补了 demo 后自动长出
- 用法块里的示例偶尔引用未 import 的符号（如 icon）—— 头注里已写明「示例里出现的其它组件需自行 import」
