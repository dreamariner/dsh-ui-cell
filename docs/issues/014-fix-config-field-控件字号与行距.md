---
id: 014
type: fix
title: ConfigField 控件字号归主题档位、按钮不再撑高头行、下拉箭头换 DSH chevron
status: done
priority: P2
labels: [排版, 字号, 官方复制件偏离, 护栏]
created: 2026-11-18
updated: 2026-11-18
assignee: lin
related: [012, 013]
---

# 014 · fix · ConfigField 的控件字号与行距

## 背景

文档站上看到 ConfigField 一行「保留天数 + 重置 + 下拉」的观感不对：控件比标题大一号，
标签到控件的距离比样式里写的要大，下拉箭头贴着右边框。

现场量出来的（文档站，DSH 0.2.2-rc.1 token）：

| 项 | 实测 | 应然 |
|---|---|---|
| label 字号 | 13px（上游显式写死） | 13px（详情档） |
| select 字号 | **16px** | 14px（标准档，控件正文） |
| 「重置」按钮字号 | **16px** | 13px（与 label 同级） |
| 头行高度 | **25px**（按钮行高撑的） | 20px（label 的行高） |
| label 底 → select 顶 | **9px** | 6px（CSS 里写的 gap） |
| select 高度 | 38px | 32px（与其他控件同档） |

## 根因

### 一、控件字号跟着宿主走

上游 `ConfigField.module.css` 写的是 `font: inherit`。而 DSH 应用与文档站的 body
**都没有显式字号**（浏览器默认 16px），于是：

- 同一行里，label 是显式 13px、控件却是继承来的 16px → **控件比标题大一号**
- 组件的大小取决于嵌入它的宿主 → 同一个组件在不同宿主里长得不一样

这不是文档站的渲染偏差，DSH 应用里也是这样。

### 二、按钮的 UA padding 撑高头行

`.head button` 只写了 `font: inherit`，没清 UA 的 `padding: 1px 6px`。
按钮行高 25px、label 行高 18.5px，头行按高的算 → `.field` 的 `gap: 6px` 之外
又多出 3px，标签到控件的实际距离变成 9px。**间距写在 CSS 里，却不由 CSS 决定**。

### 三、原生下拉箭头贴边

`.field select` 的右内边距只有 12px，而浏览器自绘的箭头离右边框约 12px，
长文案会顶到箭头上。

实测过：**Chromium 的原生箭头不随 `padding-right` 移动**（A/B 对照：右内边距 12px 与
28px 两档，箭头位置完全一致）。CSS 挪不动它，只有换自定义图标（改 DOM）一条路。

## 方案（本仓侧偏离上游，DOM 与行为不动）

改 `src/config-field.css` 三处：

1. **控件字号归主题档位**：`.field input, .field select, .field textarea` 的
   `font: inherit` → `font: var(--dsw-font-s-14)`（14px/22px）。
   比 label 大 1px，层级是「标题次要、控件正文」，且不随宿主漂移。
2. **按钮不再撑高头行**：`.head button` 的 `font: inherit` → `font: var(--dsw-font-xs-13)`
   （与 label 同级）+ `padding: 0`（去 UA padding）。头行高度回到 label 的行高，
   间距就是 CSS 里写的那个数。
3. **下拉箭头换成 DSH chevron**（复审后定稿，见下节）：`appearance: none` 收掉自绘箭头，
   右侧挂 `IconChevronDownOutlineRegular`。

偏离登记：registry 的 `config-field` 条目 `upstream` 字段写明本仓侧改动，
DSH 升级逐组件 re-diff 时保留这几处（上游原文件仍是 `font: inherit` / `padding: 6px 12px`，
select 也是裸的，没有包裹层）。

## 复审补记：箭头换成 DSH chevron（2026-11-18，同一 issue 的第二轮）

第一轮把字号与行距修好之后，复审发现箭头仍然是「没处理好」的那一处。问题不在位置，
在**样式**：

| 现象 | 原因 |
|---|---|
| 箭头粗黑、比文字还重 | 浏览器自绘的箭头**不随字号缩放**（控件归到 14px 档之后，它显得更大更重） |
| 与整个组件库对不上 | 本仓其它地方的展开/下拉指示都是 DSH 细线 chevron（1px 描边、tertiary 色）：Select / Accordion / Collapsible / DisclosureRow |
| CSS 挪不动 | 实测 Chromium 的原生箭头**不随 `padding-right` 移动**（12px 与 28px 两档位置完全一致） |

于是按本仓自有 Select 的同一套做法改掉（DOM 多一层包裹）：

```
<span class="…-selectWrap">
  <select>…</select>
  <span class="…-selectChevron" aria-hidden="true"><IconChevronDownOutlineRegular size={14} /></span>
</span>
```

- `appearance: none` 收掉浏览器自绘箭头；
- chevron 离右边框 12px（与文字的左内边距对称），右内边距 32px
  = 12（chevron 偏移）+ 14（图标）+ 6（图标与文字的间隔），与 Select 的构成一致；
- 颜色走 `--dsw-alias-label-tertiary`，1px 描边，与全库chevron 同款；
- `config-field` 条目新增依赖 `icon`（add 时随闭包复制）。

顺带修掉一个此前没注意的不一致：原生 select 自带一套内部高度算式（31.5px），
与同一行里的文本 input（35px）差 3.5px；换成 `appearance: none` 后两者都是 35px
（22 行高 + 12 内边距 + 1 描边），**同一字段里的控件等高**了。

### 护栏

新增一条：**本仓的原生 select 一律要收掉浏览器自绘箭头**
（`tests/registry.spec.ts`，扫 `src/` 里所有 CSS：文件里提到 `select` 就必须有
`appearance: none`）。自绘箭头跟字号脱钩这件事 CSS 改不动，只能在源头挡住。

## 连带：把这类毛病变成规则与护栏

- **规则**（`docs/wiki/04-间距与动效规范.md`）：组件的文字不许跟随宿主字号，
  必须钉在主题的字体档位；成对出现的「标签 + 控件」尤其要同档。
- **护栏**（`tests/registry.spec.ts`）：自有件不得出现 `font: inherit`
  （官方复制件不在此列：markdown / code / json 这类内容块跟随宿主文字大小是有意为之）。
  顺带把 `data-table` 的 `.sortButton` 从 `font: inherit` 改成显式
  `font: var(--dsw-font-s-14)`（实际取值相同，14px → 14px）。

## 结果

| 项 | 修前 | 修后 |
|---|---|---|
| select 字号 / 高度 | 16px / 38px | 14px / 35px（与同字段的文本控件等高） |
| 按钮字号 / 头行高度 | 16px / 25px | 13px / 20px |
| label 底 → select 顶 | 9px | 7px（6px gap + 1px 降部） |
| select 内边距 | 6px 12px | 6px 32px 6px 12px（32 = 12 偏移 + 14 图标 + 6 间隔） |
| 下拉箭头 | 浏览器自绘（粗黑、贴边、挪不动） | DSH chevron（14px 细线、tertiary 色、离边 12px） |

实机核对（文档站，DSH 0.2.2-rc.1 token）：label 与「重置」同级、控件 35px 高，
chevron 14px / 1px 描边 / `rgb(129,133,140)`（tertiary），离右边框 12px、垂直居中。
`pnpm test` 82 通过 1 跳过（含新增的 `font: inherit` 护栏）。

## 待办

- 消费端要吃到这处修正需 `add --force` 重新复制 config-field（现在会连带复制 `icon`，
  闭包是 foundation → icon → config-field）
- 官方其余复制件里 `font: inherit` 的地方（toast / markdown 家族 / code-block /
  json-tree / search-block / diff-block / terminal-block / read-block / quote-preview）
  都是内容块，随宿主文字大小是有意为之，本 issue 不动
