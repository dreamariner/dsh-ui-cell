# dsh-ui-kit — DSH 插件专用的 UI 组件框架

> shadcn 的分发模型（registry + copy CLI + 源码归插件）+ DSH 官方 primitives 作组件源。
> 第三方 DSH 插件的 UI 组件**复制即用**，不依赖任何官方 client 包。

## 项目定位

DSH 官方插件开发规范（`packages/preset/agent-preset/skills/cordis-plugin-development/references/practices.md`）明文禁止第三方插件 load 官方 Harness Client 包（含 `@deepseek-ai/dsh-client-ui-primitives`），并给出 sanctioned 的替代路径：**把 primitive 的 markup、CSS、行为复制进插件源码，类名改前缀，样式只引用 `--dsw-alias-*` token**。

这正是 shadcn 的核心模型（组件源码归你所有、复制而非依赖、token 化样式）。本仓把这套模型落到 DSH 上：

| shadcn | dsh-ui-kit |
|---|---|
| `registry.json` + `shadcn add` | `registry.json` + `dsh-ui-kit add` |
| Radix UI 行为库 | **DSH 官方 ui-primitives 源码**（宿主亲生的行为与 token） |
| Tailwind 变量主题 | `--dsw-alias-*` 语义 token（宿主换肤自动跟随） |
| 组件源码进你的仓库 | 同（`src/client/ui/`，源码归插件） |

**不引入 Tailwind、不引入 Radix**：第三方插件的 client 构建没有 CSS 管线（DSH 官方 client 预设的 lightningcss 通道对外插件不可用），Tailwind 的 preflight 还会泄漏到宿主页面。组件层直接用官方源码，无需重造。

## 红线（破坏即返工）

1. **样式只引用 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-elevation-*` / `--dsw-focus-ring-*`**：禁 `--dsw-static-*`（调色板原子色，官方换肤会重映射）、禁 `--dsw-specific-*`（场景级）、禁字面颜色（hex / rgb / 具名色）。官方规范原话是 alias 层是唯一稳定语义面。

   ⚠ **「类别对」不等于「token 对」**：token 名拼错、或官方在某版本删了它，CSS 规范是**整条声明被静默丢弃**（var() 解析失败），样式不生效且**无任何报错**。故除了类别护栏，还有一条**存在性校验**：`tokens/official-tokens.json`（pinned 快照，官方 ui-theme 的 token 定义）里必须能查到每个 `var(--x)`。清单外的 token 只有两类合法例外：宿主上下文变量（`--dsh-frame-*`，宿主 AppFrame 注入）与组件自有变量（`--dsh-segment-*`，组件自己 inline 设置）。DSH 升级时跑 `scripts/gen-tokens.mjs` 重生成清单。
2. **类名一律带插件前缀**：复制进插件后必须重命名（`.button` → `duk-button` 之类），否则与插件自身样式撞车。`dsh-ui-kit add` 负责这件事，不要手抄组件绕过。
3. **行为保真清单**（官方点名要保的用户依赖行为，不得简化）：
   - Modal：焦点陷阱（Tab 环绕）、Escape 关闭、关闭后焦点归还触发控件、`data-modal-autofocus` 初始焦点
   - SegmentedControl：WAI-ARIA tabs 键盘走查（Arrow/Home/End 环绕、跳过 disabled）、roving tabindex、选中后焦点跟随
   - Modal 层级栈：`useModalLayer` 的 WeakMap 栈（嵌套时只有最上层拥有 Escape）
4. **不改 DSH 内核**：组件源来自 checkout 只读复制，不改上游任何文件。
5. **基线锚**：`registry.json` 的 `dshVersion` / `dshCommit` 是组件来源的真相源。DSH 升级时按各条目的 `upstream` 字段逐组件重 diff，不是整包覆盖。

## 目录结构

```
dsh-ui-kit/
├── AGENTS.md            # 本文件
├── package.json         # @dreamariner/dsh-ui-kit（bin: dsh-ui-kit）
├── registry.json        # 组件清单（名字、状态、文件、上游出处、DSH 基线）
├── src/                 # 权威组件源码（tsx + css，类名为上游原名）
│   ├── button.tsx/.css、input、tag、segmented-control、modal、risk-confirmation
│   ├── select.tsx/.css、textarea.tsx/.css        # kit 自有（官方无对应原子）
│   ├── icons.tsx                                 # 官方 icons/ 的子集（5 个）
│   ├── use-modal-layer.ts、focus.ts、keyboard-composition.ts   # Modal 行为依赖
│   └── index.ts                                  # 本仓 barrel（消费端不用它）
├── tokens/official-tokens.json  # 官方 token 清单（pinned 快照，护栏据此做存在性校验）
├── scripts/gen-tokens.mjs       # 从 DSH checkout 重生成 token 清单（升级期）
├── scripts/lib/paths.mjs        # DSH_CHECKOUT 解析（显式指定，无默认推导）
├── cli/add.ts           # add 实现（复制 + 前缀化 + CSS→TS 转换）
├── cli/index.ts         # CLI 入口
└── tests/registry.spec.ts  # 自守护栏（registry 一致性 + token 纪律 + 前缀化）
```

## 用法

```bash
# 把组件复制进插件（源码进插件自己的仓，提交后即与本仓解耦）
npx dsh-ui-kit add button input tag --to path/to/plugin --prefix duk-

# 参数
#   --to <pluginDir>   目标插件目录（其下自动建 src/client/ui/）
#   --prefix <pfx>     类名前缀，默认 duk-
#   --force            覆盖已存在文件（默认跳过，避免盖掉插件的本地改动）
```

复制后插件侧要做的两件事：

1. 组件文件进 `src/client/ui/`，`import { Button } from '../ui/button.tsx'`
2. 样式注入：每个组件生成 `<name>-css.ts`，导出 `styles`（样式文本）与 `css`（类名表）；把用到的 `styles` 拼进插件已有的 `<style>` 注入器

`css` 表以**原类名为键、前缀化类名为值**（`'primary': 'duk-primary'`），所以官方组件里 `css[variant]` 这类动态索引访问不用改写也能正确工作。

## 组件清单

| 组件 | 状态 | 说明 | 上游出处 |
|---|---|---|---|
| button | ready | 四变体（primary/ghost/outline/toolbar）+ 两尺寸 + icon 槽位 | ui-primitives/Button.tsx |
| input | ready | 单行输入 + leading icon | ui-primitives/Input.tsx |
| tag | ready | 八色调，`data-tone` 变体机制 | ui-primitives/Tag.tsx |
| segmented-control | ready | WAI-ARIA tabs 键盘走查 + 滑动指示器 | ui-primitives/SegmentedControl.tsx |
| modal | ready | portal + 焦点陷阱 + Escape + 焦点归还 | ui-primitives/Modal.tsx |
| risk-confirmation | ready | 风险确认（主操作需勾选后解锁） | ui-primitives/RiskConfirmation.tsx |
| select | ready | 原生 select 的 token 化外衣 | kit 自有 |
| textarea | ready | 多行输入 | kit 自有 |
| icon | ready | 当前 5 个图标（currentColor + aria-hidden） | ui-primitives/icons/index.tsx |
| tooltip | planned | 视口自适应 placement | ui-primitives/Tooltip.tsx |
| menu | planned | 子菜单 + 键盘走查（依赖多个内部 hook） | ui-primitives/Menu.tsx |
| switch | planned | role=switch + aria-checked | ui-primitives/Switch.tsx |

## 维护

- **加组件**：从 DSH checkout 复制对应 `.tsx` + `.module.css` 到 `src/`（保留上游类名原样，便于日后 diff），在 `registry.json` 登记（含 `upstream` 出处），必要时补依赖（Modal 依赖 `use-modal-layer` / `focus` / `keyboard-composition`）。
- **加图标**：从官方 `icons/index.tsx` 复制对应 `Icon*Artwork` 函数体 + Regular 导出，保持 `Icon{Name}OutlineRegular` 命名与 currentColor 契约。
- **DSH 升级**：更新 `registry.json` 的 `dshVersion` / `dshCommit`，逐组件按 `upstream` 重 diff，把改动同步到 `src/`（**改的是 `src/`，不是消费者**——消费者已经复制走，不会被上游变更影响）。

## 验证

```bash
pnpm test        # registry 一致性 + token 纪律 + token 存在性 + 前缀化（10 条）
pnpm typecheck   # 组件源码类型检查
```

## token 正确性的两道防线

| 防线 | 抓什么 | 怎么抓 |
|---|---|---|
| **类别护栏** | 引用了不该引用的 token 层（static / specific）、字面颜色 | 正则扫 CSS（`tests/registry.spec.ts`） |
| **存在性护栏** | token 名拼错、官方已删除、官方改名 | 对 `tokens/official-tokens.json`（pinned 快照）逐个查 |

两者都不可省：类别对但名字错的情况（如 `--dsw-alias-label-prIMARY`）只会让**该条声明被
静默丢弃**，界面少一个样式但没有任何报错——这是最隐蔽的一类失败。

例外白名单（不在官方清单里但合法）：宿主上下文变量 `--dsh-frame-chrome-top` /
`--dsh-frame-overlay-top`（宿主 AppFrame 注入，带 fallback）、组件自有变量
`--dsh-segment-count` / `--dsh-segment-index`（SegmentedControl 在 inline style 里设置）。
