// gen-component-usage.mjs：生成「组件用法速查」参考（随 npm 包分发）。
//
// 为什么要有这个（2026-11-19 起）：消费端插件项目问「这个组件怎么用」，包里
// 原本只有**签名**（复制进插件的 TS 源码）与**选型一句话**（registry.json），
// 没有用法示例。示例其实早就有了 —— 文档站的 demo 里每段 `code` 就是最小可用
// 片段 —— 但文档站在 `docs/`，**不在 npm 包里**，消费端拿不到。
//
// 故把 demo 里的用法抽出来，按分组写进 `skills/dsh-ui-cell/references/components.md`
// （skills/ 随包分发，Agent 一次读完 89 个件的用法概览）。
//
// 生成物，别手改：改了 demo 就重跑 `pnpm skill:usage`；CI 会校验没有漂移。
//
// 用法：node scripts/gen-component-usage.mjs [--check]

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DEMOS = join(ROOT, 'docs', 'wiki', 'demos')
const OUT = join(ROOT, 'skills', 'dsh-ui-cell', 'references', 'components.md')
const checkOnly = process.argv.includes('--check')

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'))
const itemsByName = new Map(registry.items.map(i => [i.name, i]))

/** demo 文件 → 分组（与文档站的分类一致）。 */
const DEMO_GROUPS = [
  ['atoms.tsx', '原子件'],
  ['containers.tsx', '容器与布局'],
  ['overlays.tsx', '浮层与反馈'],
  ['inputs.tsx', '输入进阶'],
  ['content.tsx', '内容块'],
]

/**
 * 从 demo 源里抽出每个 `<Demo id= title= code={`…`}>` 的 id / title / code。
 * code 是模板字符串，里面可能有 `${}` 插值（要跳过），所以手写扫描而不是正则硬怼。
 */
function extractDemos(source) {
  const out = []
  let cursor = 0
  for (;;) {
    const at = source.indexOf('<Demo ', cursor)
    if (at < 0) break
    const idMatch = source.slice(at, at + 400).match(/\bid="([^"]+)"/)
    const titleMatch = source.slice(at, at + 400).match(/\btitle="([^"]+)"/)
    const codeStart = source.indexOf('code={`', at)
    if (idMatch && titleMatch && codeStart > 0 && codeStart < at + 1200) {
      // 扫到模板字符串的结束（跳过 ${ } 里的插值）
      let i = codeStart + 'code={`'.length
      let depth = 0
      while (i < source.length) {
        const ch = source[i]
        if (ch === '$' && source[i + 1] === '{') { depth++; i += 2; continue }
        if (ch === '}' && depth > 0) { depth--; i++; continue }
        if (ch === '`' && depth === 0) break
        i++
      }
      out.push({
        id: idMatch[1],
        title: titleMatch[1],
        code: source.slice(codeStart + 'code={`'.length, i),
      })
      cursor = i
    } else {
      cursor = at + 6
    }
  }
  return out
}

/**
 * 从组件源码里抓 props 的字段名。
 * 三种声明形态都认：
 *   1. `export interface XxxProps { … }`
 *   2. `type XxxProps = { … } & Other`（官方件多为这种）
 *   3. 函数签名里的内联对象类型 `function X({ … }: { … })`
 * 只取字段名（类型让 Agent 看源码 —— 源码就在插件目录里）。
 */
function extractPropNames(source) {
  const names = new Set()
  const blocks = []
  // interface 形态不要求 export：官方件常把字段拆在 `interface XxxBaseProps` 里
  // （如 Modal 的 ModalBaseProps），带不带 export 都得认。
  const iface = source.match(/(?:^|\n)\s*(?:export )?interface \w*Props\s*\{/)
  if (iface) blocks.push(source.slice(iface.index + iface[0].length))
  const type = source.match(/^(?:export )?type \w*Props\s*=\s*\{/m)
  if (type) blocks.push(source.slice(type.index + type[0].length))
  const inline = source.match(/export function \w+\([^)]*?:\s*\{/)
  if (inline) blocks.push(source.slice(inline.index + inline[0].length))

  for (const block of blocks) {
    for (const line of block.split('\n')) {
      if (/^\}/.test(line)) break // 到块尾
      const m = line.match(/^\s{2}(\w+)\??\s*[:(]/)
      if (m) names.add(m[1])
    }
  }
  return [...names]
}


/**
 * 从 demo 的 code 段里挑出「最小用法」几行：
 * import 行（路径改成本仓同目录形式：消费端复制后所有件都在同一个 ui/ 目录）
 * + 前两行有内容的用法。
 */
function usageExample(code, ourFile) {
  const lines = code.trim().split('\n')
  const imports = []
  const usages = []
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') continue
    if (line.startsWith('import ')) {
      // 文档站里是 '../ui/xxx.tsx'，消费端复制后是同目录 './xxx.tsx'
      imports.push(line.replace(/from '\.\.\/ui\//, "from './"))
      continue
    }
    if (line.startsWith('{/*') || line.startsWith('/*') || line.startsWith('//')) continue
    usages.push(line)
    if (usages.length >= 2) break
  }
  return [...imports, ...usages]
}

/** 用法块（写进组件源文件头；带标记以便幂等替换）。 */
const USAGE_BEGIN = '// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）'
const USAGE_END = '// ' + '─'.repeat(72)
/**
 * 用法块的正则（用来把已有块删掉再插入，保证幂等）。
 * 注意：**不能**写成模板字符串里嵌正则字面量 —— 那个正则的字符类里有 `${}`，
 * 在模板字符串的插值里会被提前截断，解析出来的模式是错的（表现为块被不断复制）。
 */
const escRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 全局：历史上手滑重复插入过多个块，删除时一次清干净（幂等的前提）
const USAGE_BLOCK_RE = new RegExp(
  '\\n?' + escRegExp(USAGE_BEGIN) + '[\\s\\S]*?\\n' + escRegExp(USAGE_END) + '\\n',
  'g',
)

function buildUsageBlock(exampleLines, props) {
  const block = [USAGE_BEGIN]
  for (const line of exampleLines) block.push(`//   ${line}`)
  if (props.length > 0) block.push(`//   props：${props.join(' / ')}`)
  block.push(USAGE_END)
  return block
}

/**
 * 把用法块注入源文件头（放在既有来源注记之后、import 之前）。
 * 幂等：已有的块先删掉再插，所以反复跑不会堆叠。
 */
function injectUsageBlock(source, block) {
  const cleaned = source.replace(USAGE_BLOCK_RE, '\n')
  const lines = cleaned.split('\n')
  let i = 0
  while (i < lines.length) {
    const t = lines[i].trim()
    if (t === '') { i++; continue }
    if (t.startsWith('//')) { i++; continue }
    if (t.startsWith('/*')) {
      let j = i
      let closed = false
      while (j < lines.length) { if (lines[j].includes('*/')) { closed = true; break } j++ }
      if (!closed) break
      i = j + 1
      continue
    }
    break
  }
  const head = lines.slice(0, i)
  const tail = lines.slice(i)
  while (head.length > 0 && head[head.length - 1].trim() === '') head.pop()
  return [...head, ...block, '', ...tail].join('\n')
}

/** 条目的主 tsx（拿它的 props）。 */
function mainTsxOf(item) {
  const tsx = (item.files ?? []).find(f => f.endsWith('.tsx'))
  if (!tsx) return undefined
  const abs = join(SRC, tsx)
  return existsSync(abs) ? abs : undefined
}

// 先把每个条目的用法块算出来（写回源文件头）
const usageBlocks = new Map()
for (const [file, group] of DEMO_GROUPS) {
  const abs = join(DEMOS, file)
  if (!existsSync(abs)) continue
  for (const demo of extractDemos(readFileSync(abs, 'utf8'))) {
    const item = itemsByName.get(demo.id)
    if (!item) continue
    const tsx = mainTsxOf(item)
    if (!tsx) continue
    const props = extractPropNames(readFileSync(tsx, 'utf8'))
    const example = usageExample(demo.code, basename(tsx))
    usageBlocks.set(tsx, buildUsageBlock(example, props))
  }
}

// 写回源文件（幂等：块会被替换而不是堆叠）
const drifted = []
for (const [abs, block] of usageBlocks) {
  const current = readFileSync(abs, 'utf8')
  const next = injectUsageBlock(current, block)
  if (next !== current) {
    if (checkOnly) drifted.push(relative(ROOT, abs))
    else writeFileSync(abs, next)
  }
}

const lines = []
lines.push('# 组件用法速查（Agent 视角）')
lines.push('')
lines.push('> **生成物，别手改**：改法是改文档站的 demo（`docs/wiki/demos/`），然后跑')
lines.push('> `pnpm skill:usage` 重新生成；CI 会校验它与 demo 没有漂移。')
lines.push('>')
lines.push('> 用途：插件项目里问「这个组件怎么用」。每条给四样东西 ——')
lines.push('> **一句话选型说明**（registry 的 description）、**最小可用片段**（文档站 demo 的真代码）、')
lines.push('> **可接的 props 字段名**（从源码的 props 声明抓的，类型看源码）、**依赖**（add 会自动带上）。')
lines.push('>')
lines.push('> props 那一行是该文件里**所有 props 接口的字段合集** —— 除组件自身的 props 外，')
lines.push('> 也含它内部结构（如 `Menu` 的 `items` 条目字段 `icon` / `shortcut` / `danger`）——')
lines.push('> 写嵌套结构时照着用最方便；严格类型看源码。')
lines.push('>')
lines.push('> 完整 API 与行为保真说明看复制进插件的源码（`src/client/ui/<组件>.tsx` 的头部注释与 props）。')
lines.push('')

let total = 0
for (const [file, group] of DEMO_GROUPS) {
  const abs = join(DEMOS, file)
  if (!existsSync(abs)) continue
  const demos = extractDemos(readFileSync(abs, 'utf8'))
  const entries = []
  for (const demo of demos) {
    const item = itemsByName.get(demo.id)
    if (!item) continue
    const tsx = mainTsxOf(item)
    const props = tsx ? extractPropNames(readFileSync(tsx, 'utf8')) : []
    const deps = (item.dependencies ?? []).filter(d => d !== 'icon')
    entries.push({ demo, item, props, deps })
    total++
  }
  if (entries.length === 0) continue
  lines.push(`## ${group}`)
  lines.push('')
  for (const { demo, item, props, deps } of entries) {
    lines.push(`### ${demo.title}`)
    lines.push('')
    lines.push(`${item.description ?? ''}`)
    lines.push('')
    lines.push('```tsx')
    lines.push(demo.code.trim())
    lines.push('```')
    lines.push('')
    if (props.length > 0) {
      lines.push(`props：${props.map(p => `\`${p}\``).join(' / ')}`)
    }
    if (deps.length > 0) {
      lines.push('')
      lines.push(`依赖：${deps.map(d => `\`${d}\``).join(' / ')}（\`add\` 自动带上）`)
    }
    if (item.npmDependencies && item.npmDependencies.length > 0) {
      lines.push('')
      lines.push(`npm 依赖：${item.npmDependencies.map(d => `\`${d}\``).join(' / ')}`)
    }
    lines.push('')
  }
}

lines.push('---')
lines.push('')
lines.push('没有 demo 的条目（用法请直接读源码）：')
const covered = new Set()
for (const [file] of DEMO_GROUPS) {
  const abs = join(DEMOS, file)
  if (!existsSync(abs)) continue
  for (const demo of extractDemos(readFileSync(abs, 'utf8'))) covered.add(demo.id)
}
const missing = registry.items
  .filter(i => i.status === 'ready' && !covered.has(i.name))
  .map(i => `\`${i.name}\``)
lines.push(missing.length > 0 ? missing.join(' / ') : '（无）')
lines.push('')

const text = lines.join('\n')
if (checkOnly) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (current !== text) {
    console.error('[gen-usage] 生成物与 demo 不同步：跑 `pnpm skill:usage` 重新生成')
    process.exit(1)
  }
  if (drifted.length > 0) {
    console.error(`[gen-usage] 组件源文件头的用法块与 demo 不同步（跑 pnpm skill:usage）：\n${drifted.map(f => `    - ${f}`).join('\n')}`)
    process.exit(1)
  }
  console.log('[gen-usage] 生成物与 demo 一致')
  process.exit(0)
}

writeFileSync(OUT, text)
console.log(`[gen-usage] 已生成 ${basename(OUT)}（${total} 个组件的用法），并写回 ${usageBlocks.size} 个组件源文件头的用法块`)
