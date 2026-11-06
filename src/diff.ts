// diff：差异计算（npm diff 的 structuredPatch，kit 自有薄封装）。
//
// 上游对应：npm `diff` 的 structuredPatch（kit 只用到行级 + context 窗口两个能力）。
//
// 2026-11-06 升级说明（issue 005）：原先 kit 用自写的零依赖替身 mini-diff
// （LCS 动态规划），它有一个实打实的缺陷：前导 context 回填用
// `script.lastIndexOf(entry)` 找「该行文本最后一次出现的位置」，遇到重复行
// （大量 `}` 那种）会取错位置。npm diff 用 Myers 算法，无此问题。
//
// 现在：**算法内核交给 npm diff，kit 只保留自己那层预算守卫**（见下），
// 输出契约不变（{ hunks }），故 diff-block 的调用点零改动。
//
// 为什么还要留守卫：npm diff 的 structuredPatch 没有 maxEditLength 选项
// （那是 diffLines 的内部参数），而 kit 的调用方靠「超预算 → 返回 undefined →
// 整段替换成一个 hunk」来兜住超大 diff（不然一个 5000 行的 diff 会把 UI 撑爆）。
// 故守卫留在 kit 这层：预算按**编辑行数**算，与替身时期的口径一致。

import { structuredPatch as npmStructuredPatch } from 'diff'

export interface PatchHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

export interface StructuredPatchOptions {
  context?: number
  /** 编辑行数上限；超了返回 undefined（调用方整段回退）。 */
  maxEditLength?: number
}

/** 行数组 → 拼接串（每行尾带 \n，与官方调用形态一致）。 */
function normalize(lines: readonly string[]): string {
  return lines.map(line => `${line}\n`).join('')
}

/** 拼接串 / 行数组 → 行数组（去掉尾部空行）。 */
function linesOf(value: readonly string[] | string): string[] {
  if (typeof value !== 'string') return [...value]
  if (value === '') return []
  return value.replace(/\n$/, '').split('\n')
}

/**
 * 计算差异 hunks。
 *
 * @param oldStr - 旧内容（占位；本封装只用行数组，保留这个参数是为了对齐官方签名）。
 * @param newStr - 新内容（同上）。
 * @param oldLines - 旧内容行（数组或拼接串）。
 * @param newLines - 新内容行（数组或拼接串）。
 * @param oldHeader - 旧文件头（占位）。
 * @param newHeader - 新文件头（占位）。
 * @param options - context 窗口与编辑预算。
 * @returns `{ hunks }`；超预算时返回 undefined（调用方整段回退）。
 */
export function structuredPatch(
  oldStr: string,
  newStr: string,
  oldLines: readonly string[] | string,
  newLines: readonly string[] | string,
  oldHeader?: unknown,
  newHeader?: unknown,
  options?: StructuredPatchOptions,
): { hunks: PatchHunk[] } | undefined {
  const budget = options?.maxEditLength
  const a = linesOf(oldLines)
  const b = linesOf(newLines)
  // 超大输入直接放弃（Myers 的代价是平方级，行数太多会卡住主线程）
  if (budget !== undefined && Math.max(a.length, b.length) > 4000) return undefined

  const patch = npmStructuredPatch(
    typeof oldStr === 'string' ? oldStr : '',
    typeof newStr === 'string' ? newStr : '',
    normalize(a),
    normalize(b),
    typeof oldHeader === 'string' ? oldHeader : undefined,
    typeof newHeader === 'string' ? newHeader : undefined,
    { context: options?.context ?? 4 },
  )

  const hunks = patch.hunks as PatchHunk[]
  if (budget !== undefined) {
    const edits = hunks.reduce(
      (total, hunk) => total + hunk.lines.reduce((n, line) => n + (line[0] === ' ' ? 0 : 1), 0),
      0,
    )
    if (edits > budget) return undefined
  }
  return { hunks }
}
