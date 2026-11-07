# 02 · token 纪律与升级

## 一、为什么是 alias 层

DSH 官方把设计 token 分三层：

| 层 | 例 | 性质 |
|---|---|---|
| `--dsw-static-*` | 调色板原子色（`--dsw-static-neutral-bluish-00`） | 换肤时会整批重映射，**不承诺稳定** |
| `--dsw-alias-*` | 语义别名（`--dsw-alias-label-primary`） | **官方承诺的唯一稳定语义面** |
| `--dsw-specific-*` | 场景级（`--dsw-specific-menu`） | 绑定具体宿主场景 |

第三方插件样式只许引用 alias 层。本仓的所有样式（官方保真件 + 本仓自有件）遵守同一条纪律；
官方复制件里官方自己用了 static/specific/字面色的（tooltip/toast/hover-card 等），
按「保真优先」在护栏的 `OFFICIAL_EXCEPTIONS` 逐文件登记并写明理由，升级重 diff 时跟随官方。

## 二、token 的两道闸（缺一不可）

| 闸 | 抓什么 | 怎么抓 |
|---|---|---|
| **类别护栏** | 引用了 static/specific 层、字面颜色（hex/rgb/hsl/oklch/具名色） | 正则扫 `src/*.css`，官方例外表放行 |
| **存在性护栏** | token 名拼错、官方已删/改名 | 逐个 `var(--x)` 对 pinned 清单（`tokens/official-tokens.json`，428 token）查 |

存在性为什么必须有：CSS 规范下 `var()` 解析失败 = **整条声明被静默丢弃**，界面少样式
但零报错。类别对但名字错（如 `--dsw-alias-label-prIMARY`）只有存在性护栏能抓。

清单外合法变量（护栏按前缀/同文件/JS inline 放行）：`--dsh-frame-*`（宿主标题栏）、
`--dsh-hairline-width` / `--dsh-button-outline-color` / `--dsh-content-font-size`
（宿主/主题运行时注入）、`--dsh-segment-*` / `--dsh-anchored-*` / `--dsh-menu-*`
（组件 JS inline 设置）、`--dsl-*`（宿主页面级覆盖钩子，全部带 fallback）、
`--shiki-*`（语法高亮的第三方契约变量，值在 本仓自带的 shiki.css）。

## 三、命名空间：为什么类名要「前缀 + 组件名段」

官方 CSS Modules 的隔离是每文件哈希；复制模型把它降级成「运行时注入同一个 `<style>`」，
哈希隔离不复存在。教训来自真实事故（2026-11-05 复审）：input 与 select 都有 `.wrap`、
button 与 input 都有 `.icon`，只加 `duc-` 前缀时 `.duc-wrap`/`.duc-icon` 跨组件互覆，
按钮 icon 被染成 input 的 tertiary 色。故：

- 根类（与组件同名）：`.button` → `duc-button`
- 其余类：加组件名段，`.wrap` → `duc-input-wrap` / `duc-select-wrap`
- `@keyframes` 同规则（动画名是文档级命名空间）：`modalEnter` → `duc-modal-modalEnter`
- 护栏断言「全组件最终类名跨组件唯一」——命名空间这个不变量由测试守着

**`:global(...)` 是例外**（2026-11-06 起）：官方 markdown CSS 用 `:global(.katex)` /
`:global(.md-code-block)` / `:global(.line)` 声明**不参与哈希**的第三方契约类名。
改名就失配（katex 自己的 CSS、shiki 主题、宿主钩子都对不上），故 `:global(...)` 内
既不改名也不进类名表。

## 四、DSH 升级流程（升级行动清单）

```bash
# 0. checkout 切到新版本
# 1. token 清单同步（锚自动派生自 checkout：version + HEAD commit）
DSH_CHECKOUT=<新 checkout> pnpm vendor        # 重生成；--check 只校验
# 2. 跑护栏
pnpm test                                     # 含「清单与上游逐字节一致」（checkout 在场时实跑）
# 3. 逐组件重 diff（registry.json 的 upstream 字段指向官方源文件）
#    把官方改动搬进 src/（仅头注释与导入路径是 本仓侧约定，其余保真）
#    markdown 家族可用 scripts/import-markdown-family.mjs 做机械搬运，
#    但语义裁剪（流式臂 / DraggableImage / LinkIcon）仍要手工过一遍
# 4. 更新 registry.json 的 dshVersion / dshCommit
# 5. 版本号 +1、构建、提交、推 GitHub
# 6. 消费端：pnpm add --force 重新复制想跟进的组件（不跟也不坏，见下）
```

**可以维持旧版自己迭代**：机制上唯一会「坏」的是官方删 alias token（步骤 1 的 check 会红）；
视觉/行为漂移只会「旧」，按实机验收的观感决定是否跟进。三层各自独立决策：
官方 → 本仓（事件驱动）→ 消费者（想吃到修复时重新 add --force）。

## 五、例外与裁剪（何时「不保真」是正当的）

- **官方复制件例外**：官方自己用 static/字面色的，登记进 `OFFICIAL_EXCEPTIONS` 保真保留
- **内容块的 DSH 私有耦合裁剪**（issue 005）：官方 markdown 家族里的流式增量解析、
  DraggableImage（DSH workspace 的 file-drag 耦合）、官方 LinkIcon（simple-icons 运行时依赖）、
  品牌件（FileTypeIcon / SiteGlyph）——第三方插件用不上或代价不成比例，裁掉并写明理由。
  裁剪边界不是遗漏，登记在 issue 005
- **依赖分层**：内容块层的重依赖（micromark 家族 / shiki / katex / diff / anser）**不再用
  零依赖替身顶替**，改由消费端自己装；原子层仍是零重依赖。详见 [03-依赖分层.md](./03-依赖分层.md)
