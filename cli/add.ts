// dsh-ui-kit add：把组件源码复制进插件，并按插件前缀重命名类名。
//
// 为什么需要这一步（shadcn 的核心模型）：第三方 DSH 插件**不得** load 官方 client 包
// （DSH practices.md 明文）， sanctioned 路径是把官方 primitive 的 markup / CSS / 行为
// 复制进插件源码。复制之后源码归插件所有：改坏了只影响自己，官方升级也不会突然变样。
//
// 复制时做两件事：
//   1. **类名前缀化**：官方 CSS module 的类名是 .button / .primary 这类裸名，直接复制会与
//      插件自己的样式撞车（官方规范要求「Rename copied classes under your plugin's prefix」）。
//      本实现把 .button → .<prefix>-button、.primary → .<prefix>-primary 等，
//      并同步改 tsx 里的 css.xxx 引用与 CSS 里的选择器。
//   2. **CSS → TS 字符串**：第三方插件的 client 构建**没有 CSS 管线**（DSH 官方 client
//      预设的 lightningcss 通道对外插件不可用），样式只能走运行时 <style> 注入。
//      故把 .css 转成 `<name>-css.ts`（导出样式字符串 + 类名表），组件改引它。
//
// 幂等：同名文件已存在时默认报错，需 --force 覆盖（避免半途覆盖掉插件的本地改动）。

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface RegistryItem {
  name: string
  type: string
  status: 'ready' | 'planned'
  description: string
  files: string[]
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
 * 从 CSS 文本里抽出所有类选择器名（`.foo`），按出现顺序去重。
 * 只认选择器位置的选择器，不看属性值里的字符串（官方 CSS 里没有这种情况，保守处理）。
 */
export function cssClassNames(css: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  // 去掉注释后再扫，避免注释里的类名被当真
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const re = /\.(-?[_a-zA-Z][\w-]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stripped)) !== null) {
    const name = m[1]!
    if (seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

/**
 * CSS 选择器里的类名替换：`.foo` → `.<prefix>foo`。
 * 只替换类选择器位置（前面不是标识符字符），避免误伤 `0.5px` 之类。
 */
export function prefixCss(css: string, prefix: string): string {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/\.(-?[_a-zA-Z][\w-]*)/g, '__KEEP__$1'))
  const replaced = stripped.replace(/(^|[\s>+~,(])(\.(-?[_a-zA-Z][\w-]*))/g, (_all, lead: string, whole: string, name: string) => {
    return `${lead}.${prefix}${name}`
  })
  return replaced.replace(/__KEEP__/g, '.')
}

/**
 * 类名表机制（关键设计）：生成的 `css` 对象**以原类名为键、前缀化类名为值**。
 * 于是 tsx 里的两种访问都天然正确，且**不需要改写 tsx 的类名访问**：
 *   - 静态：`css.button` → 表['button'] = 'duk-button'
 *   - 动态：`css[variant]`（官方 Button 的 variant ∈ primary|ghost|outline|toolbar、
 *     size ∈ md|sm）→ 表['primary'] = 'duk-primary'
 * 若把表的键也改成前缀化名，动态索引就断了（variant 的值是原名）——这正是本实现
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
 *   - `css`：类名表（键 = 原类名，值 = 前缀化类名），兼容 css['x'] 与 css.x 两种访问
 *   - `styles`：样式文本（可直接 <style> 注入）
 */
export function buildStyleModule(cssText: string, prefix: string, componentName: string): string {
  const names = cssClassNames(cssText)
  const table = names.map(name => `  '${name}': '${prefix}${name}',`).join('\n')
  const body = prefixCss(cssText, prefix)
  return `// ${componentName} 样式（由 dsh-ui-kit add 生成，勿手改）。
// 源：dsh-ui-kit/src/${componentName}.css @ ${prefix} 前缀化。
// 第三方插件的 client 构建无 CSS 管线，样式走运行时 <style> 注入（见插件的 panel-css 约定）。

/** 类名表：键是原类名，值是加前缀后的类名。 */
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

/** 执行 add：复制组件文件到目标插件目录。 */
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

  const byName = new Map(registry.items.map(item => [item.name, item]))
  for (const name of names) {
    const item = byName.get(name)
    if (!item) throw new Error(`未知组件：${name}（可用：${[...byName.keys()].join(', ')}）`)
    if (item.status !== 'ready') throw new Error(`组件 ${name} 尚未就绪（status=${item.status}）`)

    mkdirSync(targetUi, { recursive: true })
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
  notes.push(`类名前缀：${prefix}（官方规范要求复制后重命名类名以免与插件自身样式相撞）。`)
  return { added, skipped, files: readdirSync(targetUi).sort(), notes }
}

/** CLI 入口。 */
export function runCli(argv: string[]): number {
  const names: string[] = []
  let to = ''
  let prefix = 'duk-'
  let force = false
  // 允许省略子命令词（`dsh-ui-kit add button` 与 `dsh-ui-kit button` 等价）
  const args = argv[0] === 'add' ? argv.slice(1) : argv
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!
    if (arg === '--to') { to = args[++i] ?? ''; continue }
    if (arg === '--prefix') { prefix = args[++i] ?? prefix; continue }
    if (arg === '--force') { force = true; continue }
    if (arg === '--help' || arg === '-h') {
      console.log('用法：dsh-ui-kit add <component...> --to <pluginDir> [--prefix duk-] [--force]')
      console.log('示例：dsh-ui-kit add button input --to packages/plugin-memory')
      return 0
    }
    names.push(arg)
  }
  if (names.length === 0) {
    console.error('用法：dsh-ui-kit add <component...> --to <pluginDir> [--prefix duk-] [--force]')
    return 1
  }
  if (to === '') {
    console.error('缺少 --to <pluginDir>（目标插件目录）')
    return 1
  }
  try {
    const result = addComponents(names, { to, prefix, force })
    console.log(`[dsh-ui-kit] 已复制 ${result.added.length} 个文件到 ${join(resolve(to), 'src/client/ui')}`)
    for (const note of result.notes) console.log(`  · ${note}`)
    if (result.skipped.length > 0) {
      console.log(`[dsh-ui-kit] 跳过（已存在）：${result.skipped.join(', ')}`)
    }
    return 0
  } catch (error) {
    console.error(`[dsh-ui-kit] ${(error as Error).message}`)
    return 1
  }
}

export { basename, dirname }
