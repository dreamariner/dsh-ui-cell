# 组件用法速查（Agent 视角）

> **生成物，别手改**：改法是改文档站的 demo（`docs/wiki/demos/`），然后跑
> `pnpm skill:usage` 重新生成；CI 会校验它与 demo 没有漂移。
>
> 用途：插件项目里问「这个组件怎么用」。每条给四样东西 ——
> **一句话选型说明**（registry 的 description）、**最小可用片段**（文档站 demo 的真代码）、
> **可接的 props 字段名**（从源码的 props 声明抓的，类型看源码）、**依赖**（add 会自动带上）。
>
> props 那一行是该文件里**所有 props 接口的字段合集** —— 除组件自身的 props 外，
> 也含它内部结构（如 `Menu` 的 `items` 条目字段 `icon` / `shortcut` / `danger`）——
> 写嵌套结构时照着用最方便；严格类型看源码。
>
> 完整 API 与行为保真说明看复制进插件的源码（`src/client/ui/<组件>.tsx` 的头部注释与 props）。

## 原子件

### Button

按钮原子：primary / ghost / outline / toolbar 四变体，md / sm 两尺寸，icon 槽位，原生属性透传

```tsx
import { Button } from '../ui/button.tsx'

<Button variant="primary">主操作</Button>
<Button variant="ghost">次操作</Button>
<Button variant="outline">描边</Button>
<Button variant="toolbar" icon={<IconDatabaseOutlineRegular size={13} />}>工具条</Button>
<Button variant="primary" size="sm">小尺寸</Button>
```

props：`variant` / `size` / `icon` / `className` / `children`

### Input

单行输入原子：可选 leading icon，value/onChange 受控，min/max/type 等原生属性透传

```tsx
import { Input } from '../ui/input.tsx'

<Input value={text} onChange={(event) => setText(event.target.value)} placeholder="搜索记忆…" />
<Input value={text} onChange={(event) => setText(event.target.value)} icon={<IconSearchOutlineRegular size={13} />} />
```


### Textarea

多行输入：token 化边框与背景，尺寸由调用方给

```tsx
import { Textarea } from '../ui/textarea.tsx'

<Textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} />
```

props：`className`

### Tag

只读胶囊标签：八色调（outline/solid/neutral/quiet/success/info/warning/danger），data-tone 变体机制

```tsx
import { Tag } from '../ui/tag.tsx'

<Tag tone="success">已完成</Tag>
<Tag tone="danger">失败</Tag>
```

props：`tone` / `className` / `children`

### Pill

视觉胶囊指示器：active 高亮与可选交互语义

```tsx
import { Pill } from '../ui/pill.tsx'

<Pill active>激活</Pill>
<Pill onClick={() => set(!active)}>可点击</Pill>
```

props：`active` / `className` / `children`

### StateDot

状态圆点：done/pending/error 等语义态，done 带 check 图标

```tsx
import { StateDot } from '../ui/state-dot.tsx'

<StateDot state="done" />
<StateDot state="error" />
<StateDot state="ongoing" appearance="step" />
```

props：`state` / `size` / `className` / `appearance`

### Checkbox

受控复选框：原生 input 语义 + token 化外观

```tsx
import { Checkbox } from '../ui/checkbox.tsx'

<Checkbox checked={a} onChange={setA} label="启用自动整理" />
```

props：`checked` / `onChange` / `label` / `disabled` / `title` / `className` / `modalAutofocus`

### Switch

受控开关：role=switch + aria-checked（官方点名要保真的行为）

```tsx
import { Switch } from '../ui/switch.tsx'

<Switch checked={on} onChange={setOn} label="自动记忆" />
```

props：`checked` / `onChange` / `label` / `disabled` / `title` / `className`

### Icon

图标集（当前 5 个：database / warning / close / chevron-down / search），currentColor + aria-hidden

```tsx
import { IconDatabaseOutlineRegular } from '../ui/icons.tsx'

<IconDatabaseOutlineRegular size={16} />
{/* currentColor：颜色随容器，inline path 不依赖宿主 sprite */}
```

props：`size` / `className`

### ShortcutKeys

快捷键胶囊（⌘K 式按键展示）

```tsx
import { ShortcutKeys } from '../ui/shortcut-keys.tsx'

<ShortcutKeys keys={['⌘', 'K']} />
```


### CommandText

命令文本（kbd 风格的路径/命令展示）

```tsx
import { CommandText } from '../ui/command-text.tsx'

<CommandText text="/memory search" label="命令" />
```

props：`text` / `label` / `className`

### PathLabel

路径标签：目录前缀弱化 + 末段强调（path 工具内联自官方 workspace-path）

```tsx
import { PathLabel } from '../ui/path-label.tsx'

<PathLabel path="/workspace/demo/src/components/button.tsx" />
```

props：`path`

### TextShimmer

文本微光加载态（keyframes 动画）

```tsx
import { TextShimmer } from '../ui/text-shimmer.tsx'

<TextShimmer active>正在生成记忆摘要…</TextShimmer>
```

props：`children` / `active` / `className` / `contentClassName`

### Spinner

加载环：纯 CSS 旋转，尊重 prefers-reduced-motion（本仓自有，对齐 shadcn spinner）

```tsx
import { Spinner } from '../ui/spinner.tsx'

<Spinner size={16} />
```


### Skeleton

骨架屏：pulse 占位块（本仓自有，对齐 shadcn skeleton）

```tsx
import { Skeleton } from '../ui/skeleton.tsx'

<Skeleton style={{ width: 220, height: 12 }} />
```


### Avatar

头像：图片 + 首字母回退（本仓自有，对齐 shadcn avatar）

```tsx
import { Avatar } from '../ui/avatar.tsx'

<Avatar fallback="林" />
<Avatar src={badUrl} fallback="L" /> {/* 加载失败自动回退 */}
```


### Label

表单标签（本仓自有，对齐 shadcn label）

```tsx
import { Label } from '../ui/label.tsx'

<Label htmlFor="demo-input">记忆标题</Label>
```


### Separator

分隔线：横/竖两向，alias 边框色（本仓自有，对齐 shadcn separator）

```tsx
import { Separator } from '../ui/separator.tsx'

<Separator />
<Separator orientation="vertical" />
```


### AspectRatio

宽高比容器：子元素铺满 ratio 盒（本仓自有，对齐 shadcn aspect-ratio）

```tsx
import { AspectRatio } from '../ui/aspect-ratio.tsx'

<AspectRatio ratio={16 / 9}>内容铺满</AspectRatio>
```


### Progress

进度条：受控 value 与 indeterminate 滑动（本仓自有，对齐 shadcn progress）

```tsx
import { Progress } from '../ui/progress.tsx'

<Progress value={40} />
<Progress /> {/* indeterminate */}
```


## 容器与布局

### Card

卡片：Header/Title/Description/Content/Footer 复合（本仓自有，对齐 shadcn card）

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card.tsx'

<Card>…</Card>
```


### Alert

语义提示条：default/info/success/warning/danger 左边框变体（本仓自有，对齐 shadcn alert）

```tsx
import { Alert, AlertTitle, AlertDescription } from '../ui/alert.tsx'

<Alert variant="warning" icon={<IconWarningOutlineRegular size={15} />}>
  <AlertTitle>记忆写入被跳过</AlertTitle>
  <AlertDescription>该会话处于只读模式。</AlertDescription>
</Alert>
```


### Collapsible

折叠区：trigger + 展开收起动画（grid 高度过渡，内容常驻 DOM，收起态 inert；本仓自有，对齐 shadcn collapsible）

```tsx
import { Collapsible } from '../ui/collapsible.tsx'

<Collapsible trigger="高级选项" open={open} onOpenChange={setOpen}>
  内容
</Collapsible>
```


### Accordion

手风琴：single/multiple，grid-rows 高度动画（本仓自有，对齐 shadcn accordion）

```tsx
import { Accordion } from '../ui/accordion.tsx'

<Accordion type="single" items={[{ key, header, content }]} />
```


### ScrollArea

细滚动条容器：宿主 scrollbar token（本仓自有，对齐 shadcn scroll-area）

```tsx
import { ScrollArea } from '../ui/scroll-area.tsx'

<ScrollArea style={{ height: 120 }}>…</ScrollArea>
```


### Table

语义表格原语：Table/Header/Body/Row/Head/Cell/Caption（本仓自有，对齐 shadcn table）

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table.tsx'
```


### DataTable

轻数据表：列配置 + 表头排序（无表格库依赖）（本仓自有，对齐 shadcn data-table）

```tsx
import { DataTable } from '../ui/data-table.tsx'

<DataTable columns={[{ key: 'name', header: '任务' }, { key: 'count', header: '条数' }]} rows={rows} />
{/* 点表头排序，内置 asc/desc/清除 三态 */}
```


依赖：`table`（`add` 自动带上）

### Toggle

按下态按钮：aria-pressed，default/ghost 变体（本仓自有，对齐 shadcn toggle）

```tsx
import { Toggle } from '../ui/toggle.tsx'

<Toggle pressed={on} onPressedChange={setOn}>加粗</Toggle>
```


### ToggleGroup

切换组：single/multiple 按下态集合（本仓自有，对齐 shadcn toggle-group）

```tsx
import { ToggleGroup } from '../ui/toggle-group.tsx'

<ToggleGroup type="multiple" value={value} onValueChange={setValue}
  options={[{ value: 'memory', label: '记忆' }, { value: 'skills', label: '技能' }]} />
```


### Item

列表项卡片：Media/Content/Title/Description/Actions 复合（本仓自有，对齐 shadcn item）

```tsx
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from '../ui/item.tsx'
```


### Empty

空状态：Media/Title/Description/Content 复合（本仓自有，对齐 shadcn empty）

```tsx
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty.tsx'
```


### Field

表单字段壳：Label + 控件 + Description/Error（本仓自有，对齐 shadcn field）

```tsx
import { Field } from '../ui/field.tsx'

<Field name="title" label="标题" description="会显示在记忆列表">
  <Input />
</Field>
```


### ButtonGroup

按钮组容器（本仓自有，对齐 shadcn button-group）

```tsx
import { ButtonGroup } from '../ui/button-group.tsx'

<ButtonGroup>…按钮集合…</ButtonGroup>
```


### SegmentedControl

分段控制器（紧凑档 36px）：WAI-ARIA tabs 键盘走查（环绕、跳过 disabled）、roving tabindex、滑动指示器；段可 disabled（带 title 提示）。与 segmented-tabs 的分工：要禁用段或更小的体量用这个，纯筛选页签用 segmented-tabs

```tsx
import { SegmentedControl } from '../ui/segmented-control.tsx'

<SegmentedControl value={value} onChange={setValue}
  options={[{ value: 'memories', label: '记忆' }, …]} />
```


### SegmentedTabs

分段页签（标准档 42px，sm 34px）：Pill 组合的轻量 tabs，面板由调用方接线（显式 id/panelId）；无 disabled 段。与 segmented-control 的分工：筛选/视图切换的轻量页签用这个，要禁用段或更紧凑的用 segmented-control

```tsx
import { SegmentedTabs } from '../ui/segmented-tabs.tsx'

<SegmentedTabs items={[…]} value={value} onChange={setValue} />
```


依赖：`pill`（`add` 自动带上）

### Breadcrumb

面包屑：List/Item/Link/Page/Separator 复合（本仓自有，对齐 shadcn breadcrumb）

```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/breadcrumb.tsx'
```

props：`return`

### ConfigField

设置表单字段行：label + 控件排版

```tsx
import { ConfigField } from '../ui/config-field.tsx'

<ConfigField label="保留天数" value={value} secret={false} choices={[]}
  disabled={false} overridden invalid={false}
  labels={{ reset: '重置', inherited: '继承', invalid: '格式无效' }}
  onChange={setValue} onReset={() => {}} />
```

props：`label` / `value` / `secret` / `choices` / `disabled` / `overridden` / `invalid` / `labels` / `onChange` / `onReset`

### InlineEditor

行内编辑器：就地编辑的输入态

```tsx
import { InlineEditor } from '../ui/inline-editor.tsx'

<InlineEditor value={value} label="记忆内容" onChange={setValue}
  onSave={() => {}} onCancel={() => {}} />
```

props：`value` / `label` / `onChange` / `onSave` / `onCancel` / `className`

### DisclosureRow

折叠行：chevron 展开态与 shimmer 加载态

```tsx
import { DisclosureRow } from '../ui/disclosure-row.tsx'

<DisclosureRow icon={…} title="记忆条目" open={open} expandable
  onToggle={() => setOpen(!open)}>
  {/* 内容走 children，展开收起才有动画（issue 015） */}
  这里是折叠区内容
</DisclosureRow>
```

props：`icon` / `title` / `open` / `expandable` / `onToggle` / `running` / `expandOnRowClick` / `previewChevron` / `keepContentWhenOpen` / `collapsedContent` / `headerAccessory` / `children` / `className` / `rowClassName` / `contentClassName` / `contentLayoutClassName` / `leadingClassName` / `chevronClassName` / `titleClassName`

依赖：`text-shimmer` / `use-prefers-reduced-motion`（`add` 自动带上）

### FoldToggle

折叠开关按钮（纯逻辑，无样式文件）

```tsx
import { FoldToggle } from '../ui/fold-toggle.tsx'

<FoldToggle expanded={expanded} hidden={12} labels={{
  collapseAria: '收起', expandAria: (n) => '展开 ' + n + ' 行',
}} onToggle={() => set(!expanded)} />
```

props：`className` / `expanded` / `hidden` / `labels` / `onToggle`

### ConnectionIndicator

连接状态指示器：状态圆点 + 图标反馈

```tsx
import { ConnectionIndicator } from '../ui/connection-indicator.tsx'

<ConnectionIndicator state="connecting" …labels />
```

props：`state` / `disconnectedLabel` / `connectingLabel` / `recoveredLabel` / `reconnectActionLabel` / `restartActionLabel` / `onReconnect`

依赖：`state-dot`（`add` 自动带上）

### Sidebar

侧栏壳：Header/Content/Footer 三段 + 收起态（宽度过渡 + Context 下发给槽内内容，useSidebarCollapsed 感知）

```tsx
import { Sidebar, SidebarNav, useSidebarCollapsed } from '../ui/sidebar.tsx'

<Sidebar header={…} footer={…} collapsed={collapsed} onCollapsedChange={setCollapsed}>
  <SidebarNav label="助手导航" … />  {/* 收起态自动读 Context，不用再传 */}
</Sidebar>

// 槽内任意组件用 hook 感知收起态（shadcn useSidebar() 的对应物）：
const collapsed = useSidebarCollapsed() ?? false
```

props：`header` / `children` / `footer` / `collapsed` / `defaultCollapsed` / `onCollapsedChange` / `collapsedWidth` / `width` / `className`

### Resizable

双栏拖拽分割（水平）（本仓自有，对齐 shadcn resizable）

```tsx
import { Resizable } from '../ui/resizable.tsx'

<Resizable left={…} right={…} initialLeftPercent={50} />
```

props：`left` / `right` / `initialLeftPercent` / `minLeftPercent` / `maxLeftPercent` / `className`

## 浮层与反馈

### Modal

居中模态：portal 渲染、焦点陷阱、Escape 关闭、焦点归还、mask 点击关闭

```tsx
import { Modal } from '../ui/modal.tsx'

<Modal open={open} title="删除记忆" closeLabel="关闭" onClose={() => setOpen(false)}>…</Modal>

{/* rc.5 新增：tone='warning' —— 标题前加琥珀警告图标，标题与正文间距收紧 */}
<Modal open={warnOpen} title="连接已断开" tone="warning" closeLabel="关闭" onClose={() => setWarnOpen(false)}>…</Modal>

{/* portal + 焦点陷阱 + Escape + 焦点归还；只有最上层拥有 Escape */}
```

props：`open` / `onClose` / `title` / `tone` / `description` / `children` / `footer` / `className` / `contentClassName` / `shortcutModal` / `onKeyDownCapture` / `backdropBlur`

依赖：`modal-layer`（`add` 自动带上）

### RiskConfirmation

风险确认对话框：主操作在勾选确认前禁用，初始焦点落在勾选框

```tsx
import { RiskConfirmation } from '../ui/risk-confirmation.tsx'

<RiskConfirmation open={open} acknowledged={ack} onAcknowledgedChange={setAck}
  title="清空全部记忆" … />
```

props：`open` / `title` / `description` / `acknowledgeLabel` / `cancelLabel` / `closeLabel` / `confirmLabel` / `acknowledged` / `disabled` / `onAcknowledgedChange` / `onCancel` / `onConfirm`

依赖：`button` / `checkbox` / `modal`（`add` 自动带上）

### Tooltip

视口自适应 placement 的悬浮提示（官方点名要保真的行为组件之一）

```tsx
import { Tooltip } from '../ui/tooltip.tsx'

<Tooltip label="打开记忆面板" shortcutKeys={['⌘', 'M']} side="bottom">
  <Button variant="toolbar">悬停我</Button>
</Tooltip>
```

props：`ref` / `onPointerEnter` / `onPointerLeave` / `onPointerDown` / `onClick` / `onFocus` / `onBlur` / `useEffect` / `useDismissOnOutsidePointer` / `return`

依赖：`shortcut-keys` / `dismiss-on-outside-pointer`（`add` 自动带上）

### Popover

浮层面板：官方锚定钩子 + 外点关闭，body-portaled（本仓自有，对齐 shadcn popover）

```tsx
import { Popover } from '../ui/popover.tsx'

<Popover trigger={<Button variant="outline">点开</Button>}
  content={<div>任意内容</div>} />
```

props：`trigger` / `content` / `open` / `defaultOpen` / `onOpenChange` / `side` / `align` / `gap`

依赖：`anchored-position` / `dismiss-on-outside-pointer`（`add` 自动带上）

### HoverCard

悬浮卡：portal + 指针宽限 + 复制反馈（含 Group 上下文）

```tsx
import { HoverCard } from '../ui/hover-card.tsx'

<HoverCard anchor={<a href="#">助手</a>}
  copyText="助手" copyLabel="复制" copiedLabel="已复制"
  content={<div style={{ color: 'var(--dsw-alias-hovercard-label-primary)' }}>…</div>} />
```

props：`anchor` / `inline` / `fitContent` / `content` / `openDelayMs` / `disabled` / `grouped` / `variant` / `widthAnchorRef`

依赖：`pointer-grace` / `overlay-top-margin` / `clipboard`（`add` 自动带上）

### Toast

轻通知：portal 渲染的成功/失败反馈条

```tsx
import { Toast } from '../ui/toast.tsx'

{toast !== undefined && <Toast text={toast} tone="success" onDone={() => setToast(undefined)} />}
```

props：`text` / `icon` / `tone` / `anchor` / `holdMs` / `actions` / `onDone`

### Menu

带子菜单与键盘走查的菜单（依赖 useAnchoredPosition 等内部 hook，成本较高）

```tsx
import { Menu } from '../ui/menu.tsx'

<Menu open={open} anchor={<Button>打开菜单</Button>}
  items={[{ id: 'a', label: '重建索引' }, { type: 'separator', id: 's' }, …]}
  onSelect={…} onClose={() => setOpen(false)} />

{/* rc.5 起条目可带 submenu：悬停 / 聚焦 / 点击 / ArrowRight 打开 */}
<Menu items={[{ id: 'export', label: '导出', submenu: [{ id: 'md', label: 'Markdown' }] }]} />
```

props：`children` / `shortcut` / `icon` / `current` / `disabled` / `disabledReason` / `danger` / `separatorBefore` / `onSelect` / `open` / `contextual` / `isExternalTrigger` / `returnFocus` / `exiting` / `autoFocus` / `anchor` / `items` / `submenuBackLabel` / `footer` / `selectedId` / `selectedIds` / `onClose` / `align` / `side` / `portal` / `closeOnPointerLeave` / `dense` / `compact` / `selection` / `anchorRef` / `anchorPoint` / `minWidthFromAnchor` / `className` / `listClassName`

依赖：`modal-layer` / `pointer-grace` / `focus` / `keyboard-composition` / `shortcut-keys` / `tooltip`（`add` 自动带上）

### ContextMenu

右键菜单：官方 Menu 的 contextual 指针模式封装（本仓自有，对齐 shadcn context-menu）

```tsx
import { ContextMenu } from '../ui/context-menu.tsx'

<ContextMenu items={[…]} onSelect={…}>
  <div>在这个区域上右键</div>
</ContextMenu>
```

props：`items` / `onSelect` / `children` / `disabled`

依赖：`menu`（`add` 自动带上）

### Menubar

顶栏菜单：点击展开 + 悬停切换（本仓自有，对齐 shadcn menubar）

```tsx
import { Menubar } from '../ui/menubar.tsx'

<Menubar entries={[{ id: 'file', label: '文件', items: […] }, …]} />
```

props：`return`

依赖：`menu`（`add` 自动带上）

### NavigationMenu

顶部导航：链接 + 当前指示（下划线双模式：defaultCurrentId 非受控自迁移 / current 声明受控）+ 可选官方 Menu 下拉（简化版）（本仓自有，对齐 shadcn navigation-menu）

```tsx
import { NavigationMenu } from '../ui/navigation-menu.tsx'

<NavigationMenu defaultCurrentId="memories" onNavigate={(id) => …}
  items={[{ id, label, current?, children? }]} />
```

props：`items` / `onNavigate` / `defaultCurrentId` / `className`

依赖：`menu`（`add` 自动带上）

### Sheet

侧滑/底滑面板：portal + modal 层级栈；开合都有动画（相位状态机，见 issue 008）；可限定容器展开（container）；radius 可自定义（缺省 radius-panel，只圆内容侧两角，issue 026）；side bottom 即 drawer（本仓自有，对齐 shadcn sheet）

```tsx
import { Sheet } from '../ui/sheet.tsx'

<Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
  内容
</Sheet>
{/* 圆角可自定义（缺省 radius-panel 28px）；side="bottom" 即抽屉形态 */}
<Sheet open={smallOpen} onOpenChange={setSmallOpen} radius="var(--dsw-radius-lg)">…</Sheet>
```

props：`open` / `onOpenChange` / `side` / `title` / `footer` / `width` / `radius` / `container` / `children`

依赖：`modal-layer` / `use-prefers-reduced-motion`（`add` 自动带上）

### Pagination

分页：页码窗口 + ellipsis + 上下页（本仓自有，对齐 shadcn pagination）

```tsx
import { Pagination } from '../ui/pagination.tsx'

<Pagination page={page} totalPages={24} onPageChange={setPage} />
```

props：`page` / `totalPages` / `onPageChange` / `siblingCount` / `className`

## 输入进阶

### Select

原生 select 的 token 化外衣：保留原生语义与移动端 picker，外观对齐 Input

```tsx
import { Select } from '../ui/select.tsx'

<Select value={value} onChange={setValue}
  options={[{ value: 'all', label: '全部' }, …]} />
```

props：`options` / `className`

### Combobox

可输入过滤下拉：combobox/listbox 语义 + 键盘走查（本仓自有，对齐 shadcn combobox）

```tsx
import { Combobox } from '../ui/combobox.tsx'

<Combobox value={value} onValueChange={setValue} options={…}
  placeholder="输入以筛选…" />
```

props：`value` / `defaultValue` / `onValueChange` / `options` / `placeholder` / `emptyQueryShowsAll` / `disabled`

依赖：`anchored-position` / `dismiss-on-outside-pointer`（`add` 自动带上）

### Slider

滑杆：原生 range 的 token 化外衣（select 路线）（本仓自有，对齐 shadcn slider）

```tsx
import { Slider } from '../ui/slider.tsx'

<Slider value={value} onValueChange={setValue} min={0} max={100} />
```


### RadioGroup

单选组：原生 radio 语义 + 别名色圆点（本仓自有，对齐 shadcn radio-group）

```tsx
import { RadioGroup } from '../ui/radio-group.tsx'

<RadioGroup value={value} onValueChange={setValue} name="digest"
  options={[{ value: 'daily', label: '每天' }, …]} />
```


### InputOtp

验证码输入：单隐形 input + 格子可视化（本仓自有，对齐 shadcn input-otp）

```tsx
import { InputOtp } from '../ui/input-otp.tsx'

<InputOtp length={6} value={value} onChange={setValue}
  onComplete={(code) => console.log(code)} />
```

props：`length` / `value` / `defaultValue` / `onChange` / `onComplete` / `disabled` / `className` / `ariaLabel`

### Calendar

月历 / 年格：day 日历与 month 十二月模式，今日/选中态 + 禁用回调（本仓自有，对齐 shadcn calendar）

```tsx
import { Calendar } from '../ui/calendar.tsx'

<Calendar selected={selected} onSelect={setSelected} />
<Calendar mode="month" selected={month} onSelect={setMonth} />
```

props：`mode` / `selected` / `onSelect` / `month` / `defaultMonth` / `weekStartsOn` / `weekdayLabels` / `disabled` / `className`

### DatePicker

日期 / 月份选择：输入框 + Popover（day 值 YYYY-MM-DD，month 值 YYYY-MM；本仓自有，对齐 shadcn date-picker）

```tsx
import { DatePicker } from '../ui/date-picker.tsx'

<DatePicker value={value} onChange={setValue} placeholder="选择日期" />
<DatePicker mode="month" value={monthValue} onChange={setMonthValue} />
```

props：`mode` / `value` / `defaultValue` / `onChange` / `placeholder` / `disabled` / `className`

依赖：`calendar` / `popover`（`add` 自动带上）

### Form

表单语义壳：提交期 pending 态（字段壳见 field）（本仓自有，对齐 shadcn form）

```tsx
import { Form } from '../ui/form.tsx'

<Form onSubmit={async () => { … }} disableWhilePending>
  <Field …>控件</Field>
  <Button variant="primary">提交</Button>
</Form>
```


## 内容块

### JsonTree

JSON 树：折叠/复制/换行控制（官方 850 行保真复制）（内容块；官方源保真复制 + 零依赖轻量核心）

```tsx
import { JsonTree } from '../ui/json-tree.tsx'

<JsonTree data={payload} label="记忆条目" copyable expandTopLevel />
```

props：`collapsedStringLines` / `stringWrapping` / `field` / `initialExpanded` / `labels` / `lastElement` / `onClaimTabStop` / `onRowHover` / `path` / `renderCopy` / `tabStopId` / `value`

依赖：`menu`（`add` 自动带上）

### JsonBlock

折叠 JSON 块：大负载截断展示（官方保真复制）（内容块；官方源保真复制 + 零依赖轻量核心）

```tsx
import { JsonBlock } from '../ui/json-block.tsx'

<JsonBlock label="工具入参" payload={payload} defaultOpen />
```

props：`label` / `payload` / `defaultOpen` / `truncatedLabel`

### SearchBlock

搜索结果块：命中高亮 + 头尾截断 + 复制（内容块；官方源保真复制 + 零依赖轻量核心）

```tsx
import { SearchBlock } from '../ui/search-block.tsx'

<SearchBlock kind="matches" files={[…]} labels={labels} truncated={false} total={3} />
```


依赖：`clipboard-copy` / `head-tail-cap`（`add` 自动带上）

### CodeToolbar

代码卡工具栏：语言/复制/换行（语言名随高亮能力显示真实语言）（内容块；官方源保真复制）

```tsx
import { CodeToolbar } from '../ui/code-toolbar.tsx'

<CodeToolbar lang="typescript" labels={{ codeLabel: '代码', wrapLabel: '换行', unwrapLabel: '不换行' }}
  copyLabel="复制" copiedLabel="已复制" copied={copied} wrapped={wrapped}
  onCopy={…} onWrap={…} />
{/* 轻量替身：supportsHighlighting 恒 false，工具栏自动降级 */}
```

props：`lang` / `title` / `status` / `labels` / `copyLabel` / `copiedLabel` / `copied` / `wrapped` / `onCopy` / `onWrap`

依赖：`tooltip` / `code-highlighting`（`add` 自动带上）

### DiffBlock

差异块：npm diff 的 structuredPatch（Myers 算法）+ 本仓的编辑预算守卫，官方 markup（内容块；官方源保真复制）

```tsx
import { DiffBlock } from '../ui/diff-block.tsx'

<DiffBlock diffs={[{ path, oldText, newText }]} labels={labels} />
{/* hunk 内部走 mini-diff（LCS），超预算自动整段回退 */}
```

props：`diffs` / `labels` / `maxLines` / `className`

依赖：`code-toolbar` / `code-highlighting` / `fold-toggle` / `clipboard`（`add` 自动带上）

### TerminalBlock

终端输出块：官方 ansi.ts 保真复制（解析内核 npm anser），基础色落主题 token（内容块；官方源保真复制）

```tsx
import { TerminalBlock } from '../ui/terminal-block.tsx'

<TerminalBlock command="memory rebuild" cwd="/workspace/demo" exitCode={0}
  output="…ANSI 彩色输出（ansi-lite 解析）" />
```

props：`command` / `cwd` / `home` / `output` / `exitCode` / `signal` / `running` / `background` / `maxLines` / `copyText` / `runStateDot` / `className` / `labels`

依赖：`clipboard-copy` / `pill` / `state-dot` / `command-text` / `head-tail-cap`（`add` 自动带上）

### ImagePreview

图片预览：加载态与缩放呈现

```tsx
import { ImagePreview } from '../ui/image-preview.tsx'

<ImagePreview src={dataUri} alt="示例图" loadingLabel="加载中…" failedLabel="加载失败" />
```

props：`src` / `alt` / `loadingLabel` / `failedLabel`

### ImageLightbox

图片灯箱：portal 全屏预览

```tsx
import { ImageLightbox } from '../ui/image-lightbox.tsx'

<ImageLightbox src={src} alt="示例" labels={{ dialog: '图片预览', close: '关闭' }}
  onClose={() => setOpen(false)} />
```

props：`src` / `alt` / `labels` / `onClose` / `contextMenuProps`

### ZoomControls

缩放控制条：+/-/重置与缩放比菜单

```tsx
import { ZoomControls } from '../ui/zoom-controls.tsx'

<ZoomControls zoom={zoom} visible labels={labels} onZoom={setZoom}
  onActiveChange={() => {}} />
```


依赖：`button` / `menu` / `tooltip`（`add` 自动带上）

### MarkdownText

Markdown 渲染器：GFM（表格/任务列表/删除线）+ KaTeX 数学 + 代码块 + 脚注（settled 全量渲染，不做流式臂）

```tsx
import { MarkdownText } from '../ui/markdown-text.tsx'

<MarkdownText text={md} labels={labels} />
```


依赖：`code-block` / `code-toolbar` / `code-highlighting` / `hover-card` / `image-lightbox` / `image-preview`（`add` 自动带上）

### CodeBlock

代码块正文渲染：shiki 高亮 + 行号槽 + 复制头栏（官方 markup，流式臂不做）

```tsx
import { CodeBlock } from '../ui/code-block.tsx'

<CodeBlock code={code} lang="typescript" copyLabel="复制" copiedLabel="已复制" />

{/* rc.5 起 diff / patch 围栏自动走逐行渲染；也可显式 diff 强制 */}
<CodeBlock code={diffCode} lang="diff" copyLabel="复制" copiedLabel="已复制" />
```

props：`code` / `lang` / `diff` / `className` / `contentRef` / `lineNumbers` / `showHeader` / `copyLabel` / `copiedLabel` / `toolbarLabels` / `wrap`

依赖：`code-toolbar` / `code-highlighting` / `clipboard`（`add` 自动带上）

### QuotePreview

紧凑引文预览：裁剪时才弹 HoverCard（官方 markup）

```tsx
import { QuotePreview } from '../ui/quote-preview.tsx'

<QuotePreview text={longText} />

{/* rc.5 新增：summary 形态 —— 原文太长时用可读摘要代替，悬浮看详情 */}
<QuotePreview text={longText}
  summary={{ label: '引用', title: 'src/api/memory.ts', detail: '第 42-58 行', body: '拉取记忆流并把每条的摘要拼成一段文本。' }} />
```


依赖：`hover-card`（`add` 自动带上）

### ReadBlock

读文件结果卡片：行号槽 + 高亮 + 头尾折叠（官方 markup）

```tsx
import { ReadBlock } from '../ui/read-block.tsx'

<ReadBlock label="src/app.ts" lines={lines} totalLines={4} lang="typescript" labels={labels} />
```

props：`label` / `lines` / `labels` / `totalLines` / `lang` / `maxLines` / `className`

依赖：`code-toolbar` / `code-highlighting` / `fold-toggle` / `clipboard` / `markdown-text`（`add` 自动带上）

### DetailDocument

长 Markdown 描述区块：loading / 文档 / 失败重试（官方 markup）

```tsx
import { DetailDocument } from '../ui/detail-document.tsx'

<DetailDocument state={{ status: 'found', markdown: text }} labels={labels} onRetry={() => {}} />
```


依赖：`button` / `markdown-text` / `state-dot`（`add` 自动带上）

---

没有 demo 的条目（用法请直接读源码）：
`foundation` / `animated-rows` / `user-message-bubble` / `focus` / `use-prefers-reduced-motion` / `keyboard-composition` / `modal-layer` / `pointer-grace` / `overlay-top-margin` / `anchored-position` / `dismiss-on-outside-pointer` / `command` / `carousel` / `sidebar-nav` / `chart` / `clipboard` / `clipboard-copy` / `code-highlighting` / `head-tail-cap` / `web-block`
