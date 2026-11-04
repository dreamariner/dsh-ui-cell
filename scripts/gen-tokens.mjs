#!/usr/bin/env node
// dsh-ui-kit :: gen-tokens.mjs — 从 DSH checkout 生成官方 token 清单（pinned 快照）
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
// ## 何时重跑
//
// DSH 升级时（token 可能增删改名）。checkout 不在场时清单仍然有效——它是 pinned 快照。
//
// ## 用法
//
//   DSH_CHECKOUT=<path> node scripts/gen-tokens.mjs            # 生成并写盘
//   DSH_CHECKOUT=<path> node scripts/gen-tokens.mjs --check    # 校验与现盘一致（CI/升级自检）

import process from 'node:process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshCheckout } from './lib/paths.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outPath = join(repoRoot, 'tokens', 'official-tokens.json')
const CHECK = process.argv.includes('--check')

const checkout = dshCheckout()
if (!checkout || !existsSync(checkout)) {
  console.error('[gen-tokens] 未设置 DSH_CHECKOUT（或路径不存在）。本脚本只在升级 DSH 时需要：')
  console.error('[gen-tokens]   export DSH_CHECKOUT=<与 dshVersion 同版的 deepseek-harness 检出>')
  process.exit(1)
}
const stylesDir = join(checkout, 'packages', 'client', 'ui-theme', 'src', 'styles')
if (!existsSync(stylesDir)) {
  console.error(`[gen-tokens] checkout 里找不到 ui-theme 样式目录：${stylesDir}`)
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

const designPlatform = definedIn(read('design-platform.css'))
const base = definedIn(read('base.css'))
const onboarding = definedIn(read('onboarding.css'))
const all = new Set([...designPlatform, ...base, ...onboarding])

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

const doc = {
  dshVersion: JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).dshVersion ?? '0.2.1-rc.3',
  dshCommit: '1f81c047fc48fa190a683e469daa699857e9afe8',
  source: 'DSH packages/client/ui-theme/src/styles/{design-platform,base,onboarding}.css',
  note: '官方 token 定义快照（pinned）。用于校验 kit 组件引用的 token 是否真实存在——拼错或官方已删除的 token 会让样式静默失效（var() 解析失败 → 声明被丢弃），格式类护栏看不出来。DSH 升级时用 scripts/gen-tokens.mjs 重新生成。',
  hostContextVariables,
  hostContextNote: '宿主 AppFrame 注入的上下文变量（packages/client/ui-layout/src/client/AppFrame.module.css），带 fallback 值；不是主题 token，不在官方清单里。',
  tokens: Object.fromEntries(Object.entries(tokens).filter(([, v]) => v.length > 0)),
}

const serialized = JSON.stringify(doc, null, 2) + '\n'

if (CHECK) {
  if (!existsSync(outPath)) {
    console.error(`[gen-tokens] --check：清单不存在（先跑一次生成）：${outPath}`)
    process.exit(1)
  }
  if (readFileSync(outPath, 'utf8') !== serialized) {
    console.error('[gen-tokens] --check：清单与 checkout 源码不一致（官方 token 有增删改）')
    console.error('[gen-tokens] 重新生成：DSH_CHECKOUT=<path> node scripts/gen-tokens.mjs')
    process.exit(1)
  }
  console.log(`[gen-tokens] --check 通过：清单与 checkout 逐字节一致（${Object.values(tokens).flat().length} 个 token）`)
} else {
  writeFileSync(outPath, serialized)
  console.log(`[gen-tokens] 已生成 ${outPath}（${Object.values(tokens).flat().length} 个 token）`)
}
