# dsh-ui-cell

**DSH 插件专用的复制式 UI 组件源（shadcn 式 registry）**。

名字里的 cell 是认真的：**复制即独立**。组件被复制进插件后源码归插件所有，像细胞一样自带全部遗传物质（源码、token 纪律、前缀命名空间、行为）离体存活，kit 与宿主各自升级互不影响。

```
npm i -D @dreamariner/dsh-ui-cell
npx dsh-ui-cell add button input tag --to path/to/plugin
```

## 为什么

DSH 官方插件开发规范明文禁止第三方插件 load 官方 Harness Client 包（含 `@deepseek-ai/dsh-client-ui-primitives`），并给出 sanctioned 的替代路径：**把 primitive 的 markup、CSS、行为复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这正是 shadcn 的核心模型（组件源码归你所有、复制而非依赖、token 化样式）。本仓把这套模型落到 DSH 上：

| shadcn | dsh-ui-cell |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-cell add` |
| Radix UI 行为库 | **DSH 官方 ui-primitives 源码**（宿主亲生的行为与 token） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token（宿主换肤自动跟随） |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

**不引入 Tailwind、不引入 Radix**：第三方插件的 client 构建没有 CSS 管线（DSH 官方 client 预设的 lightningcss 通道对外插件不可用），Tailwind 的 preflight 还会泄漏到宿主页面。组件层直接用官方源码，无需重造。

## 细胞的三条生存机制

1. **遗传物质自足**：复制走的不只是 markup，还有行为（Modal 焦点陷阱/层级栈、SegmentedControl 键盘走查）、样式（转成 TS 字符串运行时注入）与命名空间（`duk-` 前缀 + 组件名段）
2. **独立代谢**：源码归插件，官方与 kit 各自升级都影响不到已复制的组件；想吃到新版本时主动重新 `add --force`
3. **分裂不排异**：add 时刻的转换器保证类名与 keyframes 跨组件、跨插件不撞车，token 只引用 alias 稳定面且逐一过存在性校验

## 用法

```bash
dsh-ui-cell add <component...> --to <pluginDir> [--prefix duk-] [--force]
```

组件依赖自动解析闭包：`add risk-confirmation` 会同时复制 `button` / `modal` / `icon`（deps 先于本体），产物无悬空导入。

复制后插件侧做两件事：

1. 组件文件进 `src/client/ui/`，`import { Button } from '../ui/button.tsx'`
2. 样式注入：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器

`css` 表以**原类名为键、最终类名为值**（`'primary': 'duk-button-primary'`；与组件同名的根类免组件段，`'button': 'duk-button'`），所以官方组件里 `css[variant]` 这类动态索引访问不用改写也能正确工作。值里带组件名段的原因：消费端把全部组件样式拼进**同一个 `<style>`**，官方 CSS Modules 的 per-file 哈希隔离在这里不存在，只加插件前缀时 input 与 select 的 `.wrap` 会互覆（复审实证过）。`@keyframes` 名是文档级命名空间，同规则改名。

## 组件

| 组件 | 说明 | 上游出处 |
|---|---|---|
| button | 四变体 + 两尺寸 + icon 槽位 | ui-primitives/Button.tsx |
| input | 单行输入 + leading icon | ui-primitives/Input.tsx |
| tag | 八色调，`data-tone` 变体机制 | ui-primitives/Tag.tsx |
| segmented-control | WAI-ARIA tabs 键盘走查 + 滑动指示器 | ui-primitives/SegmentedControl.tsx |
| modal | portal + 焦点陷阱 + Escape + 焦点归还 | ui-primitives/Modal.tsx |
| risk-confirmation | 风险确认（主操作需勾选后解锁） | ui-primitives/RiskConfirmation.tsx |
| select | 原生 select 的 token 化外衣 | kit 自有 |
| textarea | 多行输入 | kit 自有 |
| icon | 当前 5 个图标（currentColor + aria-hidden） | ui-primitives/icons/index.tsx |
| tooltip / menu / switch | planned（按需 add） | ui-primitives/ |

## 纪律

- **样式只引用 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-elevation-*` / `--dsw-focus-ring-*`**：禁 `--dsw-static-*`（调色板原子色，官方换肤会重映射）、禁 `--dsw-specific-*`、禁字面颜色。官方规范说 alias 层是唯一稳定语义面。
- **token 名必须真实存在**：拼错或官方已删除的 token 会让**整条声明被静默丢弃**（var() 解析失败）——界面少样式但零报错。kit 有 pinned 的官方 token 清单（`tokens/official-tokens.json`）+ 存在性护栏逐个校验，DSH 升级时用 `DSH_CHECKOUT=<path> pnpm vendor` 重生成（范式同 protocol 仓的 `vendor`/`vendor:check`）。
- **类名一律带插件前缀 + 组件名段**：复制进插件后必须重命名，且最终类名必须**跨组件唯一**（同一 `<style>` 命名空间）。`add` 负责这件事（`.button` → `duk-button`，input 的 `.wrap` → `duk-input-wrap`，keyframes 同规则），不要手抄组件绕过。
- **行为保真清单**：Modal 的焦点陷阱/Escape/焦点归还、SegmentedControl 的键盘走查与 roving tabindex、Modal 的层级栈——官方点名要保的用户依赖行为，不得简化。
- **不改 DSH 内核**：组件源从 checkout 只读复制。
- **基线锚**：`registry.json` 的 `dshVersion` / `dshCommit` 标注组件源基线（人工维护，DSH 升级时更新并按各条目 `upstream` 逐组件重 diff，改的是本仓 `src/`，消费者已复制走不受影响）；`tokens/official-tokens.json` 的同名字段由 `pnpm vendor` 从 checkout 自动派生（根 package.json 的 version + HEAD commit），不手改。

## 生态划分（同名与近邻声明）

- 与 **neil-ji/dsh-ui-kit**（npm `dsh-ui-kit`，运行时组件库）**无关**：那边是 `import` 使用的运行时依赖，这边是复制式源码分发，模型不同、代码无关。
- 与 **seed-forge/dsh-plugin-ui-components**（插件外壳与交互契约层）**层级互补**：那边做 `PluginSurface` / `ApprovalGate` / `TabRegistry` 等插件骨架，这边做设计系统原子。

## 仓库

- `registry.json` — 组件清单（名字、状态、文件、dependencies 依赖闭包、上游出处、DSH 基线）
- `src/` — 权威组件源码（tsx + css，类名保留上游原名便于 diff）
- `cli/` — `add` 实现（复制 + 前缀化[组件名段] + keyframes 改名 + CSS→TS 转换 + 依赖闭包解析）
- `tests/registry.spec.ts` — 自守护栏（registry 一致性 + token 纪律 + 存在性 + 命名空间唯一性 + 依赖闭包 + 前缀化）
- `AGENTS.md` — 定位与红线（改本仓前先读）

## 许可

Apache-2.0。组件源码源自 DSH 官方 ui-primitives（Apache-2.0），保真复制并按官方规范加了插件前缀。
