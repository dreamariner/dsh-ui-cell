// 文档站 shell：侧栏导航 + 快速开始 + 全部演示分区。
// 站点跑的是 本仓 真组件；样式与 token 由 scripts/build-docs.mjs 编译期注入。
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import registryJson from '../../../registry.json'
import pkg from '../../../package.json'
import { Demo, type DemoSection } from './demo-cell.tsx'
import { atomSections } from './atoms.tsx'
import { containerSections } from './containers.tsx'
import { overlaySections } from './overlays.tsx'
import { inputSections } from './inputs.tsx'
import { contentSections } from './content.tsx'
import { specSections } from './spec.tsx'
import { Tag } from '../../../src/index.ts'

const registry = registryJson as { items: { name: string; status: string; description: string }[]; dshVersion: string }
const sections = [atomSections, containerSections, overlaySections, inputSections, contentSections, specSections]

const BEHAVIOR_MODULES = [
  'modal-layer — modal 层级栈 / 焦点归还',
  'focus — focusWithoutRing + 移动端检测',
  'keyboard-composition — IME 组合期守卫',
  'pointer-grace — 锚点与浮层间指针宽限',
  'anchored-position — 浮层锚定定位与视口约束',
  'dismiss-on-outside-pointer — 外点关闭',
  'clipboard / clipboard-copy — 剪贴板与反馈态',
  'overlay-top-margin — 浮层顶部让位宿主标题栏',
  'head-tail-cap — 长输出头尾截断',
]

function QuickStart() {
  return (
    <section id="quickstart" className="demo-section">
      <h3>快速开始</h3>
      <p className="desc">三步把组件复制进你的 DSH 插件（新手教程全文见 docs/wiki/01-新手教程.md）。</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-8)' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>① 安装并复制组件（源码归你的插件，运行时零新增依赖）</div>
          <pre className="demo-code">{`npm i -D @dreamariner/dsh-ui-cell
npx dsh-ui-cell add button input tag --to packages/my-plugin`}</pre>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>② 在面板里使用组件</div>
          <pre className="demo-code">{`import { Button } from '../ui/button.tsx'

<Button variant="primary" onClick={save}>保存记忆</Button>`}</pre>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>③ 把组件样式拼进插件已有的 style 注入器（panel-css 模式）</div>
          <pre className="demo-code">{`import { styles as buttonCss } from '../ui/button-css.ts'

const CELL_CSS = [buttonCss, inputCss, …].join('\\n')
tag.textContent = PANEL_CSS + '\\n' + CELL_CSS`}</pre>
        </div>
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.8 }}>
          类名表以原类名为键、最终类名为值（'primary' 对应 'duc-button-primary'），
          所以官方源里的 css[variant] 动态索引不用改写；暗色跟随宿主 body[data-ds-dark-theme]，
          右上角按钮即可在本站体验。
        </div>
      </div>
    </section>
  )
}

function ModulesSection() {
  return (
    <section id="behavior-modules" className="demo-section">
      <h3>行为模块（共享条目）</h3>
      <p className="desc">
        官方行为件独立成 registry 条目，modal / menu / tooltip / popover 等组件以 dependencies
        引用它们；add 时自动随闭包复制，无需单独调用。
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-6)', fontSize: 13 }}>
        {BEHAVIOR_MODULES.map((line) => <div key={line}>{line}</div>)}
      </div>
    </section>
  )
}

/** 亮暗切换：图标按钮，放在侧栏固定头部（不随导航列表滚动）。 */
function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const label = dark ? '切回亮色' : '切换暗色'
  return (
    <button type="button" className="doc-theme-btn" onClick={onToggle} title={label} aria-label={label}>
      {dark
        ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3.1" />
            <path d="M8 1.2v1.5M8 13.3v1.5M1.2 8h1.5M13.3 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1" />
          </svg>
        )
        : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" aria-hidden="true">
            <path d="M13.4 9.8A5.9 5.9 0 0 1 6.2 2.6a5.9 5.9 0 1 0 7.2 7.2z" />
          </svg>
        )}
    </button>
  )
}

function App() {
  const [dark, setDark] = useState(false)
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    if (next) document.body.setAttribute('data-ds-dark-theme', 'dark')
    else document.body.removeAttribute('data-ds-dark-theme')
  }
  return (
    <div className="doc-shell">
      <aside className="doc-side">
        <div className="doc-side-head">
          <h1>dsh-ui-cell</h1>
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <div className="ver">v{pkg.version} · DSH {registry.dshVersion} · {registry.items.length} 条目</div>
        </div>
        <nav className="doc-side-nav">
          <a href="#quickstart">快速开始</a>
          {sections.map((section) => (
            <div key={section.group}>
              <div className="group">{section.group}</div>
              {section.items.map((item) => <a key={item.id} href={'#' + item.id}>{item.title}</a>)}
            </div>
          ))}
          <div className="group">附录</div>
          <a href="#behavior-modules">行为模块</a>
          <a href="https://github.com/dreamariner/dsh-ui-cell">GitHub 仓库 ↗</a>
        </nav>
      </aside>
      <main className="doc-main">
        <div className="doc-top">
          <h2>dsh-ui-cell 组件文档</h2>
          <Tag tone="info">复制即独立</Tag>
        </div>
        <p className="doc-intro">
          本站跑的是 本仓 真组件（demo 源 import src/，样式走 add 交付的同一条 buildStyleModule
          转换管线），每个组件给出用法与实时效果。新手教程全文见 docs/wiki/01-新手教程.md。
        </p>
        <QuickStart />
        {sections.map((section) => (
          <div key={section.group}>
            <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-tertiary)', margin: 'var(--dsh-space-24) 0 var(--dsh-space-8)', letterSpacing: '0.06em' }}>{section.group}</div>
            {section.node}
          </div>
        ))}
        <ModulesSection />
      </main>
    </div>
  )
}

const rootEl = document.getElementById('root')
if (rootEl !== null) {
  createRoot(rootEl).render(<App />)
}
