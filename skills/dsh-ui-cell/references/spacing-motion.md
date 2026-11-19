# 间距与动效（Agent 视角）

本篇讲**在本仓自有组件**里写样式时的空间（间距刻度、圆角档位、发丝线）与
时间（动效档位、降级、进出场）规则，以及消费端接线时必须做的一件事。
官方保真复制件不在此列：它们保真跟随上游 DSH，本仓不改。

## 一、官方分工（先认清边界，别越界）

- **动效归 `ui-theme` 持有**：官方只有四个 token，
  `--ds-transition-duration`（200ms）/ `--ds-transition-duration-fast`（100ms）/
  `--ds-transition-duration-slow`（300ms）/ `--ds-ease-in-out`。
  本仓**不新增任何全局动效变量**，自有件只许用这四个。
- **间距数值刻度官方不给**：官方 spacing 参考末句写明 *This skill defines no numeric scale*，
  数值归实现方。本仓作为第三方插件组件的实现方，在 `foundation.css` 定义了 `--dsh-space-*`。
- **间距的语义（组内外关系）归官方**：没有显式分隔线时，组间距必须明显大于组内间距；
  标题更靠近自己那组的内容。本仓不重复官方规则正文，只管数值。

## 二、间距

### 刻度（4px 底座，2px 半步）

| 变量 | 值 | 语义角色 |
|---|---|---|
| `--dsh-space-1` | 1px | 发丝级缝隙 |
| `--dsh-space-2` | 2px | 图标与文字、极紧组内 |
| `--dsh-space-4` | 4px | 组内元素（紧） |
| `--dsh-space-6` | 6px | 组内元素（中）、控件内紧凑留白 |
| `--dsh-space-8` | 8px | 控件内边距、卡片内边距 |
| `--dsh-space-12` | 12px | 块内边距 |
| `--dsh-space-16` | 16px | 区块之间 |
| `--dsh-space-20` | 20px | 大块内边距 |
| `--dsh-space-24` | 24px | 区块分隔 |
| `--dsh-space-32` | 32px | 大留白 |

`0` 不进刻度（`margin: 0` 保持字面量）。`0.5px` 是发丝补偿（`margin-left: -0.5px`），保持字面量。

### 写法

```css
/* 对 */
.card { padding: var(--dsh-space-8) var(--dsh-space-12); gap: var(--dsh-space-6); }

/* 错（护栏会红） */
.card { padding: 8px 12px; gap: 6px; }
```

### 组合值例外

缩进、让位这类**由图标尺寸与偏移推导出来**的值不归一，但要在 `tests/registry.spec.ts` 的
`SPACING_COMPOSED` 登记并写明构成：

```css
/* 左内边距是组合值：8（触发器左内边距）+ 14（chevron）+ 6（间隔），
   保证内容与触发器文字对齐，是关系不是节奏，故不归一到刻度（issue 012 的组合值例外）。 */
.content { padding: 0 var(--dsh-space-8) var(--dsh-space-8) 28px; }
```

改了构成项，缩进要同步改，否则对齐关系断了。

## 三、圆角与发丝线

### 圆角档位：按「组件的体量」选，不按好看选

主题的 radius 家族在官方 `ui-theme/src/styles/base.css`（两套主题同值，不随换肤变）：

| token | 值 | 谁在用 |
|---|---|---|
| `--dsw-radius-xs` | 4px | 小色块 |
| `--dsw-radius-sm` | 8px | 胶囊 / 面包屑 / 小控件 |
| `--dsw-radius-md` | 12px | **控件与内容块的默认档**（input / button / select / menu / alert / item / skeleton） |
| `--dsw-radius-lg` | 16px | **卡片与浮层**（本仓 card / hover-card / toast） |
| `--dsw-radius-xl` | 20px | 上游的设置分区 |
| `--dsw-radius-panel` | 28px | **模态框与浮层面板**（上游 Modal / SettingsRoot；本仓 modal） |

口径：**`radius-panel` 只给「浮到内容之上」的面板**，内容容器用 `lg`。
卡片用 panel 档会显得突兀（28px 在一张 320px 宽的卡片上，圆角占了整卡的九分之一）。
浮层面板要能改档时（如小屏抽屉嫌 28px 大），给组件加 `radius` 属性按侧边只圆
「靠内容侧」两角，贴边侧保持直角（贴边侧圆角会破坏「从屏幕边缘长出来」的几何语义）。

### 发丝线：0.5px 只配大面积，小控件一律 ≥1px

`0.5px` 的横边**在设备像素对齐上会被整段吞掉**：格子的布局 Y 落在分数像素上时，
0.5px 横线分摊到两行设备像素各 ~25-50% 透明度，横段直接不可见（竖边恰好落在整数
X 上就正常画，于是「竖边在、横边断」，看着像边框没闭合）。滚动位置一变，分数部分
跟着挪，就成了「时而闭合时而断开」的抽签。

- 大面积面板 / 卡片的横边断一两个像素肉眼不可见 → `0.5px` 可以
- **小而高对比的控件（OTP 格子这类 32px 级）→ 边框一律 ≥1px**，
  无论落在哪个分数像素都至少盖满一行设备像素

## 四、动效

### 三档映射

| 交互类型 | 用哪档 |
|---|---|
| 即时反馈：悬停、按下、聚焦、选中、数据到达 | `var(--ds-transition-duration-fast)` |
| 状态切换：展开收起、显隐、开关 | `var(--ds-transition-duration)` |
| 大面积位移：面板进出 | `var(--ds-transition-duration-slow)` |

缓动统一 `var(--ds-ease-in-out)`。

```css
/* 对 */
.chevron { transition: transform var(--ds-transition-duration) var(--ds-ease-in-out); }

/* 错（护栏会红） */
.chevron { transition: transform 150ms ease; }
```

### 循环节律豁免

呼吸 / 旋转 / 闪烁这类 `infinite` 动画不是交互时长，可以写字面时长
（`700ms linear infinite`、`1s steps(2) infinite`），但**必须**配 reduced-motion 降级。

### 可动属性

默认只许动 `transform` / `opacity` / `color` / `background-color` / `border-color`。
`width`、`grid-template-rows` 这类逐帧触发布局的属性要登记例外：
**要动布局就别用 transition 改尺寸，改用 transform**。

### 降级

带动画的组件必须有 `prefers-reduced-motion: reduce` 块，护栏会查：

```css
@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}
```

### 进出场动画

出场动画要播完才卸载 DOM，照相位状态机做（sheet 与 disclosure-row 两个样板）：
`mounted` 与 `phase`（`data-state`）分开管，关闭时 `phase='closed'` → DOM 留着播动画 →
`animationend` 才卸载；相位切换必须在渲染期做（不能在 effect 里，否则 `useModalLayer`
的层级栈不注册，Escape 关不掉）；降级时直接卸载（信号来自共享条目
`use-prefers-reduced-motion`），出场段另有定时器兜底。
展开收起的高度用 `grid-template-rows: 0fr → 1fr`（与本仓自有 Accordion 同一手法）。

**「动画没了」有两种，别混**：

| 情形 | 信号来源 | 组件的反应 |
|---|---|---|
| 系统开了「减少动态效果」 | `usePrefersReducedMotion()` 读到 `true` | 跳过动画，直接卸载 |
| **样式把动画关掉了**（消费端自己写了 `* { animation: none }`，或动画样式没注入） | 组件侧**读不到**（hook 只看系统开关） | 走动画路径，但 `animationend` 永不触发 → 靠兜底定时器收尾（disclosure-row 400ms / sheet 800ms） |

第二种是消费端能踩到的坑：面板关掉后要赖 400 到 800ms 才消失（期间无动画、无报错）。
组件侧已经把兜底做掉了，但**消费端若要全局关动画，请一并把
`prefers-reduced-motion` 的媒体查询块也写上**（或干脆别关，交给系统的
`prefers-reduced-motion` 降级处理，那条路径组件认）。

## 五、字号与控件让位（间距的另一半）

行距看着不对时，先查字号，不是先改间距：

- **组件的文字不许跟随宿主字号**：不写 `font: inherit`，钉在主题档位
  （`var(--dsw-font-s-14)` / `var(--dsw-font-xs-13)`）。宿主（DSH 应用与文档站）
  的 body 都没有显式字号，继承来的是浏览器默认 16px，控件会比 13px 的标签大一号。
  官方内容块（markdown / code / json）跟随宿主是有意为之，不在此列。
- **成对的「标签 + 控件」要同档**：标签 13px（详情档）、控件 14px（标准档）。
- **按钮的 UA padding 要清**：`padding: 0` 加显式字体档，否则 UA 的 `padding: 1px 6px`
  撑高行高，`gap` 之外又多出几像素。
- **原生 select 的自绘箭头要换掉**：浏览器画的箭头不随字号缩放（控件归到 14px 档后它
  显得比文字还重）、颜色纯黑。实测 Chromium 的原生箭头**不随 `padding-right` 移动**
  （12px 与 28px 两档位置一致），CSS 挪不动它，只能换图标：`appearance: none` 收掉
  自绘箭头，右侧挂 DSH chevron（14px 细线、`--dsw-alias-label-tertiary` 色），
  几何照本仓自有 Select：图标离右边框 12px，右内边距 = 偏移 + 14（图标）+ 6（间隔）。
  需要一层 DOM 包裹来放图标（官方复制件要登记偏离）。

## 六、消费端：foundation 必须第一个注入

`add` 会自动带上基础层 `foundation-css.ts`（间距刻度）并排在注入顺序第一位。
消费端拼样式时必须把它放最前：

```ts
import { styles as foundationCss } from '../ui/foundation-css.ts'
import { styles as buttonCss } from '../ui/button-css.ts'

export const PANEL_CSS = [foundationCss, buttonCss].join('\n')
```

漏了它：组件里的 `var(--dsh-space-8)` 解析失败 → 那条声明被静默丢弃 →
**间距全没了，但零报错**。这是最隐蔽的一类失败，症状是「控件挤成一团但没有任何报错」。
