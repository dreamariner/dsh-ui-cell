// diff-upstream.mjs：逐件比对本仓复制件与官方 checkout 的当前版本。
//
// 为什么要有这个（红线 5）：registry.json 的 `upstream` 字段是「这个件来自上游哪个
// 文件」的真相源，DSH 升级时要**逐组件重 diff**，不是整包覆盖。重 diff 是本仓的固有
// 职责，每次手搓 `diff` 太慢（上游 PascalCase + `.module.css`，本仓 kebab-case +
// `.css`，直接 diff 全是噪声），故把「归一化后比对」写成脚本。
//
// 用法：
//   DSH_CHECKOUT=<官方 checkout> node scripts/diff-upstream.mjs           # 汇总表
//   DSH_CHECKOUT=<官方 checkout> node scripts/diff-upstream.mjs --diff    # 附带逐行差异
//   DSH_CHECKOUT=<官方 checkout> node scripts/diff-upstream.mjs --only tooltip,menu
//   DSH_CHECKOUT=<官方 checkout> node scripts/diff-upstream.mjs --base <commit>
//        # 按「上游自 base 以来的变更文件」驱动：逐个变更文件找本仓对应件并比对
//        （升级审计用：先看上游改了什么，再看本仓跟没跟上）
//
// 退出码：有差异时为 1（可当护栏用）。

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshCheckout } from './lib/paths.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'))

const args = process.argv.slice(2)
const showDiff = args.includes('--diff')
const onlyIdx = args.indexOf('--only')
const only = onlyIdx >= 0 ? (args[onlyIdx + 1] ?? '').split(',').filter(Boolean) : null

const checkout = dshCheckout()
if (!checkout) {
  console.error('[diff-upstream] 需要 DSH_CHECKOUT=<官方 checkout 路径>（显式指定，无默认推导）')
  process.exit(2)
}
const UPSTREAM = join(checkout, 'packages', 'client', 'ui-primitives', 'src')

/** 本仓 kebab 命名 ← 上游 Pascal 命名（JSONTree → json-tree、useModalLayer → use-modal-layer）。 */
function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** 上游注记里混着版本与说明尾巴（`@ dsh v0.2.2-rc.5 (9c2670d3bc)（rc.5 起…）`），取真正的路径。 */
function upstreamPathOf(upstream) {
  const raw = upstream.split(' @ ')[0].split('（')[0].trim()
  return raw.replace(/^packages\/client\/ui-primitives\/src\/?/, '')
}

/** 去掉文件开头的注释块（本仓有「来源」头注记，上游有文档注释，两边都剥掉再比）。 */
function stripLeadingComments(text) {
  const lines = text.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === '') { i++; continue }
    if (line.startsWith('//')) { i++; continue }
    if (line.startsWith('/*')) {
      let j = i
      let closed = false
      while (j < lines.length) {
        if (lines[j].includes('*/')) { closed = true; break }
        j++
      }
      if (!closed) break
      i = j + 1
      continue
    }
    break
  }
  return lines.slice(i).join('\n')
}

/**
 * 上游模块改名 → 本仓模块名（归一化用）。
 * 这些是本仓**改名收录**的件，导入路径与上游不同但指向同一个模块。
 */
const MODULE_ALIASES = {
  highlight: 'code-highlighting',
  'link-icon': 'markdown-link-icon',
  'useanchoredposition': 'use-anchored-position',
  'usemodallayer': 'use-modal-layer',
  'usedismissonoutsidepointer': 'use-dismiss-on-outside-pointer',
}

/**
 * 归一化 import 路径：两边指向同一个模块，但写法不同
 * （上游 `./icons/index.tsx` / `./useModalLayer.ts` / `./Modal.module.css`
 *   vs 本仓 `./icons.tsx` / `./use-modal-layer.ts` / `./modal.css`）。
 */
function normalizeImports(text) {
  return text.replace(/from\s+'([^']+)'/g, (whole, spec) => {
    if (!spec.startsWith('.')) return whole
    const cleaned = spec
      .replace(/\.module\.css$/, '.css')
      .replace(/\/index(\.[a-z]+)$/, '$1')
      .replace(/\.(tsx?|css)$/, '')
    const parts = cleaned.split('/')
    const name = parts.pop()
    const raw = parts.length > 0 && name === 'index'
      ? kebab(parts.pop() ?? '')
      : kebab(name ?? '')
    return `from '${MODULE_ALIASES[raw] ?? raw}'`
  })
}

/** 比对前把两边都归一化。 */
function normalize(text) {
  return normalizeImports(stripLeadingComments(text))
    .split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .join('\n')
    .trim()
}

/** 上游文件索引：kebab 名 → 绝对路径（.tsx 优先，其次 .module.css，再次 .ts）。 */
function buildUpstreamIndex(root) {
  const index = new Map()
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry)
      if (statSync(abs).isDirectory()) { walk(abs); continue }
      if (!/\.(tsx?|css)$/.test(entry)) continue
      const base = basename(entry).replace(/\.module\.css$/, '').replace(/\.(tsx?|css)$/, '')
      const key = kebab(base)
      const prev = index.get(key)
      const rank = (p) => (p.endsWith('.tsx') ? 3 : p.endsWith('.module.css') ? 2 : 1)
      if (!prev || rank(abs) > rank(prev)) index.set(key, abs)
    }
  }
  walk(root)
  return index
}

const upstreamIndex = buildUpstreamIndex(UPSTREAM)

/** 找我们这个文件对应的上游文件。 */
function findUpstream(ourFile, preferred) {
  // 上游字段直接点名了文件（多数件）：.tsx 用它，.css 用同名的 .module.css
  if (preferred) {
    if (ourFile.endsWith('.tsx') || ourFile.endsWith('.ts')) {
      if (existsSync(preferred)) return preferred
    } else if (ourFile.endsWith('.css')) {
      const css = join(dirname(preferred), `${basename(preferred).replace(/\.(tsx?|css)$/, '')}.module.css`)
      if (existsSync(css)) return css
    }
  }
  // 其余按 kebab 名索引找
  const key = kebab(basename(ourFile).replace(/\.(tsx?|css)$/, ''))
  return upstreamIndex.get(key)
}

/** 内容相同、只是声明顺序不同（不算差异，单列一档提醒）。 */
function isReordered(a, b) {
  const al = a.split('\n').filter(l => l.trim() !== '')
  const bl = b.split('\n').filter(l => l.trim() !== '')
  if (al.length !== bl.length) return false
  const sa = [...al].sort()
  const sb = [...bl].sort()
  return sa.every((line, i) => line === sb[i])
}

/** 一行差异摘要（给汇总表用）。 */
function firstMeaningfulDiff(a, b) {
  const al = a.split('\n')
  const bl = b.split('\n')
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) {
      return `第 ${i + 1} 行：本仓「${al[i] ?? '(无)'}」 / 上游「${bl[i] ?? '(无)'}」`
    }
  }
  return ''
}

/** 模式 B：按上游变更集驱动（升级审计）。 */
function runBaseMode(base) {
  const changed = execFileSync(
    'git',
    ['-C', checkout, 'diff', '--name-only', `${base}..HEAD`, '--', 'packages/client/ui-primitives/src'],
    { encoding: 'utf8' },
  ).split('\n').filter(Boolean)

  console.log(`\n[diff-upstream] 上游变更集：${base} → HEAD，共 ${changed.length} 个文件\n`)
  let lagging = 0
  let aligned = 0
  let noCounterpart = 0
  for (const upstreamRel of changed) {
    const rel = upstreamRel.replace(/^packages\/client\/ui-primitives\/src\//, '')
    const upAbs = join(UPSTREAM, rel)
    if (!existsSync(upAbs)) {
      console.log(`∅ ${rel} —— 上游已删除`)
      noCounterpart++
      continue
    }
    const base3 = basename(rel).replace(/\.module\.css$/, '').replace(/\.(tsx?|css)$/, '')
    const key = kebab(base3)
    const ourFile = findOurFileFor(rel)
    if (!ourFile) {
      console.log(`◐ ${rel} —— 本仓无对应件（本仓未收录 / 拆件另存）`)
      noCounterpart++
      continue
    }
    const ourAbs = join(SRC, ourFile)
    const ours = normalize(readFileSync(ourAbs, 'utf8'))
    const theirs = normalize(readFileSync(upAbs, 'utf8'))
    if (ours === theirs) {
      console.log(`✓ ${rel} ← ${ourFile}（已跟上）`)
      aligned++
    } else if (isReordered(ours, theirs)) {
      console.log(`✓ ${rel} ← ${ourFile}（已跟上，仅声明顺序不同）`)
      aligned++
    } else {
      lagging++
      console.log(`≠ ${rel} ← ${ourFile}（本仓滞后）`)
      const al = ours.split('\n')
      const bl = theirs.split('\n')
      let shown = 0
      for (let i = 0; i < Math.max(al.length, bl.length) && shown < (showDiff ? 40 : 6); i++) {
        if (al[i] !== bl[i]) {
          console.log(`    本仓 ${al[i] ?? '(无)'}`)
          console.log(`    上游 ${bl[i] ?? '(无)'}`)
          shown++
          if (!showDiff) break
        }
      }
    }
  }
  console.log(`\n[diff-upstream] 已跟上 ${aligned} | 本仓滞后 ${lagging} | 无对应件 ${noCounterpart}\n`)
  return lagging
}

/**
 * 找本仓里对应某个上游文件的复制件。
 * 优先用 registry 的 upstream 字段做映射（覆盖 code-highlighting 这类改名/别名件），
 * 再退回 kebab 名索引；同名的 tsx 与 css 分开认，别串。
 */
function findOurFileFor(upstreamRel) {
  const base3 = basename(upstreamRel).replace(/\.module\.css$/, '').replace(/\.(tsx?|css)$/, '')
  const key = kebab(base3)
  const isCss = upstreamRel.endsWith('.css')

  for (const item of registry.items) {
    if (!item.upstream) continue
    const rel = upstreamPathOf(item.upstream)
    if (!rel || rel.endsWith('/')) continue
    if (kebab(basename(rel).replace(/\.(tsx?|css)$/, '')) !== key) continue
    const candidates = (item.files ?? []).filter(f => f.endsWith('.css') === isCss)
    const exact = candidates.find(f => kebab(basename(f).replace(/\.(tsx?|css)$/, '')) === key)
    if (exact) return exact
    if (candidates.length === 1) return candidates[0]
  }

  // 退回：按 kebab 名在「有上游出处的件」里找，同扩展名优先
  const upstreamEntries = registry.items.filter(i => i.upstream)
  const sameExt = []
  const anyExt = []
  for (const item of upstreamEntries) {
    for (const f of item.files ?? []) {
      if (kebab(basename(f).replace(/\.(tsx?|css)$/, '')) !== key) continue
      anyExt.push(f)
      if (f.endsWith('.css') === isCss) sameExt.push(f)
    }
  }
  return sameExt[0] ?? (isCss ? undefined : anyExt[0])
}

const baseIdx = args.indexOf('--base')
if (baseIdx >= 0) {
  const base = args[baseIdx + 1]
  if (!base) {
    console.error('[diff-upstream] --base 需要一个 commit')
    process.exit(2)
  }
  const lagging = runBaseMode(base)
  process.exit(lagging > 0 ? 1 : 0)
}

const rows = []
for (const item of registry.items) {
  if (!item.upstream) continue
  if (only && !only.includes(item.name)) continue

  const diffs = []
  const onlyOurs = []
  const reordered = []
  // 逐个上游文件找本仓对应件（registry 的 upstream 字段优先，其次 kebab 索引）。
  // 反过来做（本仓文件找上游）会把「本仓把上游一个文件拆成多件」的情况误判成差异。
  const upstreamFiles = []
  const rel = upstreamPathOf(item.upstream)
  if (rel && !rel.endsWith('/')) {
    const abs = join(UPSTREAM, rel)
    if (existsSync(abs) && !statSync(abs).isDirectory()) upstreamFiles.push(rel)
    else if (rel.endsWith('.tsx') || rel.endsWith('.ts')) {
      // 上游字段点名了文件但已不存在（上游删了）→ 本仓保留也算已登记偏离
      onlyOurs.push(`${rel}（上游已删除）`)
    }
  } else {
    // 字段只写了目录（markdown 家族）或「对应 xxx」→ 用 kebab 索引把本仓件反查上游
    for (const f of item.files ?? []) {
      const k = kebab(basename(f).replace(/\.(tsx?|css)$/, ''))
      const hit = upstreamIndex.get(k)
      if (hit) upstreamFiles.push(relative(UPSTREAM, hit))
    }
    // 目录型字段：把该目录下的上游文件都纳入
    if (rel.endsWith('/')) {
      const dirAbs = join(UPSTREAM, rel)
      if (existsSync(dirAbs)) {
        for (const f of readdirSync(dirAbs)) {
          if (!/\.(tsx?|css)$/.test(f)) continue
          upstreamFiles.push(rel + f)
        }
      }
    }
  }

  // 字段点名了 tsx 时，把同名的 .module.css 也纳入比对（否则 css 的差异会被漏掉）
  if (rel && /\.tsx$/.test(rel)) {
    const cssRel = rel.replace(/\.tsx$/, '.module.css')
    if (existsSync(join(UPSTREAM, cssRel))) upstreamFiles.push(cssRel)
  }
  // 本仓件列表里的每个文件都反查一次上游（覆盖「字段只写目录」的件）
  for (const f of item.files ?? []) {
    const k = kebab(basename(f).replace(/\.(tsx?|css)$/, ''))
    for (const [key, abs] of upstreamIndex) {
      if (key !== k) continue
      const rel2 = relative(UPSTREAM, abs)
      const sameExt = rel2.endsWith('.css') === f.endsWith('.css')
      if (sameExt) upstreamFiles.push(rel2)
    }
  }

  const seen = new Set()
  for (const upstreamRel of upstreamFiles) {
    if (seen.has(upstreamRel)) continue
    seen.add(upstreamRel)
    const upAbs = join(UPSTREAM, upstreamRel)
    if (!existsSync(upAbs)) continue
    const ourFile = findOurFileFor(upstreamRel)
    if (!ourFile) {
      onlyOurs.push(`${upstreamRel}（本仓未收录）`)
      continue
    }
    const ourAbs = join(SRC, ourFile)
    if (!existsSync(ourAbs)) { onlyOurs.push(`${ourFile}（本仓缺）`); continue }
    const ours = normalize(readFileSync(ourAbs, 'utf8'))
    const theirs = normalize(readFileSync(upAbs, 'utf8'))
    if (ours !== theirs && isReordered(ours, theirs)) {
      reordered.push(`${ourFile} ← ${upstreamRel}`)
      continue
    }
    if (ours !== theirs) {
      diffs.push({
        file: ourFile,
        upstream: upstreamRel,
        detail: firstMeaningfulDiff(ours, theirs),
        ours: readFileSync(ourAbs, 'utf8'),
        theirs: readFileSync(upAbs, 'utf8'),
      })
    }
  }
  if (diffs.length === 0 && onlyOurs.length === 0) {
    rows.push({ name: item.name, status: 'same', reordered })
  } else if (diffs.length === 0) {
    rows.push({ name: item.name, status: 'partial', detail: onlyOurs.join('、'), upstreamGone: onlyOurs.every(s => s.includes('上游无对应件')) })
  } else {
    rows.push({ name: item.name, status: 'differs', diffs })
  }
}

const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})
const ICON = { same: '✓', differs: '≠', partial: '◐' }

console.log(`\n[diff-upstream] 上游基线：${checkout}`)
console.log(`[diff-upstream] 比对 ${rows.length} 个有上游出处的条目`)
console.log(`[diff-upstream] 结果：一致 ${counts.same ?? 0} | 有差异 ${counts.differs ?? 0} | 部分对应 ${counts.partial ?? 0}\n`)

for (const row of rows) {
  if (row.status === 'same') {
    if (row.reordered && row.reordered.length > 0) {
      console.log(`✓ ${row.name} — 一致（仅声明顺序不同：${row.reordered.join('、')}）`)
    }
    continue
  }
  console.log(`${ICON[row.status] ?? '?'} ${row.name} — ${row.status}`)
  if (row.detail) console.log(`    ${row.detail}`)
  if (row.diffs) {
    for (const d of row.diffs) {
      console.log(`    [${d.file}] ← ${d.upstream}`)
      console.log(`      ${d.detail}`)
      if (showDiff) {
        const al = d.ours.split('\n')
        const bl = d.theirs.split('\n')
        let shown = 0
        for (let i = 0; i < Math.max(al.length, bl.length) && shown < 6; i++) {
          if (al[i] !== bl[i]) {
            console.log(`      本仓 ${al[i] ?? '(无)'}`)
            console.log(`      上游 ${bl[i] ?? '(无)'}`)
            shown++
          }
        }
      }
    }
  }
}

const bad = rows.filter(r => r.status !== 'same').length
console.log(bad > 0 ? `\n[diff-upstream] ${bad} 个条目与上游不一致\n` : '\n[diff-upstream] 全部一致\n')

// ── 偏离登记制：实际偏离集合必须等于已登记集合 ──────────────────────────────
// 偏离不是永久豁免：上游改了对应文件，本清单就会失配 → 强制重新审视一遍
// （跟，还是继续不跟并更新理由）。
const expectIdx = args.indexOf('--expect')
if (expectIdx >= 0) {
  const expectPath = args[expectIdx + 1]
  if (!expectPath) {
    console.error('[diff-upstream] --expect 需要一个登记文件路径')
    process.exit(2)
  }
  const expected = JSON.parse(readFileSync(expectPath, 'utf8'))
  const expectedNames = new Set((expected.deviations ?? []).map(d => d.entry))
  const actualNames = new Set(rows.filter(r => r.status !== 'same').map(r => r.name))

  const unregistered = [...actualNames].filter(n => !expectedNames.has(n))
  const stale = [...expectedNames].filter(n => !actualNames.has(n))

  console.log('[diff-upstream] 偏离登记核对：')
  console.log(`[diff-upstream]   已登记 ${expectedNames.size} 个 | 实际 ${actualNames.size} 个`)
  if (unregistered.length > 0) {
    console.error(`[diff-upstream] ✗ 未登记的偏离（要么跟上上游，要么写进登记文件并说明理由）：\n${unregistered.map(n => `    - ${n}`).join('\n')}`)
  }
  if (stale.length > 0) {
    console.error(`[diff-upstream] ✗ 登记了但已不再偏离（上游或本仓改了，要更新登记文件）：\n${stale.map(n => `    - ${n}`).join('\n')}`)
  }
  if (unregistered.length === 0 && stale.length === 0) {
    console.log('[diff-upstream]   ✓ 实际偏离集合与登记一致')
  }
  process.exit(unregistered.length > 0 || stale.length > 0 ? 1 : 0)
}

process.exit(bad > 0 ? 1 : 0)
