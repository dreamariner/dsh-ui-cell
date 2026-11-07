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
//      （与组件同名的根类免组件段：.button → duc-button；.wrap → duc-input-wrap /
//      duc-select-wrap），跨组件绝不重名。
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
  /**
   * 依赖档位（2026-11-06 起，issue 005）：
   *   `atom`   —— 零重依赖（默认）。按钮 / 输入 / 弹层这类原子件，只用 react + clsx。
   *   `content`—— 带 npm 重依赖（markdown 家族 / diff / anser / shiki）。装了就占 bundle。
   * 缺省视为 `atom`。
   */
  tier?: 'atom' | 'content'
  /**
   * 该条目引入的 npm 运行时依赖（包名 → 版本范围）。
   * add 时与消费端 package.json 对比，缺失的报给使用者（`--with-deps` 才写文件）。
   */
  npmDependencies?: Record<string, string>
  /**
   * 走「原样注入」通道的样式文件（**不加类名前缀**）。
   *
   * 用于第三方契约的样式：katex 的 .katex / .katex-display 是 katex 自己吐的类名，
   * 改名就与它吐出的 HTML 对不上。普通组件样式不在此列（照常加前缀 + 组件名段）。
   */
  rawStyles?: string[]
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
  /** 类名前缀，默认 'duc-'。 */
  prefix?: string
  /** 覆盖已存在的文件。 */
  force?: boolean
  /**
   * 把缺失的 npm 依赖写进消费端 package.json 的 dependencies。
   * 默认**不写**（改消费端仓库是有副作用的动作，必须显式）。
   */
  withDeps?: boolean
}

export interface AddResult {
  added: string[]
  skipped: string[]
  /** 目标目录下的最终文件清单。 */
  files: string[]
  /** 需要人工接线的地方（提示信息）。 */
  notes: string[]
  /**
   * 本次闭包引入、消费端缺失的 npm 依赖（包名 → 版本范围）。
   * 消费端必须自己装上，否则产物编译不过（源码里的裸 import 找不到包）。
   */
  missingDeps: Record<string, string>
}

/** 本仓根目录（cli/ 的上一级）。 */
export const cellRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

export function loadRegistry(root = cellRoot): Registry {
  return JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as Registry
}

/** 组件源码目录。 */
export function srcDir(root = cellRoot): string {
  return join(root, 'src')
}

/**
 * 最终类名：与组件同名的根类免组件段（.button → duc-button），
 * 其余加组件名段（input 的 .wrap → duc-input-wrap）。
 * 类名表与 CSS 改写必须共用本函数，两边才永远一致。
 */
export function finalClassName(componentName: string, name: string, prefix: string): string {
  return name === componentName ? `${prefix}${name}` : `${prefix}${componentName}-${name}`
}

/**
 * CSS 里的 `:global(...)`：官方 CSS Modules 用来声明**不参与哈希**的全局类名
 * （markdown 家族有 11 处，如 `:global(.katex)` / `:global(.md-code-block)` /
 * `:global(.line)`）。这些是第三方契约（katex 自己的 CSS、shiki 主题、宿主钩子），
 * **改名就失配**。故：`:global(...)` 内的类名既不进类名表也不改名。
 */
const GLOBAL_BLOCK = /:global\(([^)]*)\)/g

/**
 * 把 `:global(...)` 段整体保护起来（占位 → 还原）。
 *
 * 占位符必须**不含单词字符**：类名扫描的正则是 `\.([_a-zA-Z][\w-]*)`，
 * 占位符若含字母数字就会跟相邻类名粘连（`.tableScroll:global(.x)` 被扫成
 * `tableScroll__GLOBAL_0__`）。用私用区字符占位：既不参与类名扫描，
 * 又**保持相邻关系**（不能换成带空格的占位——`.a :global(.b)` 与 `.a:global(.b)`
 * 是不同选择器语义：前者是后代，后者是复合）。
 */
const GLOBAL_SLOT = (i: number) => `\uE000${i}\uE001`

function protectGlobals(css: string): { text: string; restore: (s: string) => string } {
  const saved: string[] = []
  const text = css.replace(GLOBAL_BLOCK, (whole) => {
    saved.push(whole)
    return GLOBAL_SLOT(saved.length - 1)
  })
  return { text, restore: (s) => s.replace(/\uE000(\d+)\uE001/g, (_all, i) => saved[Number(i)] ?? '') }
}

/**
 * 从 CSS 文本里抽出所有类选择器名（`.foo`），按出现顺序去重。
 * 与 prefixCss 同一套「选择器位置」判定：认前面是开头 / 空白 / 组合器 / 逗号 / 括号的
 * `.foo`，也认链式类 `.a.b` 的每一段（lookbehind 分支；官方 menu / toast 在用，
 * 护栏断言链式类逐段改名且进表）。
 * 只扫选择器位置，不看注释与属性值（官方 CSS 里没有这种情况，保守处理）。
 * `:global(...)` 内的类名不进表（第三方契约，不归本组件所有）。
 */
export function cssClassNames(css: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  // 去掉注释后再扫，避免注释里的类名被当真
  const stripped = protectGlobals(css.replace(/\/\*[\s\S]*?\*\//g, '')).text
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
 * `:global(...)` 内的类名原样保留（第三方契约，改名即失配）。
 */
export function prefixCss(css: string, prefix: string, componentName: string): string {
  const rename = (name: string) => finalClassName(componentName, name, prefix)
  // 注释保护：注释里的 .foo 不是选择器（先暂存，最后还原）
  let out = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/\.(-?[_a-zA-Z][\w-]*)/g, '__KEEP__$1'))
  // :global 保护：第三方契约类名不改名（katex / shiki / 宿主钩子）
  const globals = protectGlobals(out)
  out = globals.text
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
  out = out.replace(/__KEEP__/g, '.')
  return globals.restore(out)
}

/**
 * 类名表机制（关键设计）：生成的 `css` 对象**以原类名为键、最终类名为值**。
 * 于是 tsx 里的两种访问都天然正确，且**不需要改写 tsx 的类名访问**：
 *   - 静态：`css.button` → 表['button'] = 'duc-button'
 *   - 动态：`css[variant]`（官方 Button 的 variant ∈ primary|ghost|outline|toolbar、
 *     size ∈ md|sm）→ 表['primary'] = 'duc-button-primary'
 * 若把表的键也改名，动态索引就断了（variant 的值是原名），这正是没有
 * 「tsx 改写」步骤的原因（历史接口 prefixTsxCssAccess 已删，006）。
 */
export function buildStyleModule(cssText: string, prefix: string, componentName: string, raw = false): string {
  // 原样注入通道：不加前缀、不出类名表（第三方契约的类名不能动）
  if (raw) {
    return `// ${componentName} 样式（由 dsh-ui-cell add 生成，勿手改）。
// 源：dsh-ui-cell/src/${componentName}.css @ **原样注入**（第三方契约的类名不能加前缀）。

/** 样式文本（注入 <style> 用）。 */
export const styles = ${JSON.stringify(cssText)}

/** 原样注入的文件没有类名表（空表，避免误用）。 */
export const css: Record<string, string> = {}

`
  }
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

/**
 * 把 tsx 里的 css 导入改成生成模块的导入。
 *
 * 为什么要泛化（2026-11-06 修）：官方 CSS Modules 的用法不止一种形态——
 *   `import css from './x.css'`（本组件自己的样式）
 *   `import cardCss from './code-card.css'`（**另一个条目**的样式，diff-block 就这么用）
 * 而生成的模块导出的是 `css`（类名表）。原来只认 `import css from` + 只查本条目的 css，
 * 结果 code-toolbar / diff-block 复制出去就是**悬空导入**（消费端只有 code-card-css.ts，
 * 源码却 import './code-card.css'）。
 *
 * 现在按「被复制的 css 文件集合」判定：只要 `./<base>.css` 在集合里就改写。
 * 标识符保持不变（`import { css as cardCss } from './code-card-css.ts'`），
 * 于是 `cardCss.foo` 这类用法零改动。
 */
export function rewriteCssImports(tsx: string, cssBases: ReadonlySet<string>): string {
  return tsx.replace(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]\.\/([\w-]+)\.css['"]/g,
    (all, ident: string, base: string) => {
      if (!cssBases.has(base)) return all
      const spec = ident === 'css' ? 'css' : `css as ${ident}`
      return `import { ${spec} } from './${base}-css.ts'`
    },
  )
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

/**
 * 收集闭包内所有条目声明的 npm 依赖（包名 → 版本范围）。
 * 同名包被声明了不同版本范围时直接报错：那要么是 registry 维护事故
 * （护栏「npmDependencies 同包跨条目范围一致」也会拦），要么就要把装不上的
 * 范围交给消费端（`a | b` 不是合法 semver），两者都该在最前面爆出来。
 */
export function collectNpmDependencies(names: string[], registry: Registry): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of names) {
    const item = registry.items.find(i => i.name === name)
    if (!item) continue
    for (const [pkg, range] of Object.entries(item.npmDependencies ?? {})) {
      const prev = out[pkg]
      if (prev === undefined) { out[pkg] = range; continue }
      if (prev !== range) {
        throw new Error(`registry 冲突：包 ${pkg} 被声明了两个版本范围（${prev} 与 ${range}，后者经 ${name}）。请统一 registry 里该包的范围`)
      }
    }
  }
  return out
}

/** 消费端 package.json 里已声明的依赖（dependencies + devDependencies + peerDependencies）。 */
function consumerDeclaredDeps(pluginRoot: string): Record<string, string> {
  const pkgPath = join(resolve(pluginRoot), 'package.json')
  if (!existsSync(pkgPath)) return {}
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    return { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
  } catch {
    return {}
  }
}

/**
 * 依赖交接（2026-11-06 起，issue 005）：add 复制过去的是**源码**，
 * 源码里的裸 npm import（`import { structuredPatch } from 'diff'`）在消费端
 * 必须能解析到包。所以 add 要告诉消费端「少了这些包」。
 *
 * 默认只提示不写文件（改消费端仓库是有副作用的动作）；`--with-deps` 才写进
 * 消费端 package.json 的 dependencies。
 */
function handoffNpmDependencies(
  pluginRoot: string,
  wanted: Record<string, string>,
  write: boolean,
): { missing: Record<string, string>; wrote: boolean } {
  const declared = consumerDeclaredDeps(pluginRoot)
  const missing: Record<string, string> = {}
  for (const [pkg, range] of Object.entries(wanted)) {
    if (declared[pkg] === undefined) missing[pkg] = range
  }
  if (!write || Object.keys(missing).length === 0) return { missing, wrote: false }

  const pkgPath = join(resolve(pluginRoot), 'package.json')
  if (!existsSync(pkgPath)) return { missing, wrote: false }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
  const deps = { ...((pkg.dependencies as Record<string, string>) ?? {}) }
  for (const [name, range] of Object.entries(missing)) deps[name] = range
  pkg.dependencies = deps
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  return { missing, wrote: true }
}

/**
 * 缺失依赖的安装命令（note 里给人照抄的那条）。
 * 必须由「包名 → 范围」表直接拼：对 `pkg@range` 串做 `split('@')[0]` 反解包名
 * 会把 scoped 包（@shikijs/langs、@types/mdast）截成空串（2026-11-06 审计实证）。
 */
export function installCommand(missing: Record<string, string>): string {
  return `pnpm add ${Object.entries(missing).map(([pkg, range]) => `${pkg}@${range}`).join(' ')}`
}

/** 执行 add：复制组件文件（含依赖闭包）到目标插件目录。 */
export function addComponents(
  names: string[],
  options: AddOptions,
  root = cellRoot,
): AddResult {
  const registry = loadRegistry(root)
  const prefix = options.prefix ?? 'duc-'
  const targetUi = join(resolve(options.to), 'src', 'client', 'ui')
  const added: string[] = []
  const skipped: string[] = []
  const notes: string[] = []
  // 原样注入的样式模块（第三方契约类名）：它们没有组件 tsx 引用，
  // 消费端要自己 import styles 拼进注入器，漏了就丢样式（公式不排版 / 高亮没颜色）。
  const rawStyleModules: string[] = []
  // 本轮已写过的目标文件（同源文件同内容，重复命中静默去重，
  // 别把「本轮重复」误报成「消费端已有文件」）
  const written = new Set<string>()

  const expanded = resolveDependencies(names, registry)
  const auto = expanded.filter(name => !names.includes(name))
  if (auto.length > 0) {
    notes.push(`依赖闭包自动带上：${auto.join(', ')}（被请求组件的导入需要它们）`)
  }

  // 全闭包的 css 文件集合（跨条目）：css 导入改写按它判定，
  // 否则 diff-block 引用 code-toolbar 的 code-card.css 会变悬空导入。
  const cssBases = new Set<string>()
  for (const name of expanded) {
    const item = registry.items.find(i => i.name === name)!
    for (const file of item.files) if (file.endsWith('.css')) cssBases.add(file.replace(/\.css$/, ''))
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
      if (written.has(target)) continue
      if (existsSync(target) && !options.force) {
        skipped.push(`${name}/${targetName}`)
        continue
      }
      if (isCss) {
        const cssText = readFileSync(source, 'utf8')
        // 原样注入通道（registry 的 rawStyles）：第三方契约的类名不能加前缀
        const raw = (item.rawStyles ?? []).includes(file)
        writeFileSync(target, buildStyleModule(cssText, prefix, base, raw))
        if (raw) rawStyleModules.push(targetName)
      } else {
        let text = readFileSync(source, 'utf8')
        // css import 改指生成的 -css.ts（跨条目也认）；tsx 的 css.xxx 访问无需改写
        // （类名表以原类名为键，见 buildStyleModule 的注释）
        text = rewriteCssImports(text, cssBases)
        // 相对导入的模块名保持上游名（靠目录隔离，不加前缀）
        writeFileSync(target, text)
      }
      written.add(target)
      added.push(`${name}/${targetName}`)
    }
  }
  if (skipped.length > 0 && !options.force) {
    notes.push(`已存在未覆盖（要覆盖加 --force）：${skipped.join(', ')}`)
  }
  notes.push(`样式注入：在插件入口把各组件的 styles 拼进已有的 <style> 注入器（消费端可自建一个样式聚合模块统一管理，模式见 README）。`)
  if (rawStyleModules.length > 0) {
    notes.push(`原样注入的样式模块（第三方契约类名，不加前缀）：${rawStyleModules.join(', ')} —— 它们没有组件引用，要自己 import { styles } 一起拼进注入器，漏了会丢样式（公式不排版 / 代码高亮没颜色）。`)
  }
  notes.push(`类名前缀：${prefix} + 组件名段（官方规范要求复制后重命名类名以免与插件自身样式相撞；keyframes 同规则改名）。`)
  notes.push(`Agent 接线手册随包分发：把本包 skills/dsh-ui-cell/（npm 包内同路径）拷进插件的 .agents/skills/，后续 Agent 按手册操作（选型、样式注入、依赖交接、坑位清单都在里面）。`)

  // 依赖交接：内容块层组件带 npm 重依赖，消费端得自己装上（否则源码里的裸 import 编译不过）
  const wanted = collectNpmDependencies(expanded, registry)
  const handoff = handoffNpmDependencies(options.to, wanted, options.withDeps === true)
  if (Object.keys(handoff.missing).length > 0) {
    const list = Object.entries(handoff.missing).map(([pkg, range]) => `${pkg}@${range}`).join(' ')
    notes.push(handoff.wrote
      ? `已写入消费端 package.json 的 dependencies：${list}（记得跑一次安装）`
      : `消费端缺这些 npm 依赖（复制过去的是源码，裸 import 要能解析到包）：${list}；装：${installCommand(handoff.missing)}；或 add 时加 --with-deps 直接写进 package.json`)
  }
  return { added, skipped, files: readdirSync(targetUi).sort(), notes, missingDeps: handoff.missing }
}

/** CLI 入口。 */
export function runCli(argv: string[]): number {
  const names: string[] = []
  let to = ''
  let prefix = 'duc-'
  let force = false
  let withDeps = false
  // 允许省略子命令词（`dsh-ui-cell add button` 与 `dsh-ui-cell button` 等价）
  const args = argv[0] === 'add' ? argv.slice(1) : argv
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!
    if (arg === '--to') { to = args[++i] ?? ''; continue }
    if (arg === '--prefix') { prefix = args[++i] ?? prefix; continue }
    if (arg === '--force') { force = true; continue }
    if (arg === '--with-deps') { withDeps = true; continue }
    if (arg === '--help' || arg === '-h') {
      console.log('用法：dsh-ui-cell add <component...> --to <pluginDir> [--prefix duc-] [--force] [--with-deps]')
      console.log('示例：dsh-ui-cell add button input --to packages/plugin-memory（组件依赖自动带上）')
      console.log('  --with-deps  把缺失的 npm 依赖直接写进消费端 package.json 的 dependencies（默认只提示）')
      return 0
    }
    names.push(arg)
  }
  if (names.length === 0) {
    console.error('用法：dsh-ui-cell add <component...> --to <pluginDir> [--prefix duc-] [--force] [--with-deps]')
    return 1
  }
  if (to === '') {
    console.error('缺少 --to <pluginDir>（目标插件目录）')
    return 1
  }
  try {
    const result = addComponents(names, { to, prefix, force, withDeps })
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
