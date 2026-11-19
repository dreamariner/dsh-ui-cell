# 变更记录

本文件记**发出去的版本**。开发中的变更看 `docs/issues/`（每条一个 issue，收尾即归档）。

## 0.6.0 — 2026-11-19

**组件源基线抬到 DSH 0.2.2-rc.5**（此前是 rc.1）：上游 35 个文件变更（+1436/-515）逐件重 diff，
53 个有上游出处的条目逐条比对过 —— 内容与上游一致，或偏离已写进 `registry.json` 的 `upstream` 字段。

### 消费端要注意的

- **宿主下限 DSH ≥ 0.2.2-rc.2**（新增 `registry.json` 的 `minHostDsh`）：低于它，
  json-tree / hover-card / toast / tooltip / combobox / popover 等件的配色会**静默失效**
  （token 解析失败 = 整条声明被丢弃，零报错）。`add` 的 note 会提示这条。
- **14 个条目变了，要吃到新能力需 `add --force` 重新复制**：
  `menu`（含新拆出的 `menu-row` / `submenu-panel` / `use-menu-submenu` / `menu-submenu-position`）、
  `code-block`（新增 diff 围栏逐行渲染）、`icon`、`json-tree`（配色改用 alias token）、
  `modal`（新增 `tone="warning"`）、`checkbox`（新增 `modalAutofocus`）、
  `risk-confirmation`、`quote-preview`（新增 `summary` 形态）、`animated-rows`、
  `context-menu`、`anchored-position`、`tooltip`、`toast`、`button`。
  不重新复制也不坏，只是吃不到新能力（旧件仍在插件里）。
- **新增条目**：`menu-row` / `submenu-panel` / `use-menu-submenu` / `menu-submenu-position`
  （上游 rc.5 拆出来的菜单族），以及 `sidebar-nav`（本仓自有侧栏导航）。

### 新能力与改进

- **组件用法速查**（`skills/dsh-ui-cell/references/components.md`，随包分发）：77 个组件的
  一句话说明 + 最小可用片段 + 可接的 props 字段名 + 依赖，从文档站 demo 生成，不会漂移。
- **组件源文件头带「用法块」**：复制进插件的文件里就有 import + 示例 + props 字段名。
- **新增组件**：`sidebar-nav`（侧栏导航，分组 / 图标 / 徽标 / 选中态，收起态自动读 Sidebar 的 Context）。
- **Sidebar 收起态经 Context 下发**：`SidebarNav` 不用再传两遍 `collapsed`；
  槽内内容用 `useSidebarCollapsed()` 感知。
- **Sheet 支持自定义圆角**：`radius` 属性（缺省 `radius-panel` 28px）。
- **NavigationMenu 双模式下划线**：非受控传 `defaultCurrentId` 自迁移；声明 `current: true` 进受控。
- **基础层**：`foundation.css` 定义间距刻度 `--dsh-space-*`（`add` 自动带上并排在注入第一位）。
- **动效统一官方三档**：`--ds-transition-duration{,-fast,-slow}` + `--ds-ease-in-out`，
  自有件禁字面时长与字面曲线，带动画的组件有 `prefers-reduced-motion` 降级。

### 修复

- Resizable 拖动跟手（百分比按条中心反解）+ 松手三路收尾（不再误触）
- Collapsible / DisclosureRow 展开收起有动画（grid 过渡 / 相位状态机）
- InputOtp 边框闭合（0.5px 横边被设备像素整段吞掉）+ 输入过滤正则（`/D/` → `/\D/`）
- Avatar 文字回退不再被圆裁掉
- Card 圆角归到 `lg` 档（28px 在小卡片上显突兀）
- HoverCard 恢复上游保真
- Calendar 点击日期的「闪一下」（悬停底色盖住选中态）
- TextShimmer 扫光在浅底上可见
- ConfigField 控件字号归主题档位、select 换 DSH chevron（浏览器自绘箭头不随字号缩放）
- Tooltip / Toast / JsonTree 的配色改用 alias token（不再用 static 层与字面色）

### 文档与流程

- 文档站补齐 rc.5 的新能力演示（Modal warning / Menu 子菜单 / QuotePreview summary / CodeBlock diff 围栏）
- 文档站 body 模拟宿主内容字号（14px），修插槽文本比真应用大两号的偏差
- **DSH 升级 SOP**（`docs/wiki/05-DSH升级SOP.md`）：八步流程 + 十个教训 + 常见上游变化对照
- **CI**（`.github/workflows/ci.yml`）：护栏测试、构建与发布面清单、上游保真核对

## 0.5.0 — 2026-11-12

- Chart 趋势扩能（TrendChart：多序列分组柱 + 柱线叠加 + 当前项高亮）

## 0.4.0 — 2026-11-11

- Calendar / DatePicker 月份模式（`mode='month'` 年格 + YYYY-MM 值）+ 两处存量修复

## 0.3.1 — 2026-11-10

- 样式注入顺序成为隐性依赖（`add` 的 note 给出依赖序）

## 0.3.0 — 2026-11-06

- 依赖分层与 markdown 家族落地（registry 87 → 94 条目，内容块档与 npm 依赖交接）

## 0.2.1 — 2026-11-05

- 命名空间修复：类名加组件名段（input 与 select 的 `.wrap` 互覆实证）、依赖闭包解析
