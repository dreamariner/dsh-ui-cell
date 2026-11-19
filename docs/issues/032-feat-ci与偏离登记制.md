---
id: 032
type: feat
title: 加 CI（护栏 + 构建发布面 + 上游保真核对）与偏离登记制（upstream:check）
status: done
priority: P2
labels: [CI, 护栏, 上游跟进, 流程]
created: 2026-11-19
updated: 2026-11-19
assignee: lin
related: [030, 031]
---

# 032 · feat · CI 与偏离登记制

## 背景

上一轮升级（issue 030 / 031）把护栏补到了 157 条，但**全都只在本机跑**：
CI 从来没有过（仓里连 `.github` 目录都没有）。三条最要紧的纪律因此形同虚设：

1. token 清单与上游逐字节一致（要 DSH checkout）
2. 逐件保真：本仓与上游一致，或**已登记**的偏离
3. 文档站是最新构建（改了源文件没重建站点，公开面护栏就抓不到新的泄露面）

第 2 条还缺一个零件：**CI 怎么区分「有意偏离」与「没跟上」**？靠人读差异清单不行。

## 一、偏离登记制

`docs/upstream-deviations.json`：本仓与上游的**有意偏离**逐条登记，每条带理由，
另有 `baseline` 字段记着它是基于哪个上游版本写的。

工具加 `--expect` 模式：

```bash
DSH_CHECKOUT=<checkout> pnpm upstream:check   # = diff-upstream.mjs --expect docs/upstream-deviations.json
```

断言「实际偏离集合 == 登记集合」：

- **多一条**（实际有偏离但没登记）→ 红：要么跟上上游，要么登记并写理由
- **少一条**（登记了但已不偏离）→ 红：上游或本仓改了，要更新登记文件

**偏离不是永久豁免**：上游改了对应文件，登记就失配 → 每次升级都会逼你把每条偏离
重新审视一遍（还成立吗？理由还准确吗？）。这正是「偏离登记」与「豁免清单」的差别。

当前登记 10 条：icon（sprite 化不跟）、disclosure-row（相位机）、path-label（内联
path-parts）、config-field（控件改写）、anchored-position（上游已删、本仓保留）、
clipboard-copy（类型放宽）、code-highlighting（自有静态语法集）、code-block（自研
diff-fence 对应件）、markdown-text（裁剪范围）、read-block（裁流式臂）。

## 二、CI：`.github/workflows/ci.yml`

房规沿用兄弟仓（`products/xapp` / `products/saowen` / `products/wechat-mp-cli`）：
仓根 `.github/workflows/ci.yml`、`pnpm/action-setup@v4` + `actions/setup-node@v4`
（node 24）+ `pnpm install --frozen-lockfile`、`permissions: contents: read`。

| job | 做什么 | 抓住什么 |
|---|---|---|
| **guardrails** | `pnpm typecheck` + `pnpm test` | 157 条护栏的主体 |
| **build** | tsdown 产物 + `npm pack` 清单核对 | 「装上不能用」（bin 指向的 `lib/cli.mjs` 没落盘）、包里漏文件（registry.json / skills/）、混进 node_modules |
| **upstream-fidelity** | 克隆公开上游的基线 tag → `vendor:check` + `upstream:check` + 重建站点比对 | 上游保真三条纪律（此前只能本机跑） |

**上游 checkout 从哪来**：公开上游仓 `deepseek-ai/deepseek-harness` **有**我们锚定的
那个 tag（`dsh-v0.2.2-rc.5` → `9c2670d3bc`），CI 自己 clone 即可，零 secrets。
tag 名由 `registry.json` 的 `dshVersion` 推导（`dsh-v$(dshVersion)`），
**不写死在工作流里** —— 升级时只改 registry，工作流不用动。

**文档站新鲜度**：`pnpm docs:build` 后 `git diff --exit-code docs/wiki/index.html`。
构建是确定性的（连续两次构建产物逐字节一致，实测过），所以这个比对可用。

## 三、每一步都本地验过

CI 写完不能推上去才知道能不能过，本地逐条跑了：

| 步骤 | 结果 |
|---|---|
| `vendor:check` | ✓ 清单与 checkout 逐字节一致（464 个 token） |
| `upstream:check` | ✓ 已登记 10 / 实际 10，集合一致（退出码 0） |
| `upstream:check`（人为多登记一个） | ✗ 退出码 1，报「登记了但已不再偏离」 |
| `upstream:check`（人为漏登记一个） | ✗ 退出码 1，报「未登记的偏离」 |
| `pnpm build` + `lib/cli.mjs` | ✓ 产物 18 KB |
| `npm pack --dry-run --json --ignore-scripts` | ✓ 221 个文件，清单齐全，无 node_modules |
| `docs:build` + `git diff --exit-code` | ✓ 站点是最新构建 |

> `npm pack` 必须带 `--ignore-scripts`：否则 pack 会再跑一遍 `prepare`（tsdown），
> 它的构建日志会混进 `--json` 的输出，JSON 解析直接炸（本地踩过）。

## 四、护栏再 +1

`tests/registry.spec.ts`：偏离登记文件的 `baseline` 必须与 registry 锚点一致，
且每条偏离都要有理由（没理由的偏离等于没登记）。

## 结果

`pnpm test` 157 通过 1 跳过（新增 1 例）、`pnpm typecheck` 绿、站点已重建。

## 待办

- CI 第一次真跑（push 到 GitHub 后）要盯一眼：Actions 里第三方 action 的版本、
  pnpm 版本与本机是否一致
- 上游仓 tag 命名若变（现在是 `dsh-v<version>`），工作流里的推导要跟着改
- `upstream-fidelity` job 每次 clone 上游（约几百 MB），可用 Actions cache 提速
