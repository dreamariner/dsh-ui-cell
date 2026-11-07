// @vitest-environment node
// （registry 护栏是纯静态检查，不需要 DOM；markdown 渲染测试在 jsdom 里跑）
// dsh-ui-cell 的自守护栏（防模板腐烂）。
//
// 五条纪律，每条都对应一类真实事故：
//   1. registry 条目与源码文件一一对应（防「registry 说 ready 但文件没了」）
//   2. CSS 只引用 --dsw-alias-* / --dsw-radius-* 等稳定 token 面
//      （DSH 官方规范：第三方插件只许引用 alias 层；引用 static 层会在官方换肤时失配）
//   3. token 名必须真实存在（拼错 = var() 解析失败 = 整条声明静默丢弃，零报错）
//   4. 生成物的命名空间干净：最终类名跨组件唯一、keyframes 带前缀
//      （消费端把所有组件样式拼进同一个 <style>，官方 CSS Modules 的 per-file 哈希隔离
//      在这里不存在。2026-11-05 复审抓到 .duc-wrap / .duc-icon 被两个组件重复定义、
//      后定义者静默覆盖前者，按钮 icon 被染成 input 的 tertiary 色）
//   5. 组件间依赖显式建模且与实际导入一致
//      （复审曾实证：单加 risk-confirmation 产出 3 个悬空导入的坏产物，CLI 退出码还是 0）
import { existsSync, readFileSync, readdirSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addComponents, buildStyleModule, collectNpmDependencies, cssClassNames, installCommand, loadRegistry, prefixCss, resolveDependencies, srcDir } from '../cli/add.ts'
import type { Registry, RegistryItem } from '../cli/add.ts'

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

  it('每个源文件只归属一个条目（跨条目共享走 dependencies；重复列 files 会让 add 报假性已存在）', () => {
    const owner = new Map<string, string>()
    const bad: string[] = []
    for (const item of registry.items) {
      for (const file of item.files) {
        const prev = owner.get(file)
        if (prev === undefined) owner.set(file, item.name)
        else bad.push(`${file}：${prev} 与 ${item.name} 都列进 files（共享件应独立成条目，经 dependencies 引用）`)
      }
    }
    expect(bad, `源文件被多个条目声明（2026-11-06 审计：hover-card 曾自带 overlay-top-margin.ts，与同名共享条目重复，单次 add 会报「已存在未覆盖」误导消费端）：\n${bad.join('\n')}`).toEqual([])
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
    ['json-tree.css', [/#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/]],
    ['image-lightbox.css', [/--dsw-specific-/]],
    ['user-message-bubble.css', [/--dsw-specific-/]],
    ['zoom-controls.css', [/#[0-9a-fA-F]{3,8}\b/]],
    // shiki.css：官方 ui-theme 的同一份文件、同一批 hex（语法高亮自己的调色板，
    // 不是 DSH 主题色）；背景/前景仍别名到 alias token。保真保留。
    ['shiki.css', [/#[0-9a-fA-F]{3,8}\b/]],
    // code-block.css：官方 CodeBlock.module.css 原样（`background-color: rgb(255 255 255 / 0)`
    // 是「透明」的写法，不是颜色值）。保真保留。
    ['code-block.css', [/\brgba?\(/]],
    // markdown-text.css：官方 MarkdownText.module.css 原样（同样的 rgba 写法）。保真保留。
    ['markdown-text.css', [/\brgba?\(/]],
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
          // --dsl-*：宿主页面级覆盖钩子（各页面按场景设值，primitives 消费侧全部带 fallback）
          if (/^--dsl-/.test(token)) continue
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
  it('全部组件的最终类名跨组件唯一（2026-11-05 复审：.duc-wrap/.duc-icon 曾跨组件互覆）', () => {
    const seen = new Map<string, string>()
    const dups: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      for (const file of item.files) {
        if (!file.endsWith('.css')) continue
        const module = buildStyleModule(readFileSync(join(src, file), 'utf8'), 'duc-', item.name)
        for (const m of module.matchAll(/'([A-Za-z][\w-]*)': '(duc-[^']+)'/g)) {
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
        const module = buildStyleModule(cssText, 'duc-', item.name)
        for (const m of module.matchAll(/@keyframes\s+([\w-]+)/g)) {
          if (!m[1]!.startsWith('duc-')) offenders.push(`${item.name}: @keyframes ${m[1]}`)
        }
      }
    }
    expect(offenders, `未前缀化的 @keyframes：\n${offenders.join('\n')}`).toEqual([])
  })

  it('modal 的 keyframes 定义与 animation 引用同步改名（改定义不改引用 = 动画静默失效）', () => {
    const module = buildStyleModule(readFileSync(join(src, 'modal.css'), 'utf8'), 'duc-', 'modal')
    expect(module).toContain('@keyframes duc-modal-modalEnter')
    expect(module).toContain('animation: duc-modal-modalEnter')
    expect(module).not.toContain('animation: modalEnter')
  })

  it('CSS 选择器加前缀时带组件名段（且不误伤属性值里的点号）', () => {
    const css = '.button { padding: 0 0.5px; }\n.primary:hover { background: var(--x); }'
    const out = prefixCss(css, 'duc-', 'button')
    expect(out).toContain('.duc-button')
    expect(out).toContain('.duc-button-primary:hover')
    expect(out).toContain('0 0.5px') // 小数点不是类选择器
  })

  it('生成的类名表覆盖 CSS 里的全部类选择器', () => {
    const css = '.tag { color: red; }\n.tag[data-tone="info"] { color: blue; }'
    const module = buildStyleModule(css, 'duc-', 'tag')
    for (const name of cssClassNames(css)) {
      expect(module, `类名表缺少 ${name}`).toContain(`'${name}': '${finalName('tag', name, 'duc-')}'`)
    }
  })

  it('表以原类名为键、值为组件段前缀名（动态索引 css[variant] 才不会断）', () => {
    const module = buildStyleModule('.primary { color: red; }', 'duc-', 'button')
    expect(module).toContain("'primary': 'duc-button-primary'")
    expect(module).not.toContain("'duc-button-primary': ")
  })

  it('链式类选择器（.a.b）逐段改名且进表（官方 menu/toast 在用，2026-11-06 起支持）', () => {
    const css = '.list.compactList { color: red; }\n.icon.success { color: blue; }'
    const module = buildStyleModule(css, 'duc-', 'menu')
    expect(module).toContain('.duc-menu-list.duc-menu-compactList')
    expect(module).toContain('.duc-menu-icon.duc-menu-success')
    expect(module).toContain("'list': 'duc-menu-list'")
    expect(module).toContain("'compactList': 'duc-menu-compactList'")
    expect(module).toContain("'icon': 'duc-menu-icon'")
    expect(module).toContain("'success': 'duc-menu-success'")
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
    const dir = mkdtempSync(join(tmpdir(), 'uicell-closure-'))
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

  // 2026-11-06：原先这条护栏只跑 risk-confirmation 一个条目，漏掉了
  // code-toolbar / diff-block 的跨条目 css 引用（`import cardCss from './code-card.css'`），
  // 复制出去就是悬空导入（消费端只有 code-card-css.ts）。改为**逐个 ready 条目**全跑。
  it('每个 ready 条目单加，产物都无悬空导入（跨条目 css 引用也要能落地）', () => {
    const dangling: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      const dir = mkdtempSync(join(tmpdir(), 'uicell-item-'))
      try {
        addComponents([item.name], { to: dir })
        const uiDir = join(dir, 'src', 'client', 'ui')
        const files = new Set(readdirSync(uiDir))
        for (const file of files) {
          const text = readFileSync(join(uiDir, file), 'utf8')
          for (const m of text.matchAll(/from\s+'(\.[^']+)'/g)) {
            const target = m[1]!.replace(/^\.\//, '')
            if (!files.has(target)) dangling.push(`${item.name}: ${file} → ${m[1]}`)
          }
        }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
    expect(dangling, `单加即坏（悬空导入）：\n${dangling.join('\n')}`).toEqual([])
  })
})

describe('依赖分层（tier / npmDependencies，2026-11-06 起 issue 005）', () => {
  /**
   * 基础依赖：所有组件都在用、且消费端必然自带（react / clsx / react-dom）。
   * 它们由 本仓的文档统一交代（wiki 01：「运行时依赖只有 react + clsx」），
   * **不**逐条目声明，否则 94 个条目要重复写三遍，且改版本要改 94 处。
   * npmDependencies 只管「条目特有」的重依赖。
   */
  const BASELINE_DEPS = new Set(['react', 'react-dom', 'clsx'])

  /**
   * 条目源码里的**裸 npm import**（不是相对路径、不是 node: 内置、不是基础依赖）。
   * 这些包必须被条目声明在 npmDependencies 里：add 复制的是源码，
   * 消费端装不上就编译不过（而且是消费端编译时才炸，本仓 自己看不出来）。
   */
  function bareNpmImports(item: { files: string[] }): Set<string> {
    const out = new Set<string>()
    for (const file of item.files) {
      if (!/\.(tsx|ts)$/.test(file)) continue
      const text = readFileSync(join(src, file), 'utf8')
      for (const m of text.matchAll(/from\s+'([^']+)'/g)) {
        const spec = m[1]!
        if (spec.startsWith('.') || spec.startsWith('node:')) continue
        // 取包名（@scope/name 的第二段）
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!
        if (BASELINE_DEPS.has(pkg)) continue
        out.add(pkg)
      }
    }
    return out
  }

  it('条目声明的 npmDependencies 与源码里的裸 import 双向一致', () => {
    const bad: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      const used = bareNpmImports(item)
      const declared = new Set(Object.keys(item.npmDependencies ?? {}))
      // 类型包的解析方式：`import type { Root } from 'mdast'` 实际要装的是 @types/mdast
      const satisfied = (pkg: string) => declared.has(pkg) || declared.has(`@types/${pkg}`)
      const missing = [...used].filter(p => !satisfied(p)).sort()
      // 反向：声明的 @types/X 若源码 import 了 X，算已用上（类型包的对应关系）
      const extra = [...declared].filter(p => !used.has(p) && !used.has(p.replace(/^@types\//, ''))).sort()
      if (missing.length > 0) bad.push(`${item.name}: 源码用了但没声明 [${missing.join(', ')}]`)
      if (extra.length > 0) bad.push(`${item.name}: 声明了但源码没用 [${extra.join(', ')}]`)
    }
    expect(bad, `npmDependencies 声明与源码不符（消费端装不上就编译不过）：\n${bad.join('\n')}`).toEqual([])
  })

  it('content 档的依赖闭包里必须有 npm 依赖（可以由依赖传递，不必自己直接 import）', () => {
    // code-toolbar / code-block 自己不 import shiki，是经 code-highlighting 传递的，
    // 所以判据是**闭包**，不是条目自身。
    const bad: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready' || item.tier !== 'content') continue
      const closure = resolveDependencies([item.name], registry)
      const hasAny = closure.some(name => {
        const dep = registry.items.find(i => i.name === name)
        return Object.keys(dep?.npmDependencies ?? {}).length > 0
      })
      if (!hasAny) bad.push(item.name)
    }
    expect(bad, `content 档的闭包里没有任何 npm 依赖（带依赖的档位不能是空壳）：\n${bad.join('\n')}`).toEqual([])
  })

  it('atom 档（默认）不得声明 npm 依赖（原子层保持零重依赖）', () => {
    const bad = registry.items
      .filter(i => i.status === 'ready' && (i.tier ?? 'atom') === 'atom')
      .filter(i => Object.keys(i.npmDependencies ?? {}).length > 0)
      .map(i => i.name)
    expect(bad, `atom 档却声明了 npm 依赖（要么升 content 档，要么去掉）：\n${bad.join('\n')}`).toEqual([])
  })

  it('npmDependencies 同包跨条目版本范围一致（冲突会让 add 报错、--with-deps 写出装不上的范围）', () => {
    const seen = new Map<string, { range: string; via: string }>()
    const bad: string[] = []
    for (const item of registry.items) {
      for (const [pkg, range] of Object.entries(item.npmDependencies ?? {})) {
        const prev = seen.get(pkg)
        if (prev && prev.range !== range) bad.push(`${pkg}：${prev.via} 声明 ${prev.range}，${item.name} 声明 ${range}`)
        else if (!prev) seen.set(pkg, { range, via: item.name })
      }
    }
    expect(bad, `同包被声明了不同版本范围（消费端无法同时满足，须统一）：\n${bad.join('\n')}`).toEqual([])
  })

  it('缺失依赖的安装建议保留 scoped 包（对 pkg@range 串 split("@") 的截断回归，006）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uicell-inst-'))
    try {
      const result = addComponents(['code-block'], { to: dir })
      const note = result.notes.find(n => n.includes('装：'))
      expect(note, 'code-block 闭包缺 shiki 系依赖，note 里应有安装建议').toBeDefined()
      const cmd = note!.split('装：')[1]!.split('；')[0]!
      expect(cmd, `安装命令里 scoped 包被截断：${cmd}`).toContain('@shikijs/langs@4.4.3')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('同包版本范围冲突直接报错（不静默产出装不上的范围，006）', () => {
    const item = (name: string, range: string): RegistryItem => ({
      name, type: 'registry:ui', status: 'ready', description: '', files: [], upstream: null,
      npmDependencies: { diff: range },
    })
    const fake: Registry = {
      name: 'fake', dshVersion: '0', dshCommit: '0',
      items: [item('a', '^9.0.0'), item('b', '^8.0.0')],
    }
    expect(() => collectNpmDependencies(['a', 'b'], fake)).toThrow(/两个版本范围/)
  })

  it('安装建议由「包名 → 范围」表直接生成（installCommand 与 note 同源，006）', () => {
    const cmd = installCommand({ shiki: '4.4.3', '@shikijs/langs': '4.4.3', '@types/mdast': '^4.0.0' })
    expect(cmd).toBe('pnpm add shiki@4.4.3 @shikijs/langs@4.4.3 @types/mdast@^4.0.0')
  })

  it('单次 add 内同名产物静默去重，不报假性已存在（006）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uicell-dedup-'))
    try {
      const result = addComponents(['hover-card'], { to: dir })
      expect(result.skipped, 'hover-card 闭包内不应有任何重复产物').toEqual([])
      expect(result.notes.join('\n')).not.toContain('已存在未覆盖')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  /**
   * 原样注入通道（rawStyles）的两条纪律（2026-11-06，issue 005 收尾）：
   *
   *   a) raw 样式模块**没有组件 tsx 引用它**（它的类名表是空的，组件用不上），
   *      消费端是「显式 import { styles } 拼进 <style> 注入器」的模式，
   *      所以这类文件天然是**孤儿**——消费端不知道要拼它，漏了就静默丢样式
   *      （公式不排版 / 代码高亮没颜色，零报错）。故 add 的 note 必须点名它。
   *   b) registry 的 rawStyles 登记不能漏：漏登记 = 该文件被当普通样式前缀化，
   *      第三方契约类名（.katex / --shiki-*）被改名失配。
   */
  it('raw 样式模块在 add 的 note 里被点名（消费端是孤儿，漏拼就静默丢样式）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uicell-raw-'))
    try {
      const result = addComponents(['markdown-text'], { to: dir })
      const uiDir = join(dir, 'src', 'client', 'ui')
      // 每个 raw 样式产物文件都要在 note 里出现
      const rawOutputs = registry.items
        .filter(i => i.status === 'ready')
        .flatMap(i => (i.rawStyles ?? []).map(f => ({ item: i.name, file: f })))
        .filter(({ item, file }) => {
          const closure = resolveDependencies(['markdown-text'], registry)
          if (!closure.includes(item)) return false
          return existsSync(join(uiDir, file.replace(/\.css$/, '-css.ts')))
        })
      expect(rawOutputs.length, 'markdown-text 闭包里应有 raw 样式（katex.css）').toBeGreaterThan(0)
      const notes = result.notes.join('\n')
      const missing = rawOutputs
        .map(({ file }) => file.replace(/\.css$/, '-css.ts'))
        .filter(name => !notes.includes(name))
      expect(missing, `raw 样式模块没在 add 的 note 里点名（消费端会漏拼）：\n${missing.join('\n')}`).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('rawStyles 登记的每个文件都真实存在（登记漏项 = 被当普通样式前缀化）', () => {
    const bad: string[] = []
    for (const item of registry.items) {
      for (const file of item.rawStyles ?? []) {
        if (!existsSync(join(src, file))) bad.push(`${item.name}: ${file}`)
        // raw 文件必须在本条目的 files 里，否则 add 不会复制它
        if (!item.files.includes(file)) bad.push(`${item.name}: ${file}（未列入 files）`)
      }
    }
    expect(bad, `rawStyles 登记与实际文件不符：\n${bad.join('\n')}`).toEqual([])
  })

  it('raw 样式模块不产出类名表（第三方契约类名不能改名）', () => {
    const module = buildStyleModule('.katex { display: inline-block; }', 'duc-', 'katex', true)
    expect(module).toContain('export const css: Record<string, string> = {}')
    expect(module).toContain('.katex')
    expect(module).not.toContain('duc-katex')
  })
})

describe('类名前缀化', () => {
  it('注释里的类名不被当真（既不进表也不被改写）', () => {
    const css = '/* .ghost 是注释里的样子 */\n.button { color: red; }'
    const names = cssClassNames(css)
    expect(names).toEqual(['button'])
    const out = prefixCss(css, 'duc-', 'button')
    expect(out).toContain('/* .ghost 是注释里的样子 */')
    expect(out).toContain('.duc-button')
    expect(out).not.toContain('.duc-ghost')
  })

  // 2026-11-06：官方 markdown 家族有 11 处 `:global(...)`（`.katex` / `.md-code-block` /
  // `.line` 等），它们是第三方契约（katex 自己的 CSS、shiki 主题、宿主钩子），
  // 改名就失配 → 既不进类名表也不改名。
  it(':global(...) 内的类名不改名也不进类名表（第三方契约）', () => {
    const css = [
      '.markdown :global(.katex-display) { display: block; }',
      '.tableScroll:global(.md-table-wide):focus-visible { outline: 1px solid red; }',
      '.numbered :where(pre) code > :global(.line)::before { content: "1"; }',
      '.markdown { color: red; }',
    ].join('\n')
    // 不进表
    expect(cssClassNames(css)).toEqual(['markdown', 'tableScroll', 'numbered'])
    const out = prefixCss(css, 'duc-', 'markdown-text')
    // :global 内的类名原样保留
    expect(out).toContain(':global(.katex-display)')
    expect(out).toContain(':global(.md-table-wide)')
    expect(out).toContain(':global(.line)')
    expect(out).not.toContain('duc-markdown-text-katex')
    expect(out).not.toContain('duc-markdown-text-md-table-wide')
    expect(out).not.toContain('duc-markdown-text-line')
    // 本组件自己的类名照常改名
    expect(out).toContain('.duc-markdown-text-markdown')
    expect(out).toContain('.duc-markdown-text-tableScroll')
    expect(out).toContain('.duc-markdown-text-numbered')
  })
})

describe('命名一致性（003 改名 dsh-ui-cell，007 起护栏固化）', () => {
  /**
   * 旧名 dsh-ui-kit 的三类残留曾遍布注释、registry 描述与生成脚本（007 全量清理）。
   * 本护栏防回流。扫面（活面）排除两类：
   *   - docs/issues/**：历史记录，不追溯改写（007 裁定；003 本身就是改名记录）
   *   - 本 spec 自身：下面两个检查的正则与 needle 字面量会自伤
   */
  const REPO = join(import.meta.dirname, '..')

  function livingFiles(withIndexHtml: boolean): string[] {
    const out: string[] = []
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'issues') continue
        const p = join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (/\.(ts|tsx|css|md|mjs|json|html)$/.test(e.name)) out.push(p)
      }
    }
    for (const d of [src, join(REPO, 'cli'), join(REPO, 'scripts'), join(REPO, 'tests'), join(REPO, 'docs', 'wiki'), join(REPO, 'tokens')]) walk(d)
    for (const f of ['registry.json', 'README.md', 'AGENTS.md']) out.push(join(REPO, f))
    const self = import.meta.filename
    return out.filter(p => !p.endsWith(self) && (withIndexHtml || !p.endsWith('index.html')))
  }

  /** 合法保留面：曾用名句式、web 平台伪元素（::-webkit-scrollbar）、第三方资产的内联 base64。 */
  const stripLegit = (text: string): string =>
    text.replace(/dsh-ui-kit/g, '').replace(/webkits?/gi, '').replace(/base64,[A-Za-z0-9+/=]+/g, '')

  it('活面不再有旧名 kit 的自指用法（dsh-ui-kit 曾用名句式与 webkit 除外）', () => {
    const bad = livingFiles(false)
      .map(p => ({ p, hit: stripLegit(readFileSync(p, 'utf8')).match(/kit/i) }))
      .filter(x => x.hit !== null)
      .map(x => `${x.p.replace(`${REPO}/`, '')}: ${x.hit?.[0]}`)
    expect(bad, `旧名 kit 残留（应改「本仓」或属于合法保留面）：\n${bad.join('\n')}`).toEqual([])
  })

  it('默认前缀与全部示例统一 duc-（duk- 是旧名缩写，只允许存在于历史记录与消费端存量）', () => {
    const needle = ['du', 'k-'].join('') // 拼接构造，避免本文件自伤
    const bad = livingFiles(true)
      .filter(p => readFileSync(p, 'utf8').includes(needle))
      .map(p => p.replace(`${REPO}/`, ''))
    expect(bad, `旧前缀 duk- 残留：\n${bad.join('\n')}`).toEqual([])
  })
})
