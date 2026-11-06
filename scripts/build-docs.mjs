#!/usr/bin/env node
// build-docs.mjs — 构建 docs/wiki/index.html（自包含组件文档站）
//
// 设计要点：
//   1. 站点跑的是 **kit 真组件**（demo 源直接 import ../../src/*），不是仿制的静态 markup；
//   2. kit 组件的 `.css` 导入走 **add 交付的同一条转换管线**（buildStyleModule → 类名表 +
//      前缀化样式文本），由 esbuild 插件现场转换——文档站展示的就是插件会拿到的产物；
//   3. 主题 token 从 DSH_CHECKOUT 的 ui-theme styles 目录拼装（含明暗两套，body[data-ds-dark-theme]
//      切换），保证演示与宿主同源；
//   4. 产物是单个自包含 index.html（内联 JS/CSS，无外部请求），提交入库，
//      GitHub Pages 或本地 file:// 直接打开。
//
// 用法：pnpm docs:build（需要 DSH_CHECKOUT 指向与 dshVersion 同版的 checkout）

import process from 'node:process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as esbuild from 'esbuild'
import { dshCheckout } from './lib/paths.mjs'

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WIKI = join(KIT, 'docs', 'wiki')
const GEN = '/tmp/dsh-ui-cell-docs-gen'

// ── ① 先把 cli/add.ts 编译成可 import 的 mjs（文档站复用 add 的真实转换管线）──
rmSync(GEN, { recursive: true, force: true })
await esbuild.build({
  entryPoints: [join(KIT, 'cli', 'add.ts')],
  outfile: join(GEN, 'add.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  external: ['node:*'],
  logLevel: 'silent',
})
const { buildStyleModule, prefixCss, loadRegistry } = await import(pathToFileURL(join(GEN, 'add.mjs')).href)
const registry = loadRegistry(KIT)

// ── ② 主题 token：从 checkout 的 ui-theme styles 全量拼装（官方明暗两套同源）──
const checkout = dshCheckout()
if (checkout === undefined || !existsSync(checkout)) {
  console.error('[build-docs] 未设置 DSH_CHECKOUT（或路径不存在）。文档站的 token 从 checkout 拼装：')
  console.error('[build-docs]   export DSH_CHECKOUT=<与 dshVersion 同版的 deepseek-harness 检出>')
  process.exit(1)
}
const stylesDir = join(checkout, 'packages', 'client', 'ui-theme', 'src', 'styles')
if (!existsSync(stylesDir)) {
  console.error(`[build-docs] checkout 里没有 ui-theme styles 目录：${stylesDir}`)
  process.exit(1)
}
const tokenCss = readdirSync(stylesDir).filter((f) => f.endsWith('.css')).sort()
  .map((f) => `/* ===== ${f} ===== */\n` + readFileSync(join(stylesDir, f), 'utf8')).join('\n')

// ── ③ 全体组件样式：走 buildStyleModule（duk- 前缀，与 add 交付一致）──
const kitStyles = []
for (const item of registry.items) {
  if (item.status !== 'ready') continue
  for (const file of item.files) {
    if (!file.endsWith('.css')) continue
    const cssText = readFileSync(join(KIT, 'src', file), 'utf8')
    // 原样注入通道（registry 的 rawStyles）：第三方契约的类名不能前缀
    // （katex 的 .katex / .katex-display 是 katex 自己吐的类名，改了就对不上）
    const raw = (item.rawStyles ?? []).includes(file)
    // 前缀的组件名用**文件名**（去 .css），不是条目名：两者可以不同
    // （code-card.css 属于 code-toolbar 条目），而 CLI 的 buildStyleModule 与
    // tsx 里的 css.xxx 访问都按文件名算 —— 这里必须一致，否则类名对不上、样式失效。
    const base = file.replace(/\.css$/, '')
    kitStyles.push(`/* ===== ${item.name}/${file} ===== */\n` + (raw ? cssText : prefixCss(cssText, 'duk-', base)))
  }
}
const combinedKitCss = kitStyles.join('\n')

// kit css 导入 → buildStyleModule 现场转换（与 add 交付同一条管线）
const kitCssTablePlugin = {
  name: 'kit-css-table',
  setup(build) {
    // .css 扩展名有 esbuild 内置语义（css loader 不支持 default import），
    // 挪进自定义 namespace 彻底隔离，再按 buildStyleModule 转 JS 模块
    build.onResolve({ filter: /\.css$/ }, (args) => ({
      path: isAbsolute(args.path) ? args.path : join(args.resolveDir ?? '.', args.path),
      namespace: 'kitcss',
    }))
    build.onLoad({ filter: /.*/, namespace: 'kitcss' }, (args) => {
      const cssText = readFileSync(args.path, 'utf8')
      const name = basename(args.path).replace(/\.css$/, '')
      const moduleSrc = buildStyleModule(cssText, 'duk-', name)
      // kit 源用 default 导入（import css from './x.css'）→ default = 类名表
      return { contents: moduleSrc + '\nexport default { css, styles }.css\n', loader: 'ts' }
    })
  },
}

// ── ④ 打包 demo（react + 全组件，IIFE 自包含）──
const result = await esbuild.build({
  entryPoints: [join(WIKI, 'demo.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  plugins: [kitCssTablePlugin],
  define: { 'process.env.NODE_ENV': '"production"' },
  write: false,
  logLevel: 'silent',
})
const demoJs = result.outputFiles[0].text

// ── ⑤ 注入 HTML 模板 ──
const pkg = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8'))
const html = `<!doctype html>
<!-- 生成物（scripts/build-docs.mjs @ ${pkg.version}），勿手改；重建：pnpm docs:build -->
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-ui-cell 组件文档（${pkg.version} · DSH ${registry.dshVersion}）</title>
<style>
${tokenCss}
</style>
<style>
/* ===== kit 全组件样式（duk- 前缀，buildStyleModule 产物） ===== */
${combinedKitCss}
</style>
<style>
/* ===== 文档站骨架（自带样式，不占组件命名空间） ===== */
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1f2328; background: #f6f7f8; }
.doc-shell { display: flex; min-height: 100vh; }
.doc-side { width: 240px; flex: none; border-right: 1px solid #e4e6ea; background: #fff; padding: 16px 12px; position: sticky; top: 0; height: 100vh; overflow: auto; }
.doc-side h1 { font-size: 15px; margin: 4px 8px 2px; }
.doc-side .ver { font-size: 11px; color: #8b949e; margin: 0 8px 14px; }
.doc-side a { display: block; padding: 5px 10px; border-radius: 6px; color: #57606a; text-decoration: none; font-size: 13px; }
.doc-side a:hover { background: #eef0f2; color: #1f2328; }
.doc-side .group { font-size: 11px; color: #8b949e; margin: 14px 8px 4px; letter-spacing: 0.05em; }
.doc-main { flex: 1 1 0; min-width: 0; padding: 28px 40px 80px; max-width: 980px; }
.doc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.doc-top h2 { margin: 0; font-size: 20px; }
.doc-top button { margin-left: auto; padding: 5px 12px; border: 1px solid #d0d4da; border-radius: 6px; background: #fff; cursor: pointer; font-size: 12px; }
.doc-intro { color: #57606a; font-size: 13px; line-height: 1.7; margin: 0 0 24px; }
.demo-section { background: #fff; border: 1px solid #e4e6ea; border-radius: 10px; padding: 18px 20px 20px; margin-bottom: 18px; scroll-margin-top: 16px; }
.demo-section > h3 { margin: 0 0 2px; font-size: 15px; }
.demo-section .desc { margin: 0 0 12px; color: #8b949e; font-size: 12px; line-height: 1.6; }
.demo-stage { border: 1px dashed #d8dce1; border-radius: 8px; padding: 20px; margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
.demo-stage > * { margin: 0; }
.demo-code { margin: 0; padding: 12px 14px; background: #0d1117; color: #c9d1d9; border-radius: 8px; font: 12px/1.6 'SF Mono', Menlo, Consolas, monospace; overflow: auto; white-space: pre; }
body[data-ds-dark-theme] .doc-side, body[data-ds-dark-theme] .demo-section { background: #16181d; border-color: #2a2d33; }
body[data-ds-dark-theme] { background: #0f1114; color: #e6e8eb; }
body[data-ds-dark-theme] .doc-side a { color: #9ea7b3; }
body[data-ds-dark-theme] .doc-side a:hover { color: #e6e8eb; background: #1e2127; }
body[data-ds-dark-theme] .doc-top button { background: #1e2127; border-color: #33383f; color: #e6e8eb; }
body[data-ds-dark-theme] .demo-stage { border-color: #33383f; }
body[data-ds-dark-theme] .demo-section .desc, body[data-ds-dark-theme] .doc-intro { color: #9ea7b3; }
</style>
</head>
<body>
<div id="root"></div>
<script>
${demoJs}
</script>
</body>
</html>
`
writeFileSync(join(WIKI, 'index.html'), html)
rmSync(GEN, { recursive: true, force: true })
console.log(`[build-docs] 已生成 docs/wiki/index.html（${(html.length / 1024).toFixed(0)} KB；registry ${registry.items.length} 条目；DSH ${registry.dshVersion}）`)

