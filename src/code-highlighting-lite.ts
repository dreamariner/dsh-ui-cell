// code-highlighting-lite：官方 code-highlighting 的零依赖替身。
// 上游对应：packages/client/ui-primitives/src/code-highlighting.ts（其语法高亮走 shiki，
// kit 不引入：支持检测恒为 false，工具栏自动降级为纯复制/换行控制）。
// languageForPath 用扩展名映射表提供语言名（供工具栏展示）。

/** 是否具备语法高亮能力（轻量替身恒为 false；shiki 不在 kit 依赖纪律内）。 */
export function supportsHighlighting(_lang?: string): boolean {
  return false
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  json: 'json', jsonc: 'json', py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin',
  c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp', swift: 'swift', php: 'php',
  sh: 'shellscript', bash: 'shellscript', zsh: 'shellscript', fish: 'shellscript',
  css: 'css', scss: 'scss', less: 'less', html: 'html', xml: 'xml', vue: 'vue', svelte: 'svelte',
  md: 'markdown', mdx: 'markdown', yaml: 'yaml', yml: 'yaml', toml: 'toml', sql: 'sql', graphql: 'graphql',
  txt: 'text', lock: 'text',
}

/** 路径 → 语言展示名（官方映射的轻量子集）。 */
export function languageForPath(path: string): string | undefined {
  const base = path.split(/[\\/]/).pop() ?? path
  const lower = base.toLowerCase()
  if (lower === 'dockerfile') return 'dockerfile'
  if (lower === 'makefile') return 'makefile'
  const dot = lower.lastIndexOf('.')
  if (dot === -1) return undefined
  return LANGUAGE_BY_EXTENSION[lower.slice(dot + 1)]
}
