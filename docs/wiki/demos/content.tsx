// content：内容块演示（官方源 + 零依赖轻量核心）
import { useState } from 'react'
import { Demo, type DemoSection } from '../demo-kit.tsx'
import {
  JsonTree, JsonBlock, SearchBlock, CodeToolbar, DiffBlock, TerminalBlock,
  ImagePreview, ImageLightbox, ZoomControls, Button,
} from '../../../src/index.ts'

const CODE_TOOLBAR_LABELS = { codeLabel: '代码', wrapLabel: '换行', unwrapLabel: '不换行' }

function JsonTreeSection() {
  return (
    <Demo id="json-tree" title="JsonTree" wide code={`import { JsonTree } from '../ui/json-tree.tsx'

<JsonTree data={payload} label="记忆条目" copyable expandTopLevel />`}>
      <div style={{ width: 420 }}>
        <JsonTree
          data={{
            id: 902,
            title: '用户偏好深色主题',
            tags: ['preference', 'theme'],
            meta: { source: 'session', confidence: 0.92 },
            note: '这是一段较长的字符串，用于演示 JSON 字符串的折叠与换行控制，展开后可以逐行查看。',
          }}
          label="记忆条目"
          copyable
          expandTopLevel
          labels={{
            copyValue: '复制值', copyJson: '复制 JSON', copyPath: '复制路径',
            copyPrettyJson: '复制格式化 JSON', copyCompactJson: '复制紧凑 JSON',
            copied: '已复制', copyFailed: '复制失败',
            collapseNode: '折叠节点', expandNode: '展开节点',
            copyButtonTitle: (action) => action,
          }}
        />
      </div>
    </Demo>
  )
}

function JsonBlockSection() {
  return (
    <Demo id="json-block" title="JsonBlock" wide code={`import { JsonBlock } from '../ui/json-block.tsx'

<JsonBlock label="工具入参" payload={payload} defaultOpen />`}>
      <div style={{ width: 420 }}>
        <JsonBlock
          label="luna_memory_search 入参"
          payload={{ query: '深色主题', limit: 10, kind: 'semantic' }}
          defaultOpen
          truncatedLabel={(total) => '已截断，共 ' + total + ' 字符'}
        />
      </div>
    </Demo>
  )
}

function SearchBlockSection() {
  const labels = {
    pathsSummary: (shown: number, total: number, truncated: boolean) => '文件 ' + shown + ' / ' + total + (truncated ? '（已截断）' : ''),
    matchesSummary: (shown: number, total: number, files: number, truncated: boolean) => '命中 ' + shown + ' / ' + total + '，' + files + ' 个文件' + (truncated ? '（已截断）' : ''),
    copy: '复制',
    copied: '已复制',
    noResults: '无结果',
    collapseAria: '收起',
    expandAria: (hidden: number) => '展开 ' + hidden + ' 行',
    collapse: '收起',
    expand: (hidden: number) => '展开 ' + hidden + ' 行',
  }
  return (
    <Demo id="search-block" title="SearchBlock" wide code={`import { SearchBlock } from '../ui/search-block.tsx'

<SearchBlock kind="matches" files={[…]} labels={labels} truncated={false} total={3} />`}>
      <div style={{ width: 430 }}>
        <SearchBlock
          kind="matches"
          labels={labels}
          truncated={false}
          total={3}
          files={[
            { path: 'src/boundary.ts', matches: [{ lineNumber: 42, line: 'export function runBoundaryFix(ctx) {' }, { lineNumber: 58, line: '  const seams = collectSeams(ctx)' }] },
            { path: 'docs/issues/031.md', matches: [{ lineNumber: 7, line: '## 边界判定误判与手抄依赖' }] },
          ]}
        />
      </div>
    </Demo>
  )
}

function CodeToolbarSection() {
  const [copied, setCopied] = useState(false)
  const [wrapped, setWrapped] = useState(false)
  return (
    <Demo id="code-toolbar" title="CodeToolbar" wide code={`import { CodeToolbar } from '../ui/code-toolbar.tsx'

<CodeToolbar lang="typescript" labels={{ codeLabel: '代码', wrapLabel: '换行', unwrapLabel: '不换行' }}
  copyLabel="复制" copiedLabel="已复制" copied={copied} wrapped={wrapped}
  onCopy={…} onWrap={…} />
{/* 轻量替身：supportsHighlighting 恒 false，工具栏自动降级 */}`}>
      <div style={{ width: 400 }}>
        <CodeToolbar
          lang="typescript"
          labels={CODE_TOOLBAR_LABELS}
          copyLabel="复制"
          copiedLabel="已复制"
          copied={copied}
          wrapped={wrapped}
          onCopy={() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200) }}
          onWrap={() => setWrapped(!wrapped)}
        />
        <pre style={{ margin: 0, padding: '10px 12px', background: 'var(--dsw-alias-bg-layer-2)', borderRadius: '0 0 var(--dsw-radius-md) var(--dsw-radius-md)', font: "12px/1.6 'SF Mono', Menlo, monospace", whiteSpace: wrapped ? 'pre-wrap' : 'pre', overflow: 'auto', color: 'var(--dsw-alias-label-primary)' }}>{'const seams = collectSeams(ctx)\nawait runBoundaryFix(seams)'}</pre>
      </div>
    </Demo>
  )
}

function DiffBlockSection() {
  const diffs = [
    {
      path: 'src/cache.ts',
      oldText: ['const cache = new Map()', 'export function get(key: string) {', '  return cache.get(key)', '}'].join('\n'),
      newText: ['const cache = new Map<string, unknown>()', 'export function get(key: string): unknown {', '  return cache.get(key) ?? null', '}'].join('\n'),
    },
    {
      path: 'src/cache.ts',
      oldText: ['export function set(key: string, v: unknown) {', '  cache.set(key, v)', '}'].join('\n'),
      newText: ['export function set(key: string, v: unknown): void {', '  cache.set(key, v)', '}', 'export function clear(): void {', '  cache.clear()', '}'].join('\n'),
    },
  ]
  const labels = {
    codeLabel: '代码',
    wrapLabel: '换行',
    unwrapLabel: '不换行',
    copy: '复制',
    copied: '已复制',
    collapseAria: '收起差异',
    expandAria: (hidden: number) => '展开 ' + hidden + ' 行差异',
    collapse: '收起',
    expand: (hidden: number) => '展开 ' + hidden + ' 行',
  }
  return (
    <Demo id="diff-block" title="DiffBlock" wide code={`import { DiffBlock } from '../ui/diff-block.tsx'

<DiffBlock diffs={[{ path, oldText, newText }]} labels={labels} />
{/* hunk 内部走 mini-diff（LCS），超预算自动整段回退 */}`}>
      <div style={{ width: 440 }}>
        <DiffBlock diffs={diffs} labels={labels} />
      </div>
    </Demo>
  )
}

function TerminalBlockSection() {
  return (
    <Demo id="terminal-block" title="TerminalBlock" wide code={`import { TerminalBlock } from '../ui/terminal-block.tsx'

<TerminalBlock command="luna memory rebuild" cwd="/zero" exitCode={0}
  output="…ANSI 彩色输出（ansi-lite 解析）" />`}>
      <div style={{ width: 440 }}>
        <TerminalBlock
          labels={{
            commandLine: (line) => '命令行 ' + line,
            signal: (signal) => '信号 ' + signal,
            exitCode: (code) => '退出码 ' + code,
            noExitCode: '无退出码',
            noOutput: '（无输出）',
            running: '运行中…',
            failed: '失败',
            done: '完成',
            copy: '复制输出',
            copied: '已复制',
            collapseAria: '收起输出',
            collapse: '收起',
            expandAria: (hidden) => '展开 ' + hidden + ' 行',
            expand: (hidden) => '展开 ' + hidden + ' 行',
          }}
          command="luna memory rebuild --index"
          cwd="/Users/nan/zero"
          exitCode={0}
          output={'\u001B[32m✓\u001B[0m 读取 902 条记忆\n\u001B[33m!\u001B[0m 3 条待确认已跳过\n\u001B[36m→\u001B[0m 索引重建完成，耗时 1.2s\n\u001B[1;34mluna\u001B[0m> 就绪'}
        />
      </div>
    </Demo>
  )
}

function ImagePreviewSection() {
  return (
    <Demo id="image-preview" title="ImagePreview" wide code={`import { ImagePreview } from '../ui/image-preview.tsx'

<ImagePreview src={dataUri} alt="示例图" loadingLabel="加载中…" failedLabel="加载失败" />`}>
      <div style={{ width: 320 }}>
        <ImagePreview
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'%3E%3Crect width='320' height='120' fill='%232f343c'/%3E%3Ccircle cx='60' cy='60' r='26' fill='%2374a0f0'/%3E%3Crect x='110' y='34' width='180' height='10' rx='5' fill='%235a6472'/%3E%3Crect x='110' y='56' width='140' height='10' rx='5' fill='%234a525e'/%3E%3C/svg%3E"
          alt="示例图"
          loadingLabel="加载中…"
          failedLabel="加载失败"
        />
      </div>
    </Demo>
  )
}

function ImageLightboxSection() {
  const [open, setOpen] = useState(false)
  return (
    <Demo id="image-lightbox" title="ImageLightbox" code={`import { ImageLightbox } from '../ui/image-lightbox.tsx'

<ImageLightbox src={src} alt="示例" labels={{ dialog: '图片预览', close: '关闭' }}
  onClose={() => setOpen(false)} />`}>
      <Button variant="outline" onClick={() => setOpen(true)}>打开灯箱</Button>
      {open && (
        <ImageLightbox
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'%3E%3Crect width='320' height='120' fill='%232f343c'/%3E%3Ccircle cx='60' cy='60' r='26' fill='%2374a0f0'/%3E%3Crect x='110' y='34' width='180' height='10' rx='5' fill='%235a6472'/%3E%3C/svg%3E"
          alt="示例"
          labels={{ dialog: '图片预览', close: '关闭' }}
          onClose={() => setOpen(false)}
        />
      )}
    </Demo>
  )
}

function ZoomControlsSection() {
  const [zoom, setZoom] = useState(1)
  return (
    <Demo id="zoom-controls" title="ZoomControls" wide code={`import { ZoomControls } from '../ui/zoom-controls.tsx'

<ZoomControls zoom={zoom} visible labels={labels} onZoom={setZoom}
  onActiveChange={() => {}} />`}>
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* panel 是 absolute 定位（bottom: 14px + 水平居中），需要一个定位祖先当锚定盒；
            官方用法即放在带 position 的预览容器里，这里给一个 relative 锚定盒模拟预览画布 */}
        <div style={{ position: 'relative', height: 110, borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)' }}>
          <ZoomControls
            zoom={zoom}
            visible
            labels={{ controls: '缩放', menu: '缩放比例', out: '缩小', into: '放大', value: (percent: number) => percent + '%' }}
            onZoom={(next) => setZoom(Number(next.toFixed(2)))}
            onActiveChange={() => {}}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>当前 zoom：{zoom.toFixed(2)}</div>
      </div>
    </Demo>
  )
}

export const contentSections: DemoSection = {
  group: '内容块',
  items: [
    { id: 'json-tree', title: 'JsonTree' },
    { id: 'json-block', title: 'JsonBlock' },
    { id: 'search-block', title: 'SearchBlock' },
    { id: 'code-toolbar', title: 'CodeToolbar' },
    { id: 'diff-block', title: 'DiffBlock' },
    { id: 'terminal-block', title: 'TerminalBlock' },
    { id: 'image-preview', title: 'ImagePreview' },
    { id: 'image-lightbox', title: 'ImageLightbox' },
    { id: 'zoom-controls', title: 'ZoomControls' },
  ],
  node: (
    <>
      <JsonTreeSection />
      <JsonBlockSection />
      <SearchBlockSection />
      <CodeToolbarSection />
      <DiffBlockSection />
      <TerminalBlockSection />
      <ImagePreviewSection />
      <ImageLightboxSection />
      <ZoomControlsSection />
    </>
  ),
}
