---
id: 039
type: fix
title: select 弹出选项列表在深色主题下白底（Chromium 自绘弹层只认 color-scheme）
status: done
priority: P1
labels: [css, 消费端, 主题]
created: 2026-11-28
updated: 2026-11-28
assignee: lin
related: [038]
---

# 039 · fix · select 弹层深色主题白底

## 发现（dsh-notify 消费端 Windows 实测）

dsh-notify 的配置面板用本仓 select 做提示音下拉。Windows 深色主题下，收拢状态的
控件外观正常（token 化外衣在工作），**展开后的选项列表却是白底黑字**，与深色面板
格格不入。macOS 上从未显形。

## 根因

展开后的选项列表**不是页面 DOM**，是 Chromium 自绘的弹层，页面 CSS 够不到它；
它的配色只认 select 元素的 **used `color-scheme`**。本仓 select.css 没声明
`color-scheme`，Chromium 按 light 处理，于是深色主题下弹层白底。

macOS 的弹层走系统 NSMenu、跟随系统外观，深色系统天然深色，掩盖了问题；
Windows 的弹层由 Chromium 自己画，才把「没人声明 color-scheme」显形出来。

宿主自己的 CSS（ui-theme 的 design-platform.css）也没设 `color-scheme`：
宿主全部用自绘菜单（Menu / SegmentedControl），从不展开原生 select，撞不到这个问题。
第三方插件一用原生 `<select>` 就撞上了。

## 修法

`src/select.css` 显式声明，弹层跟随宿主主题（与面板同源，而不是跟随系统）：

```css
.select { color-scheme: light; }
body[data-ds-dark-theme] .select { color-scheme: dark; }
```

- 亮色显式 `light`：不依赖浏览器默认，防止宿主祖先层未来设了别的值。
- 深色挂 `body[data-ds-dark-theme]`：宿主 ui-theme 的主题开关就是往 body 上写
  这个属性（shiki.css 同款机制），弹层配色与 token 换肤同源；应用内主题切换
  立即生效，不必重启。
- 纯属性选择器，不含外部类名，CSS Modules 与复制件的纯 CSS 两种管道都合法，
  无需 `:global` 外壳（038 的教训不涉及）。

## 消费端动作

`add --force select` 重新复制（css 变了，tsx 未动）。

## 护栏

registry.spec.ts 对 select.css 的 `28px` 锚不受影响；color-scheme 是普通属性声明，
不涉及选择器合法性，无新增护栏必要。
