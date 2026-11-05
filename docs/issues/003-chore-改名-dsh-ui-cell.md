---
id: 003
type: chore
title: 改名 dsh-ui-kit → dsh-ui-cell（同域同名运行时库在先）
status: done
priority: P2
labels: [命名, 生态, 改名]
created: 2026-11-06
updated: 2026-11-06
assignee: jianan
related: [001, 002]
---

# 003 · 改名 dsh-ui-kit → dsh-ui-cell

## 为什么改

检索发现 GitHub 上已有一个同名且同域的先行项目：**neil-ji/dsh-ui-kit**（2026-08，
npm 未加 scope 的 `dsh-ui-kit` 已发布 0.1.0，含文档站），定位是「匹配 DSH web UI
设计体系的**运行时** React 组件库」。同名 + 同域 + 对方先发已发布，继续沿用会被
搜索与口碑永久遮蔽，且像后者的事实山寨。改名窗口在本仓 npm 首发前仍为零成本
（消费者一个、引用全部在自家庭内），故改。

候选对比（GitHub/npm 占位 + 语义邻域均实测）：`dsh-ui-components`（可用，但
seed-forge/dsh-plugin-ui-components 占了 dsh+ui+components 词根）、`dsh-ui-ext`
（可用，但 DSH 语境里 ext 已被「宿主扩展/皮肤」品类占用，会被误读为可安装插件）、
`dsh-ui-registry`（机制准确，但仓主认定理解成本高，被否）。最终取 **dsh-ui-cell**：
全平台零占位、不撞宿主词汇（规范 \bcell\b 零命中）、且隐喻为真——复制即独立，
源码自带遗传物质离体存活，正是本仓的产品论点。

## 落地

- GitHub 仓改名（林老师操作），旧 URL 自动重定向
- `package.json`：name `@dreamariner/dsh-ui-cell`、bin `dsh-ui-cell`、version 0.2.1
- `registry.json`：name 与 homepage
- `cli/add.ts`：CLI 输出前缀与生成产物的 header 印章（消费端据此重新 add）
- `scripts/vendor-tokens.mjs`、`tests/registry.spec.ts`、`src/index.ts`、`cli/index.ts`：注释口径
- `README`：细胞叙事开场 + 新增「生态划分」节（与 neil-ji 无关、与 seed-forge 层级互补）
- `AGENTS.md`：标题定位、生态划分注记、旧名留痕
- 消费端 luna-dsh：重新 add（`-css.ts` header 印章同步），033 进度注记
- zero：子模块目录与 `.gitmodules`（path/url）迁移 + 指针提交

历史 issue（001/002）按仓规不追溯改写，其中的 dsh-ui-kit 均指改名前的本仓。

## 验收标准

- [x] 代码与文档面旧名 grep 清零（历史 issue 与「生态划分」的引用性提及除外）
- [x] 19 条测试全绿 + typecheck 零错 + build 通过
- [x] 消费端产物印章更新且重建通过
- [x] zero 子模块 path/url 同步，`git submodule sync` 后远端可达
