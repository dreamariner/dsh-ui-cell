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

/**
 * 基础层（foundation.css）定义的实现层变量（issue 012）。
 * 不在官方 token 清单里，但由本仓自己定义，故算「已知 token」。
 */
const FOUNDATION_VARS = new Set(
  [...readFileSync(join(src, 'foundation.css'), 'utf8').matchAll(/(--dsh-space-\d+)\s*:/g)].map(m => m[1]!),
)

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
  // zoom-controls light-dark 阴影等）。纪律的本意是拦「手写样式」别用
  // 不稳定面；对逐字节保真的官方复制，保真优先，升级重 diff 时跟随官方。例外逐文件登记，
  // 未登记的文件出现这些形态仍然要红。
  // hover-card.css 曾带字面深底（#2C2C2E / #FFFFFF，旧版上游的写法），2026-11-19 对齐
  // 现行上游（hovercard alias token 族）后恢复逐字节一致，退出例外表 —— 它不再被允许字面色。
  // json-tree.css 同理：上游 rc.5 把字面色板换成 --dsw-alias-json-tree-* token 族并删掉
  // 暗色覆盖块，本仓跟随后退出例外表（2026-11-19，issue 030）。
  // tooltip.css / toast.css 的 --dsw-static-* 例外同样失效：上游 rc.5 把气泡文字色
  // 与 toast 动作色都换成 alias token，本仓已跟 → 一并退出例外表。
  const OFFICIAL_EXCEPTIONS = new Map<string, RegExp[]>([
    ['hover-card.css', [/--dsw-specific-/]],
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
    const known = new Set([...KNOWN_TOKENS, ...HOST_CONTEXT, ...FOUNDATION_VARS])
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

  // 基线锚一致：registry 的组件基线与 pinned token 快照必须指向同一个上游版本。
  // 2026-11-19 之前没有这条护栏，于是出现过「token 清单已到 rc.5、registry 还停 rc.1」
  // 的错位（组件基线与 token 基线说的不是一回事），而当时没有任何检查会报。
  it('registry 的基线锚与 pinned token 快照一致（同一个上游版本）', () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'tokens', 'official-tokens.json'), 'utf8'),
    ) as { dshVersion: string; dshCommit: string }
    expect(registry.dshVersion, 'registry 的 dshVersion 与 pinned 快照不一致').toBe(manifest.dshVersion)
    expect(registry.dshCommit, 'registry 的 dshCommit 与 pinned 快照不一致').toBe(manifest.dshCommit)
  })
})

describe('上游 rc.5 的具体改动已落地（2026-11-19 审计，issue 030）', () => {
  const css = (name: string): string => readFileSync(join(src, name), 'utf8')
  const tsx = (name: string): string => readFileSync(join(src, name), 'utf8')

  it('json-tree：字面色板已换成 alias token 族（rc.5 起上游这么做，且不再有暗色覆盖块）', () => {
    const text = css('json-tree.css')
    for (const key of ['property', 'string', 'number', 'keyword', 'punctuation', 'icon', 'hover']) {
      expect(text, `json-tree 没用上 --dsw-alias-json-tree-${key}`).toContain(`var(--dsw-alias-json-tree-${key})`)
    }
    // 不能再有字面色板与暗色覆盖块（上游 rc.5 删掉了）
    expect(text).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(text).not.toMatch(/rgba?\(/)
    expect(text).not.toContain('data-ds-dark-theme')
  })

  it('tooltip：macOS 桌面端的气泡不参与窗口拖拽（rc.5 起上游加的 darwin no-drag）', () => {
    expect(css('tooltip.css')).toMatch(/html\[data-platform='darwin'\][^\n]*no-drag/)
  })

  it('animated-rows：视口按浏览器窗口裁剪，且快照里带 viewport（rc.5 起上游的可见性判定）', () => {
    const text = tsx('animated-rows.tsx')
    expect(text).toContain('function visibleViewport(')
    expect(text).toMatch(/top:\s*Math\.max\(0, rect\.top\)/)
    expect(text).toMatch(/snapshot\.viewport/)
  })

  it('button：上游 rc.5 的注释措辞已同步（保真件的注释也跟）', () => {
    expect(tsx('button.tsx')).toContain('backed by its --dsw-alias-button-* token family')
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
        // 只认包名形状的 specifier（npm 包名不含空格等字符）：否则源码里
        // 'rename from ' 这类英文字面量会被误判成 import 声明（误报）。
        if (!/^(@[\w-]+\/)?[\w.-]+(\/[\w.-]+)*$/.test(spec)) continue
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

  // 样式注入顺序（2026-11-10 起，dsh-pilot 筛选行药丸化实证）：
  // 复制件的类名共存于同一个 <style>，同特异性规则按注入顺序后者胜。
  // 复用别件样式的组件（segmented-tabs 复用 pill）排到被复用件之前，
  // 其覆盖规则就全部失效，底件外观整个盖上来。
  it('闭包解析的顺序本身就是注入顺序（deps 先于本体）', () => {
    const ordered = resolveDependencies(['segmented-tabs'], registry)
    expect(ordered.indexOf('pill'), 'pill 必须先于 segmented-tabs').toBeLessThan(ordered.indexOf('segmented-tabs'))
  })

  it('add 的 note 给出本次闭包的注入顺序（消费端照抄即可，不再靠猜）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uicell-order-'))
    try {
      const result = addComponents(['segmented-tabs'], { to: dir })
      const note = result.notes.find(n => n.includes('pill → segmented-tabs'))
      expect(note, 'note 里必须有按依赖序的注入顺序段').toBeDefined()
      expect(note, 'note 必须写明顺序为何重要（同特异性共存类，后者胜）').toContain('同特异性')
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

/**
 * 公开面不泄露本机与个人私有信息（2026-11-18 起）。
 *
 * 本仓是公开仓（GitHub），文档站会发到 GitHub Pages，npm 包会发到 registry。
 * 示例里的一个本机绝对路径，就等于把使用者的用户名与目录结构贴到公开网上；
 * 个人私有项目与人格相关的名字同理（见内部规范：公开面一律用通用表述）。
 *
 * 这条护栏把「活面」（源码 / 脚本 / 文档 / 技能手册 / 生成物）扫一遍：
 *   · 本机用户目录：/Users/<名>/ 、/home/<名>/ 、C:\Users\<名>\
 *   · 私有名字：Luna 人格、luna-dsh 及其插件、人格相关称谓
 * 命中即红。历史 git blob 不在扫描面里（改写历史不是本仓的职责）。
 */
describe('公开面不泄露本机与个人私有信息', () => {
  const REPO = join(import.meta.dirname, '..')

  /** 活面文件（含 docs/issues 与 skills；生成物 index.html 也算，它会被发到 GitHub Pages）。 */
  function publicFiles(): string[] {
    const out: string[] = []
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (/\.(ts|tsx|css|md|mjs|json|html)$/.test(e.name)) out.push(p)
      }
    }
    for (const d of [
      src,
      join(REPO, 'cli'),
      join(REPO, 'scripts'),
      join(REPO, 'skills'),
      join(REPO, 'docs'),
      join(REPO, 'tokens'),
    ]) walk(d)
    for (const f of ['registry.json', 'README.md', 'AGENTS.md', 'package.json']) out.push(join(REPO, f))
    const self = import.meta.filename
    return out.filter(p => !p.endsWith(self))
  }

  it('活面不写本机用户目录的绝对路径', () => {
    // /Users/<名>/ 、 /home/<名>/ 、 C:\Users\<名>\
    const pattern = /(?:^|["'`(\s])(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)[A-Za-z0-9._-]+[\\/]/g
    const bad = publicFiles()
      .map(p => ({ p, hit: readFileSync(p, 'utf8').match(pattern) }))
      .filter(x => x.hit !== null)
      .map(x => `${x.p.replace(`${REPO}/`, '')}: ${x.hit?.[0].trim()}`)
    expect(bad, `写了本机用户目录路径（公开仓会把它贴到网上，改用中性示例路径）：\n${bad.join('\n')}`).toEqual([])
  })

  it('活面不出现个人私有项目与人格相关的名字（公开面一律用通用表述）', () => {
    // Luna 人格、其插件仓、以及人格相关称谓（内部规范 A 方案：公开面不得提及）
    const needles = ['Luna', 'luna-dsh', 'plugin-memory', 'plugin-skills', '林老师']
    const bad = publicFiles()
      .map(p => ({ p, text: readFileSync(p, 'utf8') }))
      .filter(x => needles.some(n => x.text.includes(n)))
      .map(x => `${x.p.replace(`${REPO}/`, '')}: ${needles.filter(n => x.text.includes(n)).join(', ')}`)
    expect(bad, `出现了个人私有信息（公开面一律用通用表述）：\n${bad.join('\n')}`).toEqual([])
  })
})

/**
 * 间距与动效规范（issue 012：官方底座上扩展，不另起主题）。
 *
 * 官方分工（`docs/web-styling.md` + `.agents/skills/dsh-client-ui-ux/`）：
 *   · **动效**归 `ui-theme` 持有（--ds-transition-duration{,-fast,-slow} / --ds-ease-in-out），
 *     官方原话「shared colors, typography, elevation, and motion belong to the theme package」。
 *     故本仓**不新增任何全局动效变量**，自有件只许用官方那四个 token。
 *   · **间距数值刻度**官方明确不给（spacing 参考末句「This skill defines no numeric scale」，
 *     SKILL.md 说「numeric scales stay with their implementation owners」），
 *     故本仓作为第三方插件组件的实现方在 `foundation.css` 定义 `--dsh-space-*`。
 *   · 官方 53 件保真复制件一律不动（保真优先，DSH 升级时跟随上游 re-diff）。
 */
describe('文档站的代码块不许被 JSX 折行', () => {
  it('demo 源码里 <pre> 的多行内容必须走 {`...`} 表达式（裸文本的换行会被 JSX 折成空格）', () => {
    // JSX 的文本子节点会把「首尾空白 + 换行」删掉、内部换行折成一个空格：
    //   <pre>npm i -D x
    //   npx y</pre>
    // 渲染出来是「npm i -D x npx y」一行。代码块被折行，读者复制下来就是坏的命令
    // （2026-11-18 实测：快速开始那三段全被折成了一行）。
    // 写法：<pre>{`第一行
    // 第二行`}</pre>（模板字面量保留换行；里面的 \n 要写成 \\n）。
    const dir = join(import.meta.dirname, '..', 'docs', 'wiki', 'demos')
    const bad: string[] = []
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.tsx')) continue
      const text = readFileSync(join(dir, file), 'utf8')
      const re = /<pre[^>]*>([^<{]*\n[^<{]*)/g
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        bad.push(`${file}:${text.slice(0, m.index).split('\n').length}`)
      }
    }
    expect(bad, `<pre> 里的裸文本多行会被 JSX 折成一行（要用 {\`...\`} 模板字面量）：\n${bad.join('\n')}`).toEqual([])
  })
})

describe('间距与动效规范（issue 012）', () => {
  /** 官方三档时长（ui-theme 持有）。 */
  const OFFICIAL_DURATIONS = new Set([
    'var(--ds-transition-duration)',
    'var(--ds-transition-duration-fast)',
    'var(--ds-transition-duration-slow)',
  ])

  /**
   * 官方刻度（4px 底座，2px 半步）。
   * 改刻度是一次有意的决定：这里与 `foundation.css` 必须一起改（护栏会红）。
   */
  const CANONICAL_SPACES: Record<string, string> = {
    '1': '1px',
    '2': '2px',
    '4': '4px',
    '6': '6px',
    '8': '8px',
    '12': '12px',
    '16': '16px',
    '20': '20px',
    '24': '24px',
    '32': '32px',
  }

  /**
   * 组合值例外：缩进 / 让位这类**由图标尺寸与偏移推导出来**的值。
   * 它们保证内容与触发器文字对齐，是关系不是节奏，故不归一到刻度
   * （官方 spacing 参考也强调距离由关系决定，不由数值决定）。
   */
  const SPACING_COMPOSED = new Map<string, string[]>([
    ['select.css', ['28px']], // 右内边距 = 8（右偏移）+ 14（chevron）+ 6（间隔）
    ['collapsible.css', ['28px']], // 内容缩进 = 8（触发器左内边距）+ 14（chevron）+ 6（间隔）
    ['accordion.css', ['34px']], // 内容缩进 = 12（触发器左内边距）+ 14（chevron）+ 8（头部 gap）
  ])

  /** 本仓自有件的 CSS（官方保真复制件不在此列）。 */
  const ownedCss = (): { item: RegistryItem; file: string }[] => {
    const out: { item: RegistryItem; file: string }[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      if (item.upstream) continue // 官方保真复制件：保真优先，跟随上游
      for (const file of item.files) if (file.endsWith('.css')) out.push({ item, file })
    }
    return out
  }

  it('基础层 foundation.css 的刻度与期望表一致（改刻度是有意的决定，两处一起改）', () => {
    const text = readFileSync(join(src, 'foundation.css'), 'utf8')
    const defined: Record<string, string> = {}
    for (const m of text.matchAll(/--dsh-space-(\d+)\s*:\s*([^;]+);/g)) defined[m[1]!] = m[2]!.trim()
    expect(defined, 'foundation.css 的间距刻度与期望表不符').toEqual(CANONICAL_SPACES)
  })

  it('基础层被 add 每次都带上（漏注入 = var(--dsh-space-*) 解析失败 = 静默掉样式）', () => {
    const base = registry.items.filter(i => i.role === 'base' && i.status === 'ready')
    expect(base.length, 'registry 里没有基础层条目').toBeGreaterThan(0)
    for (const item of base) {
      const closed = resolveDependencies(['button'], registry)
      expect(closed[0], '基础层必须排在闭包第一位（样式注入顺序：被复用者先注入）').toBe(item.name)
      const dir = mkdtempSync(join(tmpdir(), 'uicell-base-'))
      try {
        addComponents(['button'], { to: dir })
        const files = new Set(readdirSync(join(dir, 'src', 'client', 'ui')))
        for (const file of item.files) {
          const baseName = file.replace(/\.css$/, '')
          expect(
            files.has(file.endsWith('.css') ? `${baseName}-css.ts` : file),
            `单加组件没带上基础层 ${file}`,
          ).toBe(true)
        }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
  })

  it('自有件引用的 --dsh-space-* 都在基础层有定义（拼错 = var() 解析失败 = 静默掉样式）', () => {
    const bad: string[] = []
    for (const { file } of ownedCss()) {
      const css = readFileSync(join(src, file), 'utf8')
      for (const m of css.matchAll(/var\(--dsh-space-(\d+)/g)) {
        if (!FOUNDATION_VARS.has(`--dsh-space-${m[1]}`)) bad.push(`${file}: --dsh-space-${m[1]}`)
      }
    }
    expect(bad, `引用了基础层没有的间距档（会静默失效）：\n${bad.join('\n')}`).toEqual([])
  })

  it('自有件的间距声明不写 px 字面量（组合值与发丝补偿除外）', () => {
    const bad: string[] = []
    for (const { file } of ownedCss()) {
      const allowed = SPACING_COMPOSED.get(file) ?? []
      const css = readFileSync(join(src, file), 'utf8')
      css.split('\n').forEach((line, idx) => {
        const m = line.match(/^\s*(padding|margin|gap|row-gap|column-gap)(-[a-z]+)?\s*:\s*([^;]+);/)
        if (!m) return
        for (const v of m[3]!.matchAll(/(-?\d*\.?\d+)px/g)) {
          const num = Number(v[1]!)
          if (num === 0) continue // 复位值不是节奏值
          if (Math.abs(num) <= 0.5) continue // 发丝补偿（-0.5px）
          if (allowed.includes(`${v[1]}px`)) continue // 组合值例外
          bad.push(`${file}:${idx + 1}  ${m[0].trim()}`)
        }
      })
    }
    expect(
      bad,
      `间距写了 px 字面量（请用 var(--dsh-space-*)；组合值登记到 SPACING_COMPOSED 并写明构成）：\n${bad.join('\n')}`,
    ).toEqual([])
  })

  it('自有件的过渡只许官方三档时长与官方缓动（动效归 ui-theme 持有，本仓不另起全局动效变量）', () => {
    const bad: string[] = []
    for (const { file } of ownedCss()) {
      const css = readFileSync(join(src, file), 'utf8')
      css.split('\n').forEach((line, idx) => {
        const m = line.match(/^\s*(transition|animation)(-[a-z]+)?\s*:\s*([^;]+);/)
        if (!m) return
        const value = m[3]!
        const isAnimation = m[1] === 'animation'
        // 循环节律（呼吸 / 旋转 / 闪烁）不是交互时长，豁免字面时长与匀速 / 离散缓动
        const looping = isAnimation && /\binfinite\b/.test(value)
        if (!looping) {
          for (const d of value.matchAll(/(?<![\w.-])(\d*\.?\d+)(?:ms|s)\b/g)) {
            bad.push(`${file}:${idx + 1}  字面时长 ${d[0]}`)
          }
        }
        for (const e of value.matchAll(/(?<![\w-])(ease(?:-in|-out|-in-out)?|cubic-bezier|linear|steps)(?![\w-])/g)) {
          if (looping && (e[1] === 'linear' || e[1] === 'steps')) continue
          bad.push(`${file}:${idx + 1}  字面缓动 ${e[1]}`)
        }
        for (const t of value.matchAll(/var\((--ds-transition-duration[a-z-]*)\)/g)) {
          if (!OFFICIAL_DURATIONS.has(`var(${t[1]})`)) bad.push(`${file}:${idx + 1}  非官方时长 token ${t[1]}`)
        }
      })
    }
    expect(
      bad,
      `动效没走官方 token（--ds-transition-duration{,-fast,-slow} / --ds-ease-in-out）：\n${bad.join('\n')}`,
    ).toEqual([])
  })

  it('带动画的自有件都有 prefers-reduced-motion 降级（缺降级 = 该动效对动效敏感用户是硬伤）', () => {
    const bad: string[] = []
    for (const { file } of ownedCss()) {
      const css = readFileSync(join(src, file), 'utf8')
      if (!/^\s*(transition|animation)(-[a-z]+)?\s*:/m.test(css)) continue
      if (!/prefers-reduced-motion/.test(css)) bad.push(file)
    }
    expect(bad, `带动画但没有减少动效降级：\n${bad.join('\n')}`).toEqual([])
  })

  it('自有件的文字不跟随宿主字号（font: inherit = 控件大小随宿主漂移）', () => {
    // 2026-11-18 实测（issue 014）：ConfigField 的控件写 `font: inherit`，而宿主
    // （DSH 应用与文档站）都没显式字号，浏览器默认 16px —— 同一行里 label 是显式
    // 13px、控件却是 16px，控件比标题大一号，行的层级读不出来。
    // 自有件必须钉在主题的字体档位上（--dsw-font-*），这样同一个组件在不同宿主里长得一样。
    // 官方复制件不在此列：内容块（markdown / code / json）跟随宿主文字大小是有意为之。
    const bad: string[] = []
    for (const { file } of ownedCss()) {
      const css = readFileSync(join(src, file), 'utf8')
      if (/font:\s*inherit/.test(css)) bad.push(file)
    }
    expect(bad, `自有件用了 font: inherit（文字会跟随宿主字号）：\n${bad.join('\n')}`).toEqual([])
  })

  it('本仓的原生 select 一律收掉浏览器自绘箭头（自绘箭头跟字号脱钩，CSS 挪不动）', () => {
    // 2026-11-18 复审实测（issue 014）：浏览器自绘的下拉箭头**不随字号缩放**，控件归到
    // 14px 档之后它显得比文字还重（粗黑），跟本仓其它地方的细线 chevron（Select /
    // Accordion / Collapsible / DisclosureRow）不是一个语言；而且实测 Chromium 的原生
    // 箭头不随 padding-right 移动（12px 与 28px 两档位置完全一致），CSS 改不动它，
    // 只能换自定义图标 —— 那就得在源头挡住，别等复审再抓。
    // 口径：渲染原生 <select> 的组件，其样式里必须有 appearance: none（配 DSH chevron）。
    const bad: string[] = []
    for (const item of registry.items) {
      if (item.status !== 'ready') continue
      const rendersSelect = item.files
        .filter(f => f.endsWith('.tsx'))
        .some(f => /<select[\s>]/.test(readFileSync(join(src, f), 'utf8')))
      if (!rendersSelect) continue
      const css = item.files
        .filter(f => f.endsWith('.css'))
        .map(f => readFileSync(join(src, f), 'utf8'))
        .join('\n')
      if (!/appearance:\s*none/.test(css)) bad.push(item.name)
    }
    expect(bad, `原生 select 没收掉浏览器自绘箭头（要改用 DSH chevron）：\n${bad.join('\n')}`).toEqual([])
  })
})
