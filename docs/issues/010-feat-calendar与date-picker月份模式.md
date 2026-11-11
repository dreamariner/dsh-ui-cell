---
id: 010
type: feat
title: calendar / date-picker 月份模式（mode='month'：年格 + YYYY-MM 值）+ fromIso 正则修复
status: doing
priority: P1
labels: [calendar, date-picker, 组件行为, 护栏]
created: 2026-11-11
updated: 2026-11-11
assignee: lin
related: [002, 005]
---

# 010 · feat · calendar / date-picker 月份模式 + fromIso 正则修复

## 背景

消费端（dsh-ledger 家庭资金规划）的账期选择器需要选「月」不选「日」：账期锚点是每月 10 日，
用户心智里选的是 `2026-11` 这个月份。此前消费端用「年 + 月两个 select」拼装，能办事但绕过了
kit；kit 里 date-picker 只有日粒度，registry 94 原子里没有月份选择。

实现期间另发现一处存量 bug：

- `date-picker.tsx` 的 `fromIso` 正则写成 `/^(d{4})-(d{2})-(d{2})$/`（`\d` 丢了反斜杠），
  实际只能匹配字面 `dddd-dd-dd`，**受控值的选中态永远解析不出来**（选中日在月历上不高亮）；
- 导航「下一个月 / 下一年」的箭头图标漏了旋转：两个导航钮都用向下雪佛龙，
  prev 靠 `rotate(90deg)` 转向左，next 没挂任何旋转类，显示成向下（实机验收发现）。
  补 `.chevronLeft { rotate(-90deg) }` 挂到 next；
- 触发按钮被 `disabled={disabled !== undefined}` 误禁：`disabled` 的契约是日期谓词，
  传了谓词（做范围夹取的正常用法）整个触发器就点不开，弹层永远出不来。去掉该门控，
  谓词只作用于月历内的日期/月份格。

## 目标

1. `Calendar` 增 `mode?: 'day' | 'month'`（缺省 day，完全向后兼容）：
   - month 模式渲染 12 个月格（3 列 × 4 行），头部只显示年份，‹ › 按年翻；
   - `onSelect` 收到该月 1 日的 Date（年月有意义，日恒为 1）；
   - `disabled` 回调在 month 模式下收到该月 1 日的 Date；
   - 选中态 / 今日态按年月比较；`aria-label` 随模式（上一年 / 下一年）。
2. `DatePicker` 增 `mode?: 'day' | 'month'`：
   - day 值 `YYYY-MM-DD`（不变）；month 值 `YYYY-MM`；
   - month 模式缺省占位「选择月份」（day 模式「选择日期」不变）；
3. 修复 `fromIso` 正则（`\d`）、触发按钮误禁、next 导航箭头向下三处存量问题。
4. 测试钉住：month 模式的 12 格渲染 / 年月选择回调 / disabled / 年翻页；fromIso 修复回归
   （受控值选中态高亮）。

## 方案

- Calendar 内部状态本就是「某月 1 日」的 Date，month 模式复用：翻页步长 ×12，头部只出年份；
- 值域约定写进 props 注释：month 模式下 selected / defaultMonth / onSelect / disabled 的
  Date 只看年月（日部分恒为 1）；
- 月格文案沿用组件内既有中文形态（`{n} 月`，与头部 `{year} 年 {month} 月` 同源；星期几本就
  可经 weekdayLabels 覆盖），kit 无宿主 locale 系统，不引入 Intl 依赖；
- date-picker 的 fromIso 修为 `\d` 并按 mode 分流解析 / 序列化。

## 影响面

- `src/calendar.tsx` / `src/calendar.css`（月格样式，复用 cell 的状态色 token）
- `src/date-picker.tsx`（mode 分流 + 正则修复）
- `registry.json`：calendar / date-picker 描述补「含月份模式」
- `tests/calendar.spec.tsx`（新增）
- 版本 0.3.1 → 0.4.0（feat）

## 验收标准

- [ ] day 模式行为不变（现有消费方零感知）
- [ ] month 模式：12 格、点选回调 `YYYY-MM`（月 1 日 Date）、disabled 生效、年翻页正确（跨年）
- [ ] 受控值（day / month）都能正确高亮选中（fromIso 修复回归）
- [ ] 传 disabled 谓词时触发器仍可打开（误禁修复回归）
- [ ] `pnpm typecheck` 0 错；`pnpm test` 全绿；`pnpm build` 通过
