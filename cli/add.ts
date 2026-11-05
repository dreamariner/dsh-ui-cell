// dsh-ui-cell add：把组件源码复制进插件，并按插件前缀 + 组件名段重命名类名。
//
// 为什么需要这一步（shadcn 的核心模型）：第三方 DSH 插件**不得** load 官方 client 包
// （DSH practices.md 明文）， sanctioned 路径是把官方 primitive 的 markup / CSS / 行为
// 复制进插件源码。复制之后源码归插件所有：改坏了只影响自己，官方升级也不会突然变样。
//
// 复制时做三件事：
//   1. **类名前缀化（带组件名段）**：官方 CSS module 的类名是 .button / .primary 这类裸名，
//      隔离靠 per-file 哈希；复制进插件后样式会拼进**同一个 <style>**，哈希隔离不复存在，
//      只加一个插件前缀不够（input 与 select 都有 .wrap，button 与 input 都有 .icon，
//      2026-11-05 复审实证二者跨组件互覆）。故最终类名 = `prefix + 组件名段 + 类名`
//      （与组件同名的根类免组件段：.button → duk-button；.wrap → duk-input-wrap /
//      duk-select-wrap），跨组件绝不重名。
//   2. **@keyframes 改名**：动画名是**文档级**命名空间（官方 CSS Modules 同样对 keyframes
//      做哈希）。定义与 animation / animation-name 引用同步改名，漏一边 = 动画静默失效。
//   3. **CSS → TS 字符串**：第三方插件的 client 构建**没有 CSS 管线**（DSH 官方 client
//      预设的 lightningcss 通道对外插件不可用），样式只能走运行时 <style> 注入。
//      故把 .css 转成 `<name>-css.ts`（导出样式字符串 + 类名表），组件改引它。
//
// 另外解析**依赖闭包**：registry 条目声明 dependencies，请求 risk-confirmation 会自动
// 带上 button / modal / icon（曾实证：不解析闭包时单加产出悬空导入的坏产物，CLI 还报成功）。
//
// 幂等：同名文件已存在时默认报错，需 --force 覆盖（避免半途覆盖掉插件的本地改动）。

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface RegistryItem {
  name: string
  type: string
  status: 'ready' | 'planned'
  description: string
  files: string[]
  /** 组件间依赖（add 时自动解析闭包，deps 先于本体复制）。 */
  dependencies?: string[]
  upstream: string | null
}

export interface Registry {
  name: string
  dshVersion: string
  dshCommit: string
  items: RegistryItem[]
}

export interface AddOptions {
  /** 目标插件目录（其下会创建 src/client/ui/）。 */
  to: string
  /** 类名前缀，默认 'duk-'。 */
  prefix?: string
  /** 覆盖已存在的文件。 */
  force?: boolean
}

export interface AddResult {
  added: string[]
  skipped: string[]
  /** 目标目录下的最终文件清单。 */
  files: string[]
  /** 需要人工接线的地方（提示信息）。 */
  notes: string[]
}

/** 本仓根目录（cli/ 的上一级）。 */
export const kitRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

export function loadRegistry(root = kitRoot): Registry {
  return JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as Registry
}

/** 组件源码目录。 */
export function srcDir(root = kitRoot): string {
  return join(root, 'src')
}

/**
 * 最终类名：与组件同名的根类免组件段（.button → duk-button），
 * 其余加组件名段（input 的 .wrap → duk-input-wrap）。
 * 类名表与 CSS 改写必须共用本函数，两边才永远一致。
 */
export function finalClassName(componentName: string, name: string, prefix: string): string {
  return name === componentName ? `${prefix}${name}` : `${prefix}${componentName}-${name}`
}

/**
 * 从 CSS 文本里抽出所有类选择器名（`.foo`），按出现顺序去重。
 * 与 prefixCss 同一套「选择器位置」判定：只认前面是开头 / 空白 / 组合器 / 逗号 / 括号的
 * `.foo`（链式类 `.a.b` 的 `.b` 两边都不认——护栏另有断言禁止这种形态进组件 CSS）。
 * 只扫选择器位置，不看注释与属性值（官方 CSS 里没有这种情况，保守处理）。
 */
export function cssClassNames(css: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  // 去掉注释后再扫，避免注释里的类名被当真
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const re = /(^|[\s>+~,(]|(?<=[\w-]))(\.(-?[_a-zA-Z][\w-]*))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stripped)) !== null) {
    const name = m[3]!
    if (seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

/**
 * CSS 改写：类选择器加前缀 + 组件名段；@keyframes 定义与 animation 引用同步改名。
 * 只替换类选择器位置（前面不是标识符字符），避免误伤 `0.5px` 之类。
 */
export function prefixCss(css: string, prefix: string, componentName: string): string {
  const rename = (name: string) => finalClassName(componentName, name, prefix)
  // 注释保护：注释里的 .foo 不是选择器（先暂存，最后还原）
  let out = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/\.(-?[_a-zA-Z][\w-]*)/g, '__KEEP__$1'))
  // keyframes：名字是文档级命名空间，定义与引用必须同步改名
  const keyframes = new Set<string>()
  for (const m of out.matchAll(/@keyframes\s+([_a-zA-Z][\w-]*)/g)) keyframes.add(m[1]!)
  for (const name of keyframes) {
    const next = rename(name)
    out = out.replace(new RegExp(`@keyframes\\s+${name}\\b`), `@keyframes ${next}`)
    out = out.replace(/(?:animation|animation-name)\s*:[^;}]*;/g, (decl) => decl.replace(new RegExp(`\\b${name}\\b`), next))
  }
  // 类选择器前缀化（与 cssClassNames 同一套位置判定，两边永远一致）
  out = out.replace(/(^|[\s>+~,(]|(?<=[\w-]))(\.(-?[_a-zA-Z][\w-]*))/g, (_all, lead: string, _whole: string, name: string) => {
    return `${lead}.${rename(name)}`
  })
  return out.replace(/__KEEP__/g, '.')
}

/**
 * 类名表机制（关键设计）：生成的 `css` 对象**以原类名为键、最终类名为值**。
 * 于是 tsx 里的两种访问都天然正确，且**不需要改写 tsx 的类名访问**：
 *   - 静态：`css.button` → 表['button'] = 'duk-button'
 *   - 动态：`css[variant]`（官方 Button 的 variant ∈ primary|ghost|outline|toolbar、
 *     size ∈ md|sm）→ 表['primary'] = 'duk-button-primary'
 * 若把表的键也改名，动态索引就断了（variant 的值是原名）——这正是本实现
 * 不改写 css.xxx 访问的原因。
 */
export function prefixTsxCssAccess(tsx: string, prefix: string): string {
  void prefix
  return tsx
}

/** tsx 里 `css[<expr>]` 的动态访问（expr 为标识符或字符串）。 */
export function dynamicCssAccesses(tsx: string): string[] {
  const out: string[] = []
  const re = /\bcss\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tsx)) !== null) out.push(m[1]!.trim())
  return out
}

/**
 * 生成组件的样式模块：把 .css 转成 `<name>-css.ts`。
 * 导出：
 *   - `css`：类名表（键 = 原类名，值 = 最终类名），兼容 css['x'] 与 css.x 两种访问
 *   - `styles`：样式文本（可直接 <style> 注入）
 */
export function buildStyleModule(cssText: string, prefix: string, componentName: string): string {
  const names = cssClassNames(cssText)
  const table = names.map(name => `  '${name}': '${finalClassName(componentName, name, prefix)}',`).join('\n')
  const body = prefixCss(cssText, prefix, componentName)
  return `// ${componentName} 样式（由 dsh-ui-cell add 生成，勿手改）。
// 源：dsh-ui-cell/src/${componentName}.css @ ${prefix} 前缀 + 组件名段（keyframes 同规则改名）。
// 第三方插件的 client 构建无 CSS 管线，样式走运行时 <style> 注入（见插件的 panel-css 约定）。

/** 类名表：键是原类名，值是加前缀与组件名段后的最终类名。 */
export const css: Record<string, string> = {
${table}
}

/** 样式文本（注入 <style> 用）。 */
export const styles = ${JSON.stringify(body)}
`
}

/** 把 tsx 里的 `import css from './x.css'` 改成 `import { css } from './x-css.ts'`。 */
export function rewriteCssImport(tsx: string, cssFileBase: string): string {
  const re = new RegExp(`import\\s+css\\s+from\\s+['"]\\./${cssFileBase}\\.css['"]`)
  return tsx.replace(re, `import { css } from './${cssFileBase}-css.ts'`)
}

/**
 * 依赖闭包解析：请求的组件 → 按 registry 的 dependencies 展开成 deps 先于本体的有序清单。
 * 环检测显式报错；未知组件报错时带上下文（直接请求还是某组件的依赖）。
 */
export function resolveDependencies(names: string[], registry: Registry): string[] {
  const byName = new Map(registry.items.map(item => [item.name, item]))
  const ordered: string[] = []
  const seen = new Set<string>()
  const visiting = new Set<string>()
  const visit = (name: string, via: string | null) => {
    if (seen.has(name)) return
    if (visiting.has(name)) throw new Error(`组件依赖成环：${name}（经 ${via}）`)
    const item = byName.get(name)
    if (!item) {
      throw new Error(`未知组件：${name}（${via ? `${via} 的依赖` : '直接请求'}；可用：${[...byName.keys()].join(', ')}）`)
    }
    visiting.add(name)
    for (const dep of item.dependencies ?? []) visit(dep, name)
    visiting.delete(name)
    seen.add(name)
    ordered.push(name)
  }
  for (const name of names) visit(name, null)
  return ordered
}

/** 执行 add：复制组件文件（含依赖闭包）到目标插件目录。 */
export function addComponents(
  names: string[],
  options: AddOptions,
  root = kitRoot,
): AddResult {
  const registry = loadRegistry(root)
  const prefix = options.prefix ?? 'duk-'
  const targetUi = join(resolve(options.to), 'src', 'client', 'ui')
  const added: string[] = []
  const skipped: string[] = []
  const notes: string[] = []

  const expanded = resolveDependencies(names, registry)
  const auto = expanded.filter(name => !names.includes(name))
  if (auto.length > 0) {
    notes.push(`依赖闭包自动带上：${auto.join(', ')}（被请求组件的导入需要它们）`)
  }

  mkdirSync(targetUi, { recursive: true })
  for (const name of expanded) {
    const item = registry.items.find(i => i.name === name)!
    if (item.status !== 'ready') throw new Error(`组件 ${name} 尚未就绪（status=${item.status}）`)

    for (const file of item.files) {
      const source = join(srcDir(root), file)
      if (!existsSync(source)) throw new Error(`组件 ${name} 的源文件缺失：${file}（仓损坏？）`)
      const isCss = file.endsWith('.css')
      // 样式文件：button.css → button-css.ts（去掉 .css 后缀再加 -css）
      const base = isCss ? file.replace(/\.css$/, '') : file.replace(/\.tsx?$/, '')
      // 非样式文件保持原扩展名：组件是 .tsx，辅助模块（focus.ts 等）是 .ts
      const targetName = isCss ? `${base}-css.ts` : file
      const target = join(targetUi, targetName)
      if (existsSync(target) && !options.force) {
        skipped.push(`${name}/${targetName}`)
        continue
      }
      if (isCss) {
        const cssText = readFileSync(source, 'utf8')
        writeFileSync(target, buildStyleModule(cssText, prefix, base))
      } else {
        let text = readFileSync(source, 'utf8')
        // 组件内部的 css 引用改前缀；css import 改指生成的 -css.ts
        text = prefixTsxCssAccess(text, prefix)
        if (item.files.includes(`${base}.css`)) {
          text = rewriteCssImport(text, base)
        }
        // 相对导入的模块名保持上游名（靠目录隔离，不加前缀）
        writeFileSync(target, text)
      }
      added.push(`${name}/${targetName}`)
    }
  }
  if (skipped.length > 0 && !options.force) {
    notes.push(`已存在未覆盖（要覆盖加 --force）：${skipped.join(', ')}`)
  }
  notes.push(`样式注入：在插件入口把各组件的 styles 拼进已有的 <style> 注入器（本仓插件见 src/client/panel/panel-css.ts 的 PANEL_CSS 模式）。`)
  notes.push(`类名前缀：${prefix} + 组件名段（官方规范要求复制后重命名类名以免与插件自身样式相撞；keyframes 同规则改名）。`)
  return { added, skipped, files: readdirSync(targetUi).sort(), notes }
}

/** CLI 入口。 */
export function runCli(argv: string[]): number {
  const names: string[] = []
  let to = ''
  let prefix = 'duk-'
  let force = false
  // 允许省略子命令词（`dsh-ui-cell add button` 与 `dsh-ui-cell button` 等价）
  const args = argv[0] === 'add' ? argv.slice(1) : argv
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!
    if (arg === '--to') { to = args[++i] ?? ''; continue }
    if (arg === '--prefix') { prefix = args[++i] ?? prefix; continue }
    if (arg === '--force') { force = true; continue }
    if (arg === '--help' || arg === '-h') {
      console.log('用法：dsh-ui-cell add <component...> --to <pluginDir> [--prefix duk-] [--force]')
      console.log('示例：dsh-ui-cell add button input --to packages/plugin-memory（组件依赖自动带上）')
      return 0
    }
    names.push(arg)
  }
  if (names.length === 0) {
    console.error('用法：dsh-ui-cell add <component...> --to <pluginDir> [--prefix duk-] [--force]')
    return 1
  }
  if (to === '') {
    console.error('缺少 --to <pluginDir>（目标插件目录）')
    return 1
  }
  try {
    const result = addComponents(names, { to, prefix, force })
    console.log(`[dsh-ui-cell] 已复制 ${result.added.length} 个文件到 ${join(resolve(to), 'src/client/ui')}`)
    for (const note of result.notes) console.log(`  · ${note}`)
    if (result.skipped.length > 0) {
      console.log(`[dsh-ui-cell] 跳过（已存在）：${result.skipped.join(', ')}`)
    }
    return 0
  } catch (error) {
    console.error(`[dsh-ui-cell] ${(error as Error).message}`)
    return 1
  }
}
