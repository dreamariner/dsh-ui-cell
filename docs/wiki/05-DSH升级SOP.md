# 05 · DSH 版本同步 SOP

> 面向**本仓维护者**。DSH 上游发新版本时按本篇走一遍，走完锚点才算升级完成。
> 消费端（插件侧）不需要做这些：组件源已复制进插件，上游变更不会回头影响它们。

## 零、先记住这三条（都是踩过的坑）

1. **锚点是总结论，不是过程动作**。`dshVersion` / `dshCommit` 只在**全部条目对齐之后**改一次。
   中途改锚点 = 注册表开始对尚未跟上的件说谎。
2. **注记与内容要一起改**。`upstream` 字段写「rc.5」的同时，源文件的头注记与内容也要到 rc.5。
   只改注记 = 注册表在撒谎（2026-11-19 的 rc.5 升级留了 8 个文件的欠账）。
3. **用工具跑，不用眼力跑**。`pnpm upstream:diff` 是唯一可靠的比对手段；
   手搓 `diff` 会被命名差异与拆件淹没，真缺口反而看不见。

## 一、流程（按序做，每步都有验收）

### 步骤 0 · 准备：把上游 checkout 切到目标 tag

```bash
git -C <dsh-checkout> fetch --tags
git -C <dsh-checkout> checkout dsh-v0.2.2-rc.5
git -C <dsh-checkout> log -1 --format='%h %d %s'   # 记下这个 commit，它就是新锚
```

`DSH_CHECKOUT` 必须**显式指定**（本仓不猜本机路径，见 issue 013）。

### 步骤 1 · 先看上游改了什么（不要先动代码）

```bash
DSH_CHECKOUT=<checkout> pnpm upstream:diff --base <上一个基线 commit>
```

输出分三类，逐类处理：

| 输出 | 含义 | 动作 |
|---|---|---|
| `✓ 已跟上` | 本仓内容与上游当前版本一致 | 无需动作 |
| `≠ 本仓滞后` | 上游改了、本仓没跟 | **逐个看 diff**，判断是「该跟」还是「有意不跟」 |
| `◐ 无对应件` | 上游新增/删除的文件 | 新增件：要不要收录；删除件：本仓是否还在用 |

### 步骤 2 · 逐件决定：跟，还是不跟

每个有差异的文件都问三句：

1. **上游改的是行为还是外观？** 行为改动要落到「行为保真清单」（Modal 焦点陷阱 /
   SegmentedControl 键盘走查 / Modal 层级栈）上复核。
2. **改动落在本仓已登记的裁剪范围内吗？** 落在范围内就**不跟**（别把上一轮的决议冲掉）。
   例：markdown 家族 rc.5 的 render.tsx / CodeBlock.tsx 大改，全属已登记的
   「FenceBlocks 拆分 + copy-tex 不跟」。
3. **引用的 token 在目标版本的清单里存在吗？** 查 `tokens/official-tokens.json`
   （步骤 3 会重新生成）。不存在 = 那个声明会被静默丢弃 = 样式失效且零报错。

结论写进该条目的 `upstream` 字段（**格式固定**）：

```
packages/client/ui-primitives/src/<File>.tsx @ dsh v0.2.2-rc.5 (<commit>)（<偏离理由>）
```

有偏离的必须写理由；没偏离的也要写版本，好让「跟没跟」一眼可查。

### 步骤 3 · 重生成 token 快照

```bash
DSH_CHECKOUT=<checkout> pnpm vendor
```

`tokens/official-tokens.json` 会更新到新版本（token 增删改名都在里面）。

> ⚠ 顺手检查一遍**例外表**（`tests/registry.spec.ts` 的 `OFFICIAL_EXCEPTIONS`）：
> 上游这轮把字面色 / static 层换成 alias token 的文件（tooltip / toast / json-tree 就是这样），
> 本仓跟完后**必须退出版例外表**。例外表只减不增是常态。

### 步骤 4 · 改源码（本仓 `src/`，不是消费端）

- 保真复制件：按上游内容改，**保留上游注释原文**（保真件不夹带自撰注释）
- 自有件：按上游的样式/行为口径改，但保留本仓自己的偏离
- **同步文件头注记的版本号**（`dsh v0.2.2-rc.5 (commit)`），别留 rc.1
- 改完立刻跑一次比对，确认这个件变成 `✓`

### 步骤 5 · 同步 registry 的依赖声明

上游改了这个件的 import 吗？改了就要改 `dependencies`（护栏会抓）：

> 上游 rc.5 把 `RiskConfirmation` 的警告图标上收到了 `Modal` 的 `tone='warning'`、
> 勾选框换成共享 `Checkbox` → 它的直接导入从 `icons` 变成 `checkbox`。
> 声明不改 → 消费端单加这个件就产出悬空导入（编译不过）。

### 步骤 6 · 跑全部护栏

```bash
pnpm test && pnpm typecheck
```

必过的几条（都是踩过坑才加的）：

| 护栏 | 抓什么 |
|---|---|
| 依赖闭包「单加即坏」 | 声明与实际导入脱钩 |
| registry 注记版本 = 文件头版本 | 注记先写、内容后补 |
| 基线锚 = pinned token 快照锚 | 两个锚各走各的 |
| token 存在性 | 引用了目标版本里不存在的 token |
| 例外表瘦身检查 | 上游已修、本仓还兜着 |

### 步骤 7 · 重建文档站 + 实机抽查

```bash
DSH_CHECKOUT=<checkout> pnpm docs:build
```

至少抽查：受影响组件的渲染（亮色 + 暗色两套）、改了 token 的件（配色是否还在）、
改了动画的件（动效是否还在）。**diff 看不出「暗色还对不对」**，只能实机看。

### 步骤 8 · 最后改锚点

全部条目对齐后再改 `registry.json` 的 `dshVersion` / `dshCommit`，与
`tokens/official-tokens.json` 的同名字段一致。然后再跑一次 `pnpm upstream:diff`，
结果应当是「一致 N / 偏离 M（全部已登记）」。

## 二、本轮（rc.1 → rc.5）的十个教训

| # | 教训 | 实证 | 现在的护栏 |
|---|---|---|---|
| 1 | **注记与内容要一起改** | registry 先写 rc.5，8 个文件的内容与头注记还停 rc.1 | 版本注记 = 文件头版本 |
| 2 | **锚点最后动** | token 快照到 rc.5、registry 停 rc.1，两者说的不是一回事 | 基线锚 = token 快照锚 |
| 3 | **依赖声明要跟着 import 走** | risk-confirmation 的 icons → checkbox，声明没改 → 单加即坏 | 依赖闭包「单加即坏」 |
| 4 | **例外表要做减法** | json-tree / tooltip / toast 上游都换成 alias token 了，本仓还挂着字面色例外 | 例外表 + 逐条重 diff |
| 5 | **比对要靠工具** | 手搓 diff 时 22 处「差异」里大半是命名与拆件误报，真缺口被淹没 | `pnpm upstream:diff` |
| 6 | **配对规则要显式** | code-highlighting ← `markdown/highlight.ts`、use-modal-layer ← `useModalLayer.ts` 这类改名件，按名字配必然配错 | 工具里带别名表 + registry 字段优先 |
| 7 | **顺序不同 ≠ 内容不同** | animated-rows 只是类型声明顺序不同，被误判成「滞后」，差点白改一轮 | 工具单列「仅顺序不同」一档 |
| 8 | **裁剪范围内的改动别跟** | markdown 家族 rc.5 的 +53/+92 行全属已登记的 FenceBlocks 拆分与 copy-tex | 裁剪决议写进 `upstream` 字段 |
| 9 | **上游删文件 ≠ 我们也删** | 上游删了 `useAnchoredPosition.ts`，本仓自有 popover/combobox 还在用 | 保留并登记偏离 |
| 10 | **引用新 token 要记宿主下限** | json-tree 改用 rc.5 才有的 alias token，宿主低于 rc.5 就掉色 | registry 写明版本与偏离 |

## 三、升级后要写的东西

一次升级 = 一份 issue（`docs/issues/NNN-chore-上游跟进-<版本>.md`），至少包含：

1. 上游这轮改了哪些文件（`git diff --stat <旧>..<新> -- packages/client/ui-primitives/src`）
2. **逐条目的结论表**：一致 / 滞后（已跟）/ 偏离（已登记，理由）
3. 本仓主动落的改动（源文件、registry、例外表）
4. 新增护栏
5. 待办：消费端要 `add --force` 的清单、宿主版本下限

## 四、常见上游变化的处理对照

| 上游变化 | 典型例子 | 处理 |
|---|---|---|
| 字面色 / static → alias token | rc.5 的 json-tree / tooltip / toast | 跟；本仓退出版例外表；查 token 存在性 |
| 组件拆分成多个文件 | rc.5 的 Menu → MenuRow / SubmenuPanel / useMenuSubmenu | 跟；本仓若已拆分，对齐拆分边界 |
| 新增 prop / 能力 | rc.5 的 `Modal tone='warning'`、`Checkbox modalAutofocus` | 跟；保真件的 API 变化要过一遍行为保真清单 |
| 修 bug（可见性/时序） | rc.5 的 AnimatedRows 视口按窗口裁剪 | 跟；这类修复常伴随 `useSyncExternalStore` 等依赖，注意声明同步 |
| 删除文件 | rc.5 删 `useAnchoredPosition.ts` | 先查本仓有没有在用；没在用就删，在用就保留并登记 |
| 改名 / 移目录 | `highlight.ts` → `code-highlighting.ts` | 更新工具的别名表与 registry 字段 |
| 引入新重依赖 | 内容块层的新 npm 依赖 | 走依赖分层纪律（issue 005），别偷偷进原子层 |

## 五、别做的事

- ❌ 整包覆盖 `src/`（会冲掉本仓已登记的偏离）
- ❌ 只改 registry 注记不改源码（注册表开始说谎）
- ❌ 升级中途就改锚点（锚点是总结论）
- ❌ 以为「护栏没报 = 没问题」：护栏只查**能形式化**的东西，
  「这段上游变化是否落在我们的裁剪范围内」只能人读 diff 判断
- ❌ 忘了消费端：源文件改了不等于消费端更新了，要给出 `add --force` 清单
