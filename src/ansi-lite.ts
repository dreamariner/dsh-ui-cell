// ansi-lite：官方 ansi.ts 的零依赖替身（anser 不引入）。
// 上游对应：packages/client/ui-primitives/src/ansi.ts @ dsh v0.2.2-rc.1 (66491b05e3)
// 覆盖 SGR 子集：0/1/2/3/4/9、30-37/90-97 前景、40-47/100-107 背景、38;5;n 与 38;2;r;g;b、
// 48 同理、39/49 复位。基础 16 色按官方映射表落主题 token；256/truecolor 落字面 rgb。
// 与官方 ansi.ts 的输出契约一致：parseAnsiLines(text) → AnsiLine[]（span.text + span.style）。

import type { CSSProperties } from 'react'

/** One run of terminal text; style is undefined for text that carries no SGR state. */
export interface AnsiSpan {
  text: string
  style: CSSProperties | undefined
}

/** The spans of one output line, in order. */
export type AnsiLine = readonly AnsiSpan[]

/** 官方基础色 → 主题 token 映射（ansi.ts 原表照抄）。 */
const TOKEN_BY_BASIC_RGB: Record<string, string> = {
  '0,0,0': 'var(--dsw-alias-label-primary)',
  '255,255,255': 'var(--dsw-alias-label-primary)',
  '85,85,85': 'var(--dsw-alias-label-tertiary)',
  '187,0,0': 'var(--dsw-alias-state-error-primary)',
  '255,85,85': 'var(--dsw-alias-state-error-secondary)',
  '0,187,0': 'var(--dsw-alias-state-success-primary)',
  '0,255,0': 'var(--dsw-alias-state-success-secondary)',
  '187,187,0': 'var(--dsw-alias-state-warn-primary)',
  '255,255,85': 'var(--dsw-alias-state-warn-secondary)',
  '0,0,187': 'var(--dsw-alias-state-business-primary)',
  '85,85,255': 'var(--dsw-static-blue-400)',
  '0,187,187': 'var(--dsw-static-blue-600)',
  '85,255,255': 'var(--dsw-static-blue-500)',
}

const BASIC_RGB = [
  '0,0,0', '170,0,0', '0,170,0', '170,85,0', '0,0,170', '170,0,170', '0,170,170', '170,170,170',
  '85,85,85', '255,85,85', '85,255,85', '255,255,85', '85,85,255', '255,85,255', '85,255,255', '255,255,255',
]

interface SgrState {
  fg: string | undefined
  bg: string | undefined
  bold: boolean
  dim: boolean
  italic: boolean
  underline: boolean
  strike: boolean
}

const INITIAL: SgrState = { fg: undefined, bg: undefined, bold: false, dim: false, italic: false, underline: false, strike: false }

function colorOf(code: number, params: number[], index: number, base: number): { value: string | undefined; next: number } {
  if (code === 38 || code === 48) {
    const mode = params[index]
    if (mode === 5) {
      const n = params[index + 1] ?? 0
      const rgb = n < 16 ? BASIC_RGB[n] : undefined
      return { value: rgb ?? `rgb(${n}, ${n}, ${n})`, next: index + 2 }
    }
    if (mode === 2) {
      const r = params[index + 1] ?? 0
      const g = params[index + 2] ?? 0
      const b = params[index + 3] ?? 0
      return { value: `rgb(${r}, ${g}, ${b})`, next: index + 4 }
    }
    return { value: undefined, next: index + 1 }
  }
  if (code >= 30 && code <= 37) return { value: BASIC_RGB[code - 30], next: index }
  if (code >= 90 && code <= 97) return { value: BASIC_RGB[code - 90 + 8], next: index }
  if (code >= 40 && code <= 47) return { value: BASIC_RGB[code - 40], next: index }
  if (code >= 100 && code <= 107) return { value: BASIC_RGB[code - 100 + 8], next: index }
  void base
  return { value: undefined, next: index }
}

function styleOf(state: SgrState): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (state.fg !== undefined) {
    style.color = TOKEN_BY_BASIC_RGB[state.fg] ?? `rgb(${state.fg})`
  }
  if (state.bg !== undefined) {
    style.background = TOKEN_BY_BASIC_RGB[state.bg] ?? `rgb(${state.bg})`
  }
  if (state.bold) style.fontWeight = 600
  if (state.dim) style.opacity = 0.7
  if (state.italic) style.fontStyle = 'italic'
  if (state.underline) style.textDecoration = 'underline'
  if (state.strike) style.textDecoration = state.underline ? 'underline line-through' : 'line-through'
  return Object.keys(style).length === 0 ? undefined : style
}

function applySgr(state: SgrState, params: number[]): void {
  let index = 0
  while (index < params.length) {
    const code = params[index] ?? 0
    if (code === 0) { Object.assign(state, INITIAL) }
    else if (code === 1) state.bold = true
    else if (code === 2) state.dim = true
    else if (code === 3) state.italic = true
    else if (code === 4) state.underline = true
    else if (code === 9) state.strike = true
    else if (code === 22) { state.bold = false; state.dim = false }
    else if (code === 23) state.italic = false
    else if (code === 24) state.underline = false
    else if (code === 29) state.strike = false
    else if (code === 39) state.fg = undefined
    else if (code === 49) state.bg = undefined
    else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97) || code === 38) {
      const applied = colorOf(code, params, index + 1, code >= 90 ? 8 : 0)
      state.fg = applied.value
      index = applied.next
    } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107) || code === 48) {
      const applied = colorOf(code, params, index + 1, code >= 100 ? 8 : 0)
      state.bg = applied.value
      index = applied.next
    }
    index += 1
  }
}

/** 解析带 ANSI SGR 的文本为行 span（官方 parseAnsiLines 输出契约）。 */
export function parseAnsiLines(text: string): AnsiLine[] {
  const lines: AnsiSpan[][] = []
  let current: AnsiSpan[] = []
  let state: SgrState = { ...INITIAL }
  let buffer = ''
  const flushBuffer = () => {
    if (buffer !== '') {
      const style = styleOf(state)
      current.push(style === undefined ? { text: buffer, style: undefined } : { text: buffer, style })
      buffer = ''
    }
  }
  // 去 CR（进度重绘）与终端标题等非 SGR 转义（ESC 以 \u001B 转义书写，不落真实控制字节）
  const esc = String.fromCharCode(27)
  const cleaned = text
    .replace(/\r/g, '')
    .replace(new RegExp(esc + '\\][^\\x07]*(\\x07|$)', 'g'), '')
    .replace(new RegExp(esc + '\\[[0-9;?]*[A-HJKSTfhlmsu]', 'g'), (match) => (match.endsWith('m') ? match : ''))
  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]
    if (char === '\u001B' && cleaned[i + 1] === '[') {
      const end = cleaned.indexOf('m', i)
      if (end !== -1) {
        flushBuffer()
        const params = cleaned.slice(i + 2, end).split(';').map((p) => Number.parseInt(p === '' ? '0' : p, 10)).filter((n) => !Number.isNaN(n))
        applySgr(state, params)
        i = end
        continue
      }
    }
    if (char === '\n') { flushBuffer(); lines.push(current); current = []; continue }
    buffer += char
  }
  flushBuffer()
  lines.push(current)
  return lines
}
