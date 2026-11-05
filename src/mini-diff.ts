// mini-diff：官方 DiffBlock 依赖的 diff 包 structuredPatch 的零依赖替身。
// 上游对应：npm diff 的 structuredPatch（kit 只用到行级 + context 窗口 + maxEditLength 三个能力）。
// 算法：LCS 动态规划（行数千级内代价可接受）；超 maxEditLength 返回 undefined（调用方有整段回退）。

export interface MiniDiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

export interface StructuredPatchOptions {
  context?: number
  maxEditLength?: number
}

/** 与官方调用形态对齐：数组从第 3/4 参传入，options 在第 7 参。 */
export function structuredPatch(
  _oldStr: string,
  _newStr: string,
  oldLines: readonly string[] | string,
  newLines: readonly string[] | string,
  _oldHeader?: unknown,
  _newHeader?: unknown,
  options?: StructuredPatchOptions,
): { hunks: MiniDiffHunk[] } | undefined {
  // 官方调用经 normalize 传拼接串（每行尾带 \n）；数组形态直接用
  const linesOf = (value: readonly string[] | string): string[] => {
    if (typeof value === 'string') {
      if (value === '') return []
      return value.replace(/\n$/, '').split('\n')
    }
    return [...value]
  }
  const a = linesOf(oldLines)
  const b = linesOf(newLines)
  const context = options?.context ?? 4
  // 编辑距离预算：近似用 |Δ长度| + 不匹配行数上限，超了直接放弃（调用方回退为整段 -/+）
  const budget = options?.maxEditLength
  if (budget !== undefined && Math.max(a.length, b.length) > 4000) return undefined
  // LCS 表
  const rows = a.length + 1
  const cols = b.length + 1
  const table = new Uint32Array(rows * cols)
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] = a[i] === b[j]
        ? table[(i + 1) * cols + j + 1] + 1
        : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1])
    }
  }
  // 回溯出编辑脚本：' ' 等同 / '-' 删除 / '+' 新增
  const script: string[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { script.push(' ' + a[i]); i += 1; j += 1 }
    else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) { script.push('-' + a[i]); i += 1 }
    else { script.push('+' + b[j]); j += 1 }
  }
  while (i < a.length) { script.push('-' + a[i]); i += 1 }
  while (j < b.length) { script.push('+' + b[j]); j += 1 }
  const edits = script.filter((line) => line[0] !== ' ').length
  if (budget !== undefined && edits > budget) return undefined
  // context 窗口分组为 hunks
  const hunks: MiniDiffHunk[] = []
  let current: MiniDiffHunk | undefined
  let sinceEdit = Infinity
  let oldLine = 1
  let newLine = 1
  const flush = () => {
    if (current === undefined) return
    // 去掉尾部纯 context 行
    while (current.lines.length > 0 && current.lines[current.lines.length - 1][0] === ' ') {
      current.lines.pop()
      current.oldLines -= 1
      current.newLines -= 1
    }
    if (current.lines.length > 0) hunks.push(current)
    current = undefined
  }
  for (const entry of script) {
    const kind = entry[0]
    if (kind === ' ') {
      if (current !== undefined) {
        current.lines.push(entry)
        current.oldLines += 1
        current.newLines += 1
      }
      sinceEdit += 1
      if (current !== undefined && sinceEdit > context * 2) flush()
      oldLine += 1
      newLine += 1
    } else {
      if (current === undefined) {
        // 补前导 context
        const lead: string[] = []
        for (let back = script.lastIndexOf(entry) - 1; back >= 0 && lead.length < context; back -= 1) {
          if (script[back][0] !== ' ') break
          lead.unshift(script[back])
        }
        current = { oldStart: oldLine - lead.length, oldLines: lead.length, newStart: newLine - lead.length, newLines: lead.length, lines: [...lead] }
        sinceEdit = 0
      }
      if (kind === '-') { current.lines.push(entry); current.oldLines += 1; oldLine += 1 }
      else { current.lines.push(entry); current.newLines += 1; newLine += 1 }
      sinceEdit = 0
    }
  }
  flush()
  return { hunks }
}
