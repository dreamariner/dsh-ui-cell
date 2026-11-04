#!/usr/bin/env node
// dsh-ui-kit :: vendor-tokens.mjs — 把 DSH 官方 token 定义同步成本仓的 pinned 清单
//
// 范式照 dreamariner/dsh-typert-protocol 的 vendor-protocol.mjs（同一套「同步 + 校验」
// 两段式：vendor / vendor:check）。
//
// ## 为什么需要这份清单
//
// 组件样式里写 `var(--dsw-alias-label-primary)`，如果 token 名拼错、或官方在某个版本里
// 删掉了它，CSS 规范的行为是：**该声明被静默丢弃**（var() 解析失败 → 整条声明无效），
// 样式不生效、**没有任何报错**。纯格式类护栏（禁 static/specific/字面色）看不出这种错。
//
// 故把官方 token 定义（ui-theme 的 design-platform.css / base.css / onboarding.css）
// 抽成一份 pinned 清单，护栏据此做**存在性校验**：kit 引用的每个 token 必须在这份清单里
// （或属于宿主上下文变量 / 组件自有变量）。
//
// ## 唯一事实源
//
// **上游 monorepo 的 `packages/client/ui-theme/src/styles/`**（不是 npm 包）——
// 路径由环境变量 `DSH_CHECKOUT` 显式指定（指向 DSH 仓库根的 checkout），零机器路径硬编码。
//
// ## 为什么必须 pinned（而不是运行时查）
//
// token 清单要在**没有 checkout 的机器**上也能工作（消费插件的开发者只有本仓）。
// pinned 快照正是为此：日常 typecheck / 构建 / 护栏全都不依赖 checkout。
//
// ## 与 protocol 的差别
//
// protocol 同步的是**源码**（生成器要读它的声明面）；本仓同步的是**token 名清单**
// （只需名字与分类，不需要内容）。故本脚本不拷文件、不改 version、不动 LICENSE——
// 出处记在清单的 source 字段与本仓组件源码头注释里。
//
// ## 何时重跑
//
// DSH 升级时（token 可能增删改名）。checkout 不在场时清单仍然有效——它是 pinned 快照。
//
// ## 用法
//
//   DSH_CHECKOUT=<path> node scripts/vendor-tokens.mjs            # 同步（也可 pnpm run vendor）
//   DSH_CHECKOUT=<path> node scripts/vendor-tokens.mjs --check    # 只校验（也可 pnpm run vendor:check）

import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshCheckout } from './lib/paths.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outPath = join(repoRoot, 'tokens', 'official-tokens.json')
const CHECK = process.argv.includes('--check')

const checkout = dshCheckout()
if (!checkout || !existsSync(checkout)) {
  console.error('[vendor-tokens] 未设置 DSH_CHECKOUT（或路径不存在）。本脚本只在升级 DSH 时需要：')
  console.error('[vendor-tokens]   export DSH_CHECKOUT=<与 dshVersion 同版的 deepseek-harness 检出>')
  process.exit(1)
}
const stylesDir = join(checkout, 'packages', 'client', 'ui-theme', 'src', 'styles')
if (!existsSync(stylesDir)) {
  console.error(`[vendor-tokens] checkout 里找不到 ui-theme 样式目录：${stylesDir}`)
  process.exit(1)
}

/** 从 CSS 文本里抽出自定义属性定义名（行首 --x:）。 */
const definedIn = (text) => {
  const out = new Set()
  for (const m of text.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) out.add(m[1])
  return out
}

/** 读一个样式文件（不存在则空集）。 */
const read = (name) => {
  const path = join(stylesDir, name)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

// ⚠ 必须扫**整个 styles 目录**：token 定义分散在多个文件——design-platform.css（alias 与
// static 调色板）、base.css（radius/font/transition）、focus.css（focus-ring）、
// gradient-shadow-text.css（elevation/mask-blur）、onboarding.css（onboarding alias）。
// 早期只扫前三个 → elevation/focus-ring/mask-blur 三类静默丢失 → 官方明明有的 token
// 被清单判成「不存在」→ 存在性护栏误报（2026-11-04 实测踩到）。
const all = new Set()
for (const name of readdirSync(stylesDir).filter((f) => f.endsWith('.css'))) {
  for (const token of definedIn(read(name))) all.add(token)
}

const pick = (predicate) => [...all].filter(predicate).sort()

const tokens = {
  alias: pick((t) => t.startsWith('--dsw-alias-')),
  radius: pick((t) => t.startsWith('--dsw-radius-')),
  elevation: pick((t) => t.includes('elevation')),
  focusRing: pick((t) => t.includes('focus-ring')),
  maskBlur: pick((t) => t.includes('mask-blur')),
  font: pick((t) => t.startsWith('--dsw-font-')),
  transition: pick((t) => t.startsWith('--ds-transition')),
  ease: pick((t) => t.startsWith('--ds-ease')),
  menuSurface: pick((t) => t.startsWith('--dsw-menu-')),
}

/** 宿主上下文变量：不在主题清单里，由宿主的 AppFrame 注入（带 fallback）。 */
const hostContextVariables = ['--dsh-frame-chrome-top', '--dsh-frame-overlay-top']

// 基线锚从 checkout 派生（version 取根 package.json，commit 取 HEAD）：
// 旧实现把两个锚写成手写字面量（version 走不存在的 package.json 字段的 fallback），
// DSH 升级重跑 vendor 后 token 列表更新而锚原地不动，清单从此谎报来源且 --check 照样过
//（2026-11-05 复审发现）。
const rootPkg = JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8'))
if (typeof rootPkg.version !== 'string' || rootPkg.version.length === 0) {
  console.error(`[vendor-tokens] checkout 根 package.json 缺 version 字段，无法确定基线：${join(checkout, 'package.json')}`)
  process.exit(1)
}
const dshVersion = rootPkg.version
const dshCommit = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

const doc = {
  dshVersion,
  dshCommit,
  source: 'DSH packages/client/ui-theme/src/styles/*.css（整个目录，非个别文件）',
  note: '官方 token 定义快照（pinned）。用于校验 kit 组件引用的 token 是否真实存在——拼错或官方已删除的 token 会让样式静默失效（var() 解析失败 → 声明被丢弃），格式类护栏看不出来。DSH 升级时用 scripts/vendor-tokens.mjs 重新生成。',
  hostContextVariables,
  hostContextNote: '宿主 AppFrame 注入的上下文变量（packages/client/ui-layout/src/client/AppFrame.module.css），带 fallback 值；不是主题 token，不在官方清单里。',
  tokens: Object.fromEntries(Object.entries(tokens).filter(([, v]) => v.length > 0)),
}

const serialized = JSON.stringify(doc, null, 2) + '\n'

if (CHECK) {
  if (!existsSync(outPath)) {
    console.error(`[vendor-tokens] --check：清单不存在（先跑一次生成）：${outPath}`)
    process.exit(1)
  }
  if (readFileSync(outPath, 'utf8') !== serialized) {
    console.error('[vendor-tokens] --check：清单与 checkout 源码不一致（官方 token 有增删改）')
    console.error('[vendor-tokens] 重新生成：DSH_CHECKOUT=<path> node scripts/vendor-tokens.mjs')
    process.exit(1)
  }
  console.log(`[vendor-tokens] --check 通过：清单与 checkout 逐字节一致（${Object.values(tokens).flat().length} 个 token）`)
} else {
  writeFileSync(outPath, serialized)
  console.log(`[vendor-tokens] 已生成 ${outPath}（${Object.values(tokens).flat().length} 个 token）`)
}
