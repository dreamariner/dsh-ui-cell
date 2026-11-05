// dsh-ui-cell 的自守护栏（防模板腐烂）。
//
// 五条纪律，每条都对应一类真实事故：
//   1. registry 条目与源码文件一一对应（防「registry 说 ready 但文件没了」）
//   2. CSS 只引用 --dsw-alias-* / --dsw-radius-* 等稳定 token 面
//      （DSH 官方规范：第三方插件只许引用 alias 层；引用 static 层会在官方换肤时失配）
//   3. token 名必须真实存在（拼错 = var() 解析失败 = 整条声明静默丢弃，零报错）
//   4. 生成物的命名空间干净：最终类名跨组件唯一、keyframes 带前缀
//      （消费端把所有组件样式拼进同一个 <style>，官方 CSS Modules 的 per-file 哈希隔离
//      在这里不存在。2026-11-05 复审抓到 .duk-wrap / .duk-icon 被两个组件重复定义、
//      后定义者静默覆盖前者，按钮 icon 被染成 input 的 tertiary 色）
//   5. 组件间依赖显式建模且与实际导入一致
//      （复审曾实证：单加 risk-confirmation 产出 3 个悬空导入的坏产物，CLI 退出码还是 0）
import { existsSync, readFileSync, readdirSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addComponents, buildStyleModule, cssClassNames, loadRegistry, prefixCss, srcDir } from '../cli/add.ts'

/** 官方 token 清单（pinned 快照，由 scripts/vendor-tokens.mjs 从 DSH checkout 生成）。 */
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

/** 与转换器同规则的最终类名（键为原类名时的值）：根类用组件名，其余加组件名段。 */
const finalName = (componentName: string, name: string, prefix: string): string =>
  name === componentName ? `${prefix}${name}` : `${prefix}${componentName}-${name}`

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
  // 官方保真复制的组件原样使用了 static / specific / 字面色（tooltip/toast 用 static 调色板、
  // hover-card 字面深底、zoom-controls light-dark 阴影等）。纪律的本意是拦「手写样式」别用
  // 不稳定面；对逐字节保真的官方复制，保真优先，升级重 diff 时跟随官方。例外逐文件登记，
  // 未登记的文件出现这些形态仍然要红。
  const OFFICIAL_EXCEPTIONS = new Map<string, RegExp[]>([
    ['tooltip.css', [/--dsw-static-/]],
    ['toast.css', [/--dsw-static-/]],
    ['hover-card.css', [/--dsw-specific-/, /#[0-9a-fA-F]{3,8}\b/]],
    ['image-lightbox.css', [/--dsw-specific-/]],
    ['user-message-bubble.css', [/--dsw-specific-/]],
    ['zoom-controls.css', [/#[0-9a-fA-F]{3,8}\b/]],
  ])

  it('CSS 只引用 alias / radius / elevation / focus-ring 等稳定 token 面（官方复制件按登记例外）', () => {
    // 禁：--dsw-static-*（调色板原子色，官方换肤会重映射）、--dsw-specific-*（场景级）、
    // 字面颜色（hex / rgb / hsl / oklch 等必吃字面值的函数族 / 具名色）。
    // color-mix( 不在禁列：tag.css 按官方同款写法用它把 alias token 与 transparent 混合。
    const forbidden = [
      /--dsw-static-/,
      /--dsw-specific-/,
      /#[0-9a-fA-F]{3,8}\b/,
      /\brgba?\(/,
      /\b(?:hsla?|oklch|oklab|lch|lab)\(/,
      /:\s*(red|blue|green|white|black|gray|grey)\b/,
    ]
    const offenders: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const text = readFileSync(join(src, file), 'utf8')
        const allowed = OFFICIAL_EXCEPTIONS.get(file) ?? []
        for (const re of forbidden) {
          if (allowed.some((a) => a.source === re.source)) continue
          if (re.test(text)) offenders.push(`${file}: ${String(re)}`)
        }
      }
    }
    expect(offenders, `CSS 引用了不该引用的 token / 字面颜色（官方复制件请在 OFFICIAL_EXCEPTIONS 登记并写明理由）：\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('token 存在性（拼错 = 样式静默失效）', () => {
  // 官方复制件的原样引用豁免（保真优先，带理由）：
  // --dsl-command-whitespace：官方命名空间疑为 dsl 笔误的跨组件覆盖钩子，CommandText 消费侧带
  // fallback（pre），定义方在 TerminalBlock/ui-tool；保真保留。
  const EXISTENCE_EXCEPTIONS = new Map<string, string[]>([['command-text.css', ['--dsl-command-whitespace']]])

  it('组件引用的每个 var(--x) 都是官方清单里的 token（或宿主上下文变量）', () => {
    // CSS 规范：var() 解析失败 → 整条声明被静默丢弃 → 样式不生效且**无任何报错**。
    // 格式类护栏（禁 static/specific/字面色）看不出「token 名拼错」或「官方已删除」，
    // 故这里按 pinned 的官方清单做存在性校验。
    const known = new Set([...KNOWN_TOKENS, ...HOST_CONTEXT])
    const offenders: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      // 条目自身脚本文件里 inline 设置的变量（style/setProperty 的 '--x' 键）视为已知
      const setInJs = new Set<string>()
      for (const file of item.files) {
        if (!/\.(tsx|ts)$/.test(file)) continue
        const js = readFileSync(join(src, file), 'utf8')
        for (const m of js.matchAll(/'(--[a-z0-9-]+)'/g)) setInJs.add(m[1]!)
      }
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const text = readFileSync(join(src, file), 'utf8')
        // 同文件内自定义属性定义（`--x:`）视为已知：组件局部变量（如 segmented-tabs 的 inset）
        const definedHere = new Set([...text.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((d) => d[1]!))
        for (const m of text.matchAll(/var\((--[a-z0-9-]+)/g)) {
          const token = m[1]!
          if (known.has(token)) continue
          if (setInJs.has(token)) continue
          if (definedHere.has(token)) continue
          // --dsh-anchored-*：useAnchoredPosition 的钩子契约变量（setter 在行为模块里，
          // 消费方 css 只读），跨条目引用故按前缀放行
          if (/^--dsh-anchored-/.test(token)) continue
          if (EXISTENCE_EXCEPTIONS.get(file)?.includes(token)) continue
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
    expect(tokenInventory.tokens.static?.length, 'static 分类为空——官方复制件的 static 引用会误判不存在').toBeGreaterThan(20)
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

  it('清单记录了来源与基线（基线锚由 vendor 从 checkout 派生，升级重跑自动更新）', () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'tokens', 'official-tokens.json'), 'utf8'),
    ) as { source: string; dshVersion: string; dshCommit: string; hostContextVariables: string[] }
    expect(manifest.source).toContain('ui-theme')
    expect(manifest.dshVersion).toMatch(/^0\.2\./)
    expect(manifest.dshCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(manifest.hostContextVariables).toContain('--dsh-frame-chrome-top')
  })
})

describe('命名空间（消费端把全部组件样式拼进同一个 <style>）', () => {
  it('全部组件的最终类名跨组件唯一（2026-11-05 复审：.duk-wrap/.duk-icon 曾跨组件互覆）', () => {
    const seen = new Map<string, string>()
    const dups: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const module = buildStyleModule(readFileSync(join(src, file), 'utf8'), 'duk-', item.name)
        for (const m of module.matchAll(/'([A-Za-z][\w-]*)': '(duk-[^']+)'/g)) {
          const cls = m[2]!
          if (seen.has(cls) && seen.get(cls) !== item.name) {
            dups.push(`${cls}: ${seen.get(cls)} 与 ${item.name} 重复`)
          }
          seen.set(cls, item.name)
        }
      }
    }
    expect(dups, `跨组件重复的最终类名（同文档级联，后定义覆盖先定义）：\n${dups.join('\n')}`).toEqual([])
  })

  it('keyframes 名带插件前缀（动画名是文档级命名空间，两插件同名 keyframes 后者全局覆盖前者）', () => {
    const offenders: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const cssText = readFileSync(join(src, file), 'utf8')
        if (!/@keyframes/.test(cssText)) continue
        const module = buildStyleModule(cssText, 'duk-', item.name)
        for (const m of module.matchAll(/@keyframes\s+([\w-]+)/g)) {
          if (!m[1]!.startsWith('duk-')) offenders.push(`${item.name}: @keyframes ${m[1]}`)
        }
      }
    }
    expect(offenders, `未前缀化的 @keyframes：\n${offenders.join('\n')}`).toEqual([])
  })

  it('modal 的 keyframes 定义与 animation 引用同步改名（改定义不改引用 = 动画静默失效）', () => {
    const module = buildStyleModule(readFileSync(join(src, 'modal.css'), 'utf8'), 'duk-', 'modal')
    expect(module).toContain('@keyframes duk-modal-modalEnter')
    expect(module).toContain('animation: duk-modal-modalEnter')
    expect(module).not.toContain('animation: modalEnter')
  })

  it('CSS 选择器加前缀时带组件名段（且不误伤属性值里的点号）', () => {
    const css = '.button { padding: 0 0.5px; }\n.primary:hover { background: var(--x); }'
    const out = prefixCss(css, 'duk-', 'button')
    expect(out).toContain('.duk-button')
    expect(out).toContain('.duk-button-primary:hover')
    expect(out).toContain('0 0.5px') // 小数点不是类选择器
  })

  it('生成的类名表覆盖 CSS 里的全部类选择器', () => {
    const css = '.tag { color: red; }\n.tag[data-tone="info"] { color: blue; }'
    const module = buildStyleModule(css, 'duk-', 'tag')
    for (const name of cssClassNames(css)) {
      expect(module, `类名表缺少 ${name}`).toContain(`'${name}': '${finalName('tag', name, 'duk-')}'`)
    }
  })

  it('表以原类名为键、值为组件段前缀名（动态索引 css[variant] 才不会断）', () => {
    const module = buildStyleModule('.primary { color: red; }', 'duk-', 'button')
    expect(module).toContain("'primary': 'duk-button-primary'")
    expect(module).not.toContain("'duk-button-primary': ")
  })

  it('链式类选择器（.a.b）逐段改名且进表（官方 menu/toast 在用，2026-11-06 起支持）', () => {
    const css = '.list.compactList { color: red; }\n.icon.success { color: blue; }'
    const module = buildStyleModule(css, 'duk-', 'menu')
    expect(module).toContain('.duk-menu-list.duk-menu-compactList')
    expect(module).toContain('.duk-menu-icon.duk-menu-success')
    expect(module).toContain("'list': 'duk-menu-list'")
    expect(module).toContain("'compactList': 'duk-menu-compactList'")
    expect(module).toContain("'icon': 'duk-menu-icon'")
    expect(module).toContain("'success': 'duk-menu-success'")
  })
})

describe('依赖闭包（单加一个组件必须产出可独立编译的完整产物）', () => {
  const ownerOfFile = new Map<string, string>()
  for (const item of registry.items) for (const file of item.files) ownerOfFile.set(file, item.name)

  it('registry 声明的 dependencies 与组件实际相对导入一致', () => {
    const bad: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      const computed = new Set<string>()
      for (const file of item.files) {
        if (!/\.(tsx|ts)$/.test(file)) continue
        const text = readFileSync(join(src, file), 'utf8')
        for (const m of text.matchAll(/from\s+'(\.[^']+)'/g)) {
          const owner = ownerOfFile.get(m[1]!.replace(/^\.\//, ''))
          if (owner && owner !== item.name) computed.add(owner)
        }
      }
      const declared = new Set(item.dependencies ?? [])
      const missing = [...computed].filter((d) => !declared.has(d))
      const extra = [...declared].filter((d) => !computed.has(d))
      if (missing.length > 0 || extra.length > 0) {
        bad.push(`${item.name}: 实际依赖 [${[...computed].join(', ')}]，声明 [${[...declared].join(', ')}]`)
      }
    }
    expect(bad, `dependencies 声明与实际导入不符（add 的闭包解析据此工作）：\n${bad.join('\n')}`).toEqual([])
  })

  it('add 单个组件自动带上依赖闭包，产物无悬空导入（复审实证：risk-confirmation 单加曾缺 3 个导入）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uikit-closure-'))
    try {
      addComponents(['risk-confirmation'], { to: dir })
      const files = new Set(readdirSync(join(dir, 'src', 'client', 'ui')))
      // 闭包内容点查：risk-confirmation → button / modal（连带其行为依赖）/ icon
      for (const need of ['risk-confirmation.tsx', 'risk-confirmation-css.ts', 'button.tsx', 'button-css.ts', 'modal.tsx', 'modal-css.ts', 'icons.tsx', 'use-modal-layer.ts', 'focus.ts', 'keyboard-composition.ts']) {
        expect(files.has(need), `依赖闭包缺 ${need}`).toBe(true)
      }
      // 泛化检查：产物里任何相对导入都必须落在产物内
      const dangling: string[] = []
      for (const file of files) {
        const text = readFileSync(join(dir, 'src', 'client', 'ui', file), 'utf8')
        for (const m of text.matchAll(/from\s+'(\.[^']+)'/g)) {
          if (!files.has(m[1]!.replace(/^\.\//, ''))) dangling.push(`${file} → ${m[1]}`)
        }
      }
      expect(dangling, `产物有悬空导入（单加即坏）：\n${dangling.join('\n')}`).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('类名前缀化', () => {
  it('注释里的类名不被当真（既不进表也不被改写）', () => {
    const css = '/* .ghost 是注释里的样子 */\n.button { color: red; }'
    const names = cssClassNames(css)
    expect(names).toEqual(['button'])
    const out = prefixCss(css, 'duk-', 'button')
    expect(out).toContain('/* .ghost 是注释里的样子 */')
    expect(out).toContain('.duk-button')
    expect(out).not.toContain('.duk-ghost')
  })
})
