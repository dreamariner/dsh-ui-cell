# 交互契约（Agent 视角）

本篇讲**交互状态**怎么写才对：拖拽类的指针跟手与松手收尾、多个状态
（悬停 / 选中 / 禁用）并存时的选择器特异性，以及层级菜单（子菜单）的打开与收尾。
与 `spacing-motion.md` 是两件事：那一篇管空间与时间，这一篇管指针与状态。

官方保真复制件不在此列：它们保真跟随上游 DSH，本仓不改。

## 一、拖拽的三条契约

### 1. 拖动要跟手：百分比按「分隔条中心对准光标」反解

拖拽条本身有宽度，光标落在条上时，**条的中心**比条的左边缘靠右半个条宽。
按左边缘算，条与光标之间永远差半个条宽（5px 的条就是 2.5px 的固定偏移）。

```tsx
// ✅ 分隔条中心正对光标
const dividerWidth = dividerRef.current?.getBoundingClientRect().width ?? 0
const leftWidth = event.clientX - rect.left - dividerWidth / 2
const percent = (leftWidth / rect.width) * 100
```

分母用**容器宽**：CSS 里 `flex-basis: 45%` 的百分比是按容器宽算的，不是按两栏之间
的轨道宽算（轨道要减掉分隔条）。分子减半个条宽，分母用容器宽 —— 两者配套才对得上。

### 2. 百分比必须等于渲染出来的宽度

`flex-basis: 45%` 配上 `flex: 1 1 0`（grow = 1）时，剩余空间会被**两栏按比例分**，
左栏实际拿到 45% + 27.5% = 72.5%。于是「状态 45%」不代表渲染出来的 45%，
拖动时每一步都在错的基础上再错一点，越拖越偏。

```css
/* ❌ 百分比失真 */
.pane { flex: 1 1 0; }

/* ✅ 左栏不吃 grow，右栏吃剩下的空间 */
.pane { flex: 1 1 0; }                    /* 右栏 */
.pane[data-side='left'] { flex-grow: 0; flex-shrink: 0; }  /* 左栏：宽度由 inline style 给 */
```

### 3. 松手必须收尾，三路兜底

拖拽状态没收掉 = 之后每次移动鼠标都在改布局 = 极易误触。

| 收尾信号 | 什么时候来 | 为什么要有 |
|---|---|---|
| `pointerup` | 正常松手 | 基本盘 |
| **指针捕获**（`setPointerCapture`） | 按下时 | 光标移出拖拽条、甚至移出浏览器窗口，事件仍然送到它 → **在窗口外松手也收得到** |
| `pointercancel` | 浏览器把手势抢走（原生拖拽、滚动竞争） | 抢走时不会有 pointerup |
| 窗口 `blur` | 切标签页、弹系统框 | 页面收不到 pointerup 时的最后一道兜底 |

```tsx
const onPointerDown = (event) => {
  event.preventDefault()          // 别在拖动时选中文本，也别触发原生拖拽
  event.currentTarget.setPointerCapture(event.pointerId)   // ← 关键
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}
```

收尾时三样都要还原：`cursor`、`userSelect`、拖动标记。**组件在拖动中被卸载**也要还原
（`useEffect` 的 cleanup）。

## 二、拖拽条的其它细节

- **触摸设备**：`touch-action: none`（否则浏览器把手势吃掉当滚动）。
- **可访问值**：`role="separator"` 配 `aria-valuenow` / `aria-valuemin` / `aria-valuemax`。
- **命中区**：视觉是一条 1px 线，命中区可以更宽（线居中，命中区左右各留几像素）。
- **别用 `window` 上的全局 pointermove 兜底**：全局监听收不干净（见上面第 3 条），
  用指针捕获，事件跟着元素走。

## 三、别用 state 记「正在拖」

拖动标记（ref）与「正在拖」状态（要不要渲染拖动态）是两回事：

- **标记用 ref**：`pointermove` 回调读的是当下的值，等 state 提交就晚了。
- **状态用 state**：只有真要渲染出不同的样子（比如拖动时高亮）才需要。

## 四、多个状态并存：悬停不能盖住选中

同一个元素上同时有「悬停」与「选中」两套样式时，**光标还停在元素上**，
悬停态就会盖住选中态。用户看到的不是「选中」，是「点完闪一下」。

根因是**特异性打架**（数字是选择器权重：类 / 伪类 / 属性各算一档）：

```css
.cell:hover:not(:disabled)          { background: hover; }  /* (0,3,0) */
.cell[data-selected]                { background: brand; }  /* (0,2,0) */
```

`:hover:not(:disabled)` 权重高于 `[data-selected]`，于是点中之后（鼠标没移开）
底色换成悬停色，但选中态的文字色还留着 → 白字压浅灰底，整格像被洗白；
鼠标一移开又「啪」地变回实心选中。

处置：**悬停规则显式排除选中态**，别指望权重压过去：

```css
/* ✅ */
.cell:hover:not(:disabled):not([data-selected])      { background: hover; }
.monthCell:hover:not(:disabled):not([data-selected]) { background: hover; }
```

同类坑还有「禁用态被悬停盖掉」，一并用 `:not(:disabled)` 排除。
写完对照一下：每套状态样式里，配色（底色与文字色）要成对切换，只换底色就会
留下「白字压浅底」这种脏中间态。

## 五、层级菜单：子菜单的打开与收尾（rc.5 起的菜单族）

上游 rc.5 把菜单族重写了，本仓同步。**消费者自写菜单族组件时照这套做**：

| 交互 | 规则 |
|---|---|
| 打开子菜单 | **悬停、聚焦、点击、ArrowRight** 四条路径都能开（只做悬停 = 键盘用户进不去） |
| 返回父级 | **ArrowLeft** 回到父级菜单，不是直接关整个菜单 |
| Escape | **先关子菜单**，子菜单不在了才关父级（层级栈的规矩，与 Modal 的层级栈同源） |
| 焦点 | 打开子菜单后焦点跟着进子菜单；关闭后焦点回到父级的那一行 |
| 定位 | 子菜单走 **body portal**（不挂在父菜单的 DOM 里 → 不会被父级容器的 `overflow` 裁掉） |
| 定位算法 | 用 **CSS anchor 定位**（`anchor-name` / `position-anchor`），不要用 JS 测量 —— 测量方案在滚动与缩放下会漂 |

子菜单挂在 body 上意味着**样式作用域变了**：子菜单的样式不能依赖父菜单容器的类名或
`overflow`，也不能靠父级上下文变量传值（portal 会切断 DOM 继承）。

## 六、消费端注意

拖拽条组件被复制进插件后，**容器的尺寸由消费端给**：
组件按百分比算，容器宽度变了要保证有确定值（否则百分比的分母是 0，拖动会跳）。
