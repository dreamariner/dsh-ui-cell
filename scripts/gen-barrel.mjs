#!/usr/bin/env node
// gen-barrel.mjs — 生成 src/index.ts（按 registry 的 ready 条目全量发射）。
//
// 为什么需要它：src/index.ts 是**本仓内部**用的 barrel（消费端不会 import 它——
// add 复制的是单个组件文件）。它必须与 registry + src/ 同步，否则：
//   · 新组件没进 barrel → 文档站与预览用不到；
//   · 旧组件还在 barrel → 指向已删文件（mini-diff.ts / ansi-lite.ts 那样）→ 编译红。
//
// 发射规则（per-file 精确）：
//   · 每个条目的每个 .tsx/.ts 文件单独成组，按「值导出 / 类型导出」分开；
//   · 导出名从源码里正则提取（export function/const/class/interface/type）；
//   · 同名导出跨文件时保留先出现的（并在注释里标出重复）。
//
// 用法：node scripts/gen-barrel.mjs（改完 src/ 或 registry.json 后跑一次）

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(KIT, 'src')
const registry = JSON.parse(readFileSync(join(KIT, 'registry.json'), 'utf8'))

const seen = new Set()
const duplicates = []

let out = `// dsh-ui-cell 组件 barrel。
//
// ⚠ 这个 barrel 是**本仓内部**用的（消费端不会 import 它——add 复制的是单个组件文件）。
// 消费端拿到的是插件自己的 src/client/ui/ 目录（源码归插件），彼此不共享运行时。
// 按 registry ready 条目全量导出（文档站与预览用），组件源变更时重跑
// \`node scripts/gen-barrel.mjs\`。

`

let groups = 0
for (const item of registry.items) {
  if (item.status !== 'ready') continue
  let emitted = false
  for (const file of item.files) {
    if (!/\.(tsx|ts)$/.test(file)) continue
    const text = readFileSync(join(SRC, file), 'utf8')
    const values = []
    const types = []
    for (const m of text.matchAll(/^export (?:function|const|class) ([A-Za-z][A-Za-z0-9_]*)/gm)) {
      const name = m[1]
      if (seen.has(name)) { duplicates.push(`${name}（${file}）`); continue }
      seen.add(name)
      values.push(name)
    }
    for (const m of text.matchAll(/^export (?:interface|type) ([A-Za-z][A-Za-z0-9_]*)/gm)) {
      const name = m[1]
      if (seen.has(name)) { duplicates.push(`${name}（${file}）`); continue }
      seen.add(name)
      types.push(name)
    }
    if (values.length === 0 && types.length === 0) continue
    out += `// ── ${item.name}/${file} ──\n`
    if (values.length > 0) out += `export { ${values.join(', ')} } from './${file}'\n`
    if (types.length > 0) out += `export type { ${types.join(', ')} } from './${file}'\n`
    out += '\n'
    emitted = true
  }
  if (emitted) groups += 1
}

writeFileSync(join(SRC, 'index.ts'), out)
console.log(`barrel 重生成：条目组 ${groups}，导出名 ${seen.size}`)
if (duplicates.length > 0) {
  console.warn(`⚠ 同名导出被跳过的 ${duplicates.length} 个：${duplicates.join(', ')}`)
}
