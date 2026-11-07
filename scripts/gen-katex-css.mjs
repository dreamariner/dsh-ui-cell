#!/usr/bin/env node
// gen-katex-css.mjs — 生成 src/katex-css.ts（KaTeX 样式文本 + CDN 字体 URL）。
//
// 背景（2026-11-06，issue 005）：DSH 官方 ui-primitives 的 markdown/MarkdownText.tsx
// 直接 `import 'katex/dist/katex.min.css'`。第三方插件的 client 构建**没有 CSS 管线**
// （官方 clientBundle 预设对外插件不可用），样式只能走运行时 <style> 注入，
// 故把 KaTeX 的 CSS 文本随组件带过来。
//
// 字体：@font-face 的 url 指向 jsdelivr CDN（锁 katex 版本）。相对路径在运行时注入的
// <style> 里没有 base 可依；离线环境公式会降级（无字体），但结构仍可读。
//
// 用法：node scripts/gen-katex-css.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'katex', 'package.json'), 'utf8'))
let css = readFileSync(join(ROOT, 'node_modules', 'katex', 'dist', 'katex.min.css'), 'utf8')

const count = (css.match(/url\(fonts\//g) ?? []).length
css = css.replace(
  /url\(fonts\/([^)]+)\)/g,
  (_all, file) => `url(https://cdn.jsdelivr.net/npm/katex@${pkg.version}/dist/fonts/${file})`,
)

const header = `// katex-css.ts：KaTeX 的样式文本（第三方资产，MIT）。
//
// 上游来源：npm katex@${pkg.version} 的 dist/katex.min.css（DSH 官方 ui-primitives 的
//   markdown/MarkdownText.tsx 用 import 'katex/dist/katex.min.css' 引它）。
//
// 为什么改成文本（2026-11-06，issue 005）：第三方插件的 client 构建**没有 CSS 管线**
//   （官方 clientBundle 预设对外插件不可用），样式只能走运行时 <style> 注入
//   （本仓的 <name>-css.ts 机制）。故把 CSS 文本随组件带过来。
//
// 字体：@font-face 的 url 指向 jsdelivr CDN（锁 katex 版本），不再用相对路径 ——
//   相对路径在运行时注入的 <style> 里没有 base 可依。离线环境公式会降级（无字体），
//   但公式结构仍可读。
//
// 消费方：把它拼进面板的 <style> 注入器（与各组件的 styles 一起）。

/** KaTeX 样式文本（注入 <style> 用）。 */
export const katexStyles = ${JSON.stringify(css)}
`

writeFileSync(join(ROOT, 'src', 'katex-css.ts'), header)
console.log(`[gen-katex-css] 已生成 src/katex-css.ts（katex@${pkg.version}；字体引用 ${count} 处 → CDN）`)
