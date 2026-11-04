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
