// code-highlighting：kit 自有的语法高亮内核（契约对齐 DSH 官方 code-highlighting）。
//
// 上游对应：packages/client/ui-primitives/src/code-highlighting.ts @ dsh v0.2.2-rc.1 (66491b05e3)
//   （官方的实现本体在同包的 src/markdown/highlight.ts）
//
// 为什么是「自写」而不是逐字节复制（2026-11-06 起，issue 005）：
//   官方那份 700 行里，大半是**懒加载机制**（40 个语言各自 dynamic import + 语法表 +
//   订阅重渲染 + 视口门控 + 流式高亮会话）。第三方插件的 client bundle 不走宿主那套
//   package-local chunk 登记（那是宿主自建包才有的基础设施），懒加载会退化成「永远
//   plain text」。故 kit 改成**静态语法集**：常用语言直接打进 bundle，不依赖 chunk。
//
// 契约（与官方一致，调用方零改动）：
//   supportsHighlighting(lang) → boolean
//   highlightLines(code, lang) → HighlightSpan[][] | undefined
//   highlightToHtml(code, lang) → string | undefined
//   languageForPath(path) → string | undefined
//   useCodeHighlighter(lang) → (code) => HighlightSpan[][] | undefined
//
// 与官方的两处有意差异：
//   1. 语法集是静态的（8 种常用，js 家族共用 ts 语法），不是懒加载的 40 种；不认识的语言一律 plain text。
//   2. 不含官方的 Go 语法补丁（patchGoGrammar 绑死 @shikijs/langs 4.4.3 的语法结构，
//      是升级即失效的地雷；kit 不带 Go 语法，补丁自然不需要）。
//
// 依赖：shiki（精确锁 4.4.3）+ @shikijs/langs（4.4.3）。
// 颜色走 css-variables 主题（`--shiki-*` 变量），值在 src/shiki.css（映射 --dsw-alias-*）。

import { createHighlighterCoreSync, createCssVariablesTheme } from 'shiki/core'
import { createJavaScriptRegexEngine, defaultJavaScriptRegexConstructor } from 'shiki/engine/javascript'
import langBash from '@shikijs/langs/shellscript'
import langCss from '@shikijs/langs/css'
import langDiff from '@shikijs/langs/diff'
import langHtml from '@shikijs/langs/html'
import langJson from '@shikijs/langs/json'
import langPython from '@shikijs/langs/python'
import langTs from '@shikijs/langs/typescript'
import langYaml from '@shikijs/langs/yaml'
import type { HighlighterCore } from 'shiki/core'
import { useCallback } from 'react'
import type { CSSProperties } from 'react'

/** 一段高亮 run（官方同名类型）。 */
export interface HighlightSpan {
  text: string
  style: CSSProperties
}

/**
 * 静态语法集。JS 家族（js / jsx / ts / tsx）统一用 TypeScript 语法
 * （与官方同款取舍：TS 语法能精确 tokenize 纯 TS/JS，JSX/TSX 近似但不精确，
 * 换来启动语法只带一份 JS 家族）。
 */
const LANGS = [
  langTs, langBash, langJson, langPython,
  langHtml, langCss, langYaml, langDiff,
]

/** 语言提示 → 语法 id。键是小写（官方同款：提示大小写不敏感）。 */
const LANG_ALIASES = new Map<string, string>([
  ['typescript', 'typescript'], ['ts', 'typescript'],
  ['javascript', 'typescript'], ['js', 'typescript'],
  ['jsx', 'typescript'], ['tsx', 'typescript'],
  ['shellscript', 'shellscript'], ['bash', 'shellscript'], ['sh', 'shellscript'], ['zsh', 'shellscript'],
  ['json', 'json'], ['jsonc', 'json'],
  ['python', 'python'], ['py', 'python'],
  ['html', 'html'],
  ['css', 'css'],
  ['yaml', 'yaml'], ['yml', 'yaml'],
  ['diff', 'diff'], ['patch', 'diff'],
])

/**
 * 扩展名 → 语言提示（供「按文件名猜语言」用）。
 * 与官方 code-highlighting 的 languageForPath 同款语义，kit 自己的表。
 */
const LANGUAGE_BY_EXTENSION = new Map<string, string>([
  ['ts', 'typescript'], ['tsx', 'tsx'], ['mts', 'typescript'], ['cts', 'typescript'],
  ['js', 'javascript'], ['jsx', 'jsx'], ['mjs', 'javascript'], ['cjs', 'javascript'],
  ['json', 'json'], ['jsonc', 'json'],
  ['sh', 'bash'], ['bash', 'bash'], ['zsh', 'zsh'],
  ['py', 'python'], ['pyi', 'python'],
  ['html', 'html'], ['htm', 'html'],
  ['css', 'css'], ['scss', 'css'], ['less', 'css'],
  ['yaml', 'yaml'], ['yml', 'yaml'],
  ['diff', 'diff'], ['patch', 'diff'],
  ['md', 'markdown'], ['markdown', 'markdown'],
  ['txt', 'text'], ['log', 'text'],
])

/** 语言提示 → 语法 id（未知语言返回 undefined）。 */
export function grammarForHint(lang: string | undefined): string | undefined {
  if (lang === undefined) return undefined
  return LANG_ALIASES.get(lang.toLowerCase())
}

/** 语言提示能否走语法高亮（未知语言 → false，调用方降级为纯文本）。 */
export function supportsHighlighting(lang: string | undefined): boolean {
  return grammarForHint(lang) !== undefined
}

/** 按文件路径猜语言（扩展名映射表；无扩展名或未知扩展名 → undefined）。 */
export function languageForPath(path: string): string | undefined {
  const name = path.split('/').pop() ?? path
  if (name === 'Dockerfile') return 'dockerfile'
  if (name === 'Makefile') return 'makefile'
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return undefined
  return LANGUAGE_BY_EXTENSION.get(name.slice(dot + 1).toLowerCase())
}

/** 所有 token 颜色都走 `--shiki-*` 自定义属性（值在 src/shiki.css）。 */
const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  fontStyle: true,
})

/**
 * 扫描器在创建时编译每个 TextMate pattern。shiki 默认把超过 3000 字符的 pattern
 * 推迟到首次匹配，那次编译算进 shiki 的每行 500ms 预算，主机繁忙时会返回半截 token。
 * 改成急切编译（与官方同款）：扫描用户内容的预算不变。
 */
const regexEngine = createJavaScriptRegexEngine({
  forgiving: true,
  regexConstructor: pattern => defaultJavaScriptRegexConstructor(pattern, {
    lazyCompileLength: Number.POSITIVE_INFINITY,
  }),
})

/**
 * 至少这么长的行整行渲染成无色 token。
 * JS 正则引擎扫一行 JavaScript 字符串字面量：1000 单元约 70ms、2000 约 300ms、
 * 5000 约 600ms、10000 约 2.5s，这个上限把一行压在几帧内。跳过的行不改变语法状态，
 * 于是跨行结构（开合括号）后续行会像那行不存在一样着色（与官方同款取舍）。
 */
const TOKENIZE_MAX_LINE_LENGTH = 1000

/** 代表性路径：把每个静态语法先编译一遍，不占用户内容的扫描预算。 */
const GRAMMAR_WARMUPS = [
  { lang: 'typescript', code: 'const answer: number = 42' },
  { lang: 'shellscript', code: 'printf \'%s\\n\' "$HOME"' },
  { lang: 'json', code: '{"ready":true}' },
  { lang: 'python', code: 'def ready() -> bool: return True' },
  { lang: 'html', code: '<p>ready</p>' },
  { lang: 'css', code: '.ready { color: red; }' },
  { lang: 'yaml', code: 'ready: true' },
  { lang: 'diff', code: '-old\n+new' },
] as const

let singleton: HighlighterCore | undefined

function createHighlighter(): HighlighterCore {
  const instance = createHighlighterCoreSync({
    themes: [cssVariablesTheme],
    langs: LANGS,
    engine: regexEngine,
  })
  for (const sample of GRAMMAR_WARMUPS) {
    instance.codeToTokens(sample.code, {
      lang: sample.lang,
      theme: 'css-variables',
      tokenizeTimeLimit: 0,
    })
  }
  return instance
}

/** 单例（一个文档一个实例；首次调用时构造并预热）。 */
function highlighter(): HighlighterCore {
  singleton ??= createHighlighter()
  return singleton
}

/**
 * 按行高亮：每行一组只带颜色的 run。
 * shiki 把 `a\nb` tokenize 成两行；尾部换行（`a\n`）会多出一行空的，调用方自己的
 * 行数组没有它 —— 丢掉那一行，两边才同步（与官方同款）。
 * @param code - 源码文本。
 * @param lang - 语言提示。
 * @returns 每行一组 run；未知语言返回 undefined（调用方走纯文本）。
 */
export function highlightLines(code: string, lang: string | undefined): HighlightSpan[][] | undefined {
  const resolved = grammarForHint(lang)
  if (resolved === undefined) return undefined
  const { tokens } = highlighter().codeToTokens(code, {
    lang: resolved,
    theme: 'css-variables',
    tokenizeMaxLineLength: TOKENIZE_MAX_LINE_LENGTH,
  })
  const last = tokens[tokens.length - 1]
  const lines = tokens.length > 1 && last !== undefined && last.length === 0
    ? tokens.slice(0, -1)
    : tokens
  return lines.map(line => line.map(token => ({ text: token.content, style: { color: token.color } })))
}

/**
 * 高亮成 HTML（shiki 的 `<pre class="shiki">`）。
 * @param code - 源码文本。
 * @param lang - 语言提示。
 * @returns HTML 串；未知语言返回 undefined。
 */
export function highlightToHtml(code: string, lang: string | undefined): string | undefined {
  const resolved = grammarForHint(lang)
  if (resolved === undefined) return undefined
  return highlighter().codeToHtml(code, {
    lang: resolved,
    theme: 'css-variables',
    tokenizeMaxLineLength: TOKENIZE_MAX_LINE_LENGTH,
  })
}

/**
 * React 侧的高亮入口（官方 `useCodeHighlighter` 同款契约）。
 *
 * 官方那版靠 `useSyncExternalStore` 订阅「懒加载语法就绪」来触发重渲染；kit 的语法
 * 是静态的（启动即在），没有加载态，故直接 `useCallback` 包一层即可。
 *
 * @param language - 语言提示；未知语言返回的函数恒产出 undefined（调用方走纯文本）。
 * @returns 按行高亮函数。
 */
export function useCodeHighlighter(language: string | undefined): (code: string) => HighlightSpan[][] | undefined {
  return useCallback(
    (code: string) => highlightLines(code, language),
    [language],
  )
}
