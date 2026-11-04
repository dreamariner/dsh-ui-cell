// dsh-ui-kit 的自守护栏（防模板腐烂）。
//
// 三条纪律，每条都对应一类真实事故：
//   1. registry 条目与源码文件一一对应（防「registry 说 ready 但文件没了」）
//   2. CSS 只引用 --dsw-alias-* / --dsw-radius-* 等稳定 token 面
//      （DSH 官方规范：第三方插件只许引用 alias 层；引用 static 层会在官方换肤时失配）
//   3. 生成的类名表覆盖 CSS 里出现的全部类选择器
//      （防「CSS 里有类但表里没有 → 该类名失效 → 样式静默丢失」）
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildStyleModule, cssClassNames, loadRegistry, prefixCss, srcDir } from '../cli/add.ts'

/** 官方 token 清单（pinned 快照，由 scripts/gen-tokens.mjs 从 DSH checkout 生成）。 */
const tokenInventory = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'tokens', 'official-tokens.json'), 'utf8'),
) as {
  tokens: Record<string, string[]>
  hostContextVariables: string[]
}
const KNOWN_TOKENS = new Set(Object.values(tokenInventory.tokens).flat())
const HOST_CONTEXT = new Set(tokenInventory.hostContextVariables)

const registry = loadRegistry()
const src = srcDir()

describe('registry 一致性', () => {
  it('每个 ready 条目的文件都存在', () => {
    const missing: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!existsSync(join(src, file))) missing.push(`${item.name}: ${file}`)
      }
    }
    expect(missing, `registry 声明了但源码缺失：\n${missing.join('\n')}`).toEqual([])
  })

  it('planned 条目不得有源码（避免半成品被 add 出去）', () => {
    const plannedWithFiles = registry.items.filter(i => i.status === 'planned' && i.files.length > 0)
    expect(plannedWithFiles.map(i => i.name)).toEqual([])
  })

  it('条目名唯一', () => {
    const names = registry.items.map(i => i.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('token 纪律（DSH 官方规范）', () => {
  it('CSS 只引用 alias / radius / elevation / focus-ring 等稳定 token 面', () => {
    // 禁：--dsw-static-*（调色板原子色，官方换肤会重映射）、--dsw-specific-*（场景级）、
    // 字面颜色（hex / rgb / 具名色）。禁 --dsh-* 是误报（--dsh-segment-count 是组件自有变量）。
    const forbidden = [/--dsw-static-/, /--dsw-specific-/, /#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/, /:\s*(red|blue|green|white|black|gray|grey)\b/]
    const offenders: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const text = readFileSync(join(src, file), 'utf8')
        for (const re of forbidden) {
          if (re.test(text)) offenders.push(`${file}: ${String(re)}`)
        }
      }
    }
    expect(offenders, `CSS 引用了不该引用的 token / 字面颜色：\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('token 存在性（拼错 = 样式静默失效）', () => {
  it('组件引用的每个 var(--x) 都是官方清单里的 token（或宿主上下文变量）', () => {
    // CSS 规范：var() 解析失败 → 整条声明被静默丢弃 → 样式不生效且**无任何报错**。
    // 格式类护栏（禁 static/specific/字面色）看不出「token 名拼错」或「官方已删除」，
    // 故这里按 pinned 的官方清单做存在性校验。
    const known = new Set([...KNOWN_TOKENS, ...HOST_CONTEXT])
    const offenders: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const text = readFileSync(join(src, file), 'utf8')
        for (const m of text.matchAll(/var\((--[a-z0-9-]+)/g)) {
          const token = m[1]!
          // 组件自有变量（--dsh-segment-count 等，由组件自己设置）不在官方清单里
          if (known.has(token)) continue
          if (/^--dsh-segment-/.test(token)) continue
          offenders.push(`${file}: ${token}`)
        }
      }
    }
    expect(offenders, `引用了清单里不存在的 token（会静默失效）：\n${offenders.join('\n')}`).toEqual([])
  })

  it('组件自有变量（--dsh-segment-*）在源码里真的被设置（否则 var() 解析失败）', () => {
    // 这类变量由组件在 JS 里 inline style 设置（SegmentedControl 的 --dsh-segment-count/index），
    // CSS 只消费。它们必须真被设置——否则同样是静默失效。
    const tsx = readFileSync(join(src, 'segmented-control.tsx'), 'utf8')
    expect(tsx).toContain("'--dsh-segment-count'")
    expect(tsx).toContain("'--dsh-segment-index'")
  })

  it('官方清单本身非空且覆盖 alias 层（清单空了校验就形同虚设）', () => {
    expect(tokenInventory.tokens.alias.length).toBeGreaterThan(50)
    expect(KNOWN_TOKENS.size).toBeGreaterThan(80)
    // ⚠ 分类不得整类为空：早期脚本只扫三个 css 文件，elevation/focus-ring/mask-blur
    // 三类静默丢失 → 官方明明有的 token 被判「不存在」→ 存在性护栏误报。
    // 故每类都要有下限，清单生成范围被改窄时立刻红。
    expect(tokenInventory.tokens.radius.length, 'radius 分类为空——生成范围可能变窄了').toBeGreaterThan(3)
    expect(tokenInventory.tokens.elevation.length, 'elevation 分类为空——生成范围可能变窄了').toBeGreaterThan(2)
    expect(tokenInventory.tokens.focusRing.length, 'focusRing 分类为空——生成范围可能变窄了').toBeGreaterThan(0)
    expect(tokenInventory.tokens.maskBlur.length, 'maskBlur 分类为空——生成范围可能变窄了').toBeGreaterThan(0)
  })
})

describe('与上游同步（需要 DSH_CHECKOUT，缺省跳过）', () => {
  // 范式同 dreamariner/dsh-typert-protocol 的 protocol-vendor.spec.ts：
  // checkout 在场时校验 pinned 清单与上游**逐字节一致**（token 增删改名都要重新同步）；
  // 不在场则跳过——pinned 快照本就是为了「没有 checkout 也能工作」。
  const checkout = process.env.DSH_CHECKOUT?.replace(/\/$/, '')
  const stylesDir = checkout ? join(checkout, 'packages', 'client', 'ui-theme', 'src', 'styles') : undefined
  const upstreamPresent = stylesDir !== undefined && existsSync(stylesDir)

  it.skipIf(!upstreamPresent)('token 清单与上游 checkout 逐字节一致', async () => {
    const { execFileSync } = await import('node:child_process')
    const out = execFileSync(
      process.execPath,
      [join(import.meta.dirname, '..', 'scripts', 'vendor-tokens.mjs'), '--check'],
      {
        cwd: join(import.meta.dirname, '..'),
        encoding: 'utf8',
        env: { ...process.env, DSH_CHECKOUT: checkout! },
      },
    )
    expect(out).toContain('通过')
  })

  it('清单记录了来源与基线（DSH 升级时据此核对）', () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'tokens', 'official-tokens.json'), 'utf8'),
    ) as { source: string; dshVersion: string; dshCommit: string; hostContextVariables: string[] }
    expect(manifest.source).toContain('ui-theme')
    expect(manifest.dshVersion).toMatch(/^0\.2\./)
    expect(manifest.dshCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(manifest.hostContextVariables).toContain('--dsh-frame-chrome-top')
  })
})

describe('类名前缀化', () => {
  it('CSS 选择器被正确加前缀（且不误伤属性值里的点号）', () => {
    const css = '.button { padding: 0 0.5px; }\n.primary:hover { background: var(--x); }'
    const out = prefixCss(css, 'duk-')
    expect(out).toContain('.duk-button')
    expect(out).toContain('.duk-primary:hover')
    expect(out).toContain('0 0.5px') // 小数点不是类选择器
  })

  it('生成的类名表覆盖 CSS 里的全部类选择器', () => {
    const css = '.tag { color: red; }\n.tag[data-tone="info"] { color: blue; }'
    const module = buildStyleModule(css, 'duk-', 'tag')
    for (const name of cssClassNames(css)) {
      expect(module, `类名表缺少 ${name}`).toContain(`'${name}': 'duk-${name}'`)
    }
  })

  it('表以原类名为键、值为前缀化名（动态索引 css[variant] 才不会断）', () => {
    const module = buildStyleModule('.primary { color: red; }', 'duk-', 'button')
    expect(module).toContain("'primary': 'duk-primary'")
    expect(module).not.toContain("'duk-primary': ")
  })
})
