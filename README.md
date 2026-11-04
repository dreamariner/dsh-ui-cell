# dsh-ui-kit

**DSH 插件专用的 shadcn 式 UI 组件框架** — 组件源码复制进插件，类名带插件前缀，样式只引用 `--dsw-alias-*` token。

```
npm i -D @dreamariner/dsh-ui-kit
npx dsh-ui-kit add button input tag --to path/to/plugin
```

## 为什么

DSH 官方插件开发规范明文禁止第三方插件 load 官方 Harness Client 包（含 `@deepseek-ai/dsh-client-ui-primitives`），并给出 sanctioned 的替代路径：**把 primitive 的 markup、CSS、行为复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这正是 shadcn 的核心模型（组件源码归你所有、复制而非依赖、token 化样式）。本仓把这套模型落到 DSH 上：

| shadcn | dsh-ui-kit |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-kit add` |
| Radix UI 行为库 | **DSH 官方 ui-primitives 源码**（宿主亲生的行为与 token） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token（宿主换肤自动跟随） |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

**不引入 Tailwind、不引入 Radix**：第三方插件的 client 构建没有 CSS 管线（DSH 官方 client 预设的 lightningcss 通道对外插件不可用），Tailwind 的 preflight 还会泄漏到宿主页面。组件层直接用官方源码，无需重造。

## 用法

```bash
dsh-ui-kit add <component...> --to <pluginDir> [--prefix duk-] [--force]
```

复制后插件侧做两件事：

1. 组件文件进 `src/client/ui/`，`import { Button } from '../ui/button.tsx'`
2. 样式注入：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器

`css` 表以**原类名为键、前缀化类名为值**（`'primary': 'duk-primary'`），所以官方组件里 `css[variant]` 这类动态索引访问不用改写也能正确工作。

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
- **类名一律带插件前缀**：复制进插件后必须重命名，否则与插件自身样式撞车。`add` 负责这件事，不要手抄组件绕过。
- **行为保真清单**：Modal 的焦点陷阱/Escape/焦点归还、SegmentedControl 的键盘走查与 roving tabindex、Modal 的层级栈——官方点名要保的用户依赖行为，不得简化。
- **不改 DSH 内核**：组件源从 checkout 只读复制。
- **基线锚**：`registry.json` 的 `dshVersion` / `dshCommit` 是来源真相源；DSH 升级时按各条目 `upstream` 逐组件重 diff（改的是本仓 `src/`，消费者已复制走，不受影响）。

## 仓库

- `registry.json` — 组件清单（名字、状态、文件、上游出处、DSH 基线）
- `src/` — 权威组件源码（tsx + css，类名保留上游原名便于 diff）
- `cli/` — `add` 实现（复制 + 前缀化 + CSS→TS 转换）
- `tests/registry.spec.ts` — 自守护栏（registry 一致性 + token 纪律 + 前缀化）
- `AGENTS.md` — 定位与红线（改本仓前先读）

## 许可

Apache-2.0。组件源码源自 DSH 官方 ui-primitives（Apache-2.0），保真复制并按官方规范加了插件前缀。
