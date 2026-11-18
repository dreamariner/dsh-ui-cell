# 交互契约（Agent 视角）

本篇讲**拖拽类组件**怎么写才对：指针跟手、松手收尾、百分比与渲染宽度对齐。
与 `spacing-motion.md` 是两件事：那一篇管空间与时间，这一篇管指针与布局。

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

## 四、消费端注意

拖拽条组件被复制进插件后，**容器的尺寸由消费端给**：
组件按百分比算，容器宽度变了要保证有确定值（否则百分比的分母是 0，拖动会跳）。
