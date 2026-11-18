// spec：间距与动效规范演示（issue 012：官方底座上扩展）。
// 这里的每处间距都取自 --dsh-space-*，每处过渡都取自官方动效 token：文档站自己先守规范。
import { useState, type CSSProperties } from 'react'
import { Demo, type DemoSection } from './demo-cell.tsx'
import { Button, Collapsible, RadioGroup, Skeleton, Spinner } from '../../../src/index.ts'

/** 间距刻度（4px 底座，2px 半步）：数值、语义角色。 */
const SPACES = [
  { n: 1, role: '发丝级缝隙（1px 分隔间隙）' },
  { n: 2, role: '图标与文字、极紧组内' },
  { n: 4, role: '组内元素（紧）' },
  { n: 6, role: '组内元素（中）、控件内紧凑留白' },
  { n: 8, role: '控件内边距、卡片内边距' },
  { n: 12, role: '块内边距' },
  { n: 16, role: '区块之间' },
  { n: 20, role: '大块内边距' },
  { n: 24, role: '区块分隔' },
  { n: 32, role: '大留白' },
]

/** 动效三档：官方 token、实际时长、适用交互。 */
const TIERS = [
  {
    key: 'fast',
    token: 'var(--ds-transition-duration-fast)',
    ms: '100ms',
    use: '即时反馈：悬停、按下、聚焦、选中、数据到达',
  },
  {
    key: 'normal',
    token: 'var(--ds-transition-duration)',
    ms: '200ms',
    use: '状态切换：展开收起、显隐、开关',
  },
  {
    key: 'slow',
    token: 'var(--ds-transition-duration-slow)',
    ms: '300ms',
    use: '大面积位移：面板进出',
  },
]

const mono: CSSProperties = {
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: 12,
}

function SpacingSection() {
  return (
    <Demo
      id="spacing"
      title="Spacing（间距刻度）"
      wide
      code={`/* 间距只取刻度，不写 px 字面量（自有件护栏会拦） */
.card { padding: var(--dsh-space-8) var(--dsh-space-12); gap: var(--dsh-space-6); }

/* 基础层 foundation.css 必须第一个注入，否则 var(--dsh-space-*) 解析失败（静默掉样式） */
import { styles as foundationCss } from '../ui/foundation-css.ts'
import { styles as cardCss } from '../ui/card-css.ts'

export const PANEL_CSS = [foundationCss, cardCss].join('\\n')`}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dsh-space-32)', width: '100%', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-12)' }}>
            刻度共 10 档（4px 底座，2px 半步）。横条按 4 倍示意，实际值见左侧。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {SPACES.map((s) => (
              <div
                key={s.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--dsh-space-12)',
                  padding: 'var(--dsh-space-2) 0',
                }}
              >
                <code style={{ ...mono, width: 132, color: 'var(--dsw-alias-label-primary)' }}>
                  --dsh-space-{s.n}
                </code>
                <span style={{ ...mono, width: 36, color: 'var(--dsw-alias-label-secondary)' }}>{s.n}px</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--dsw-alias-bg-layer-2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: s.n * 4,
                        height: '100%',
                        borderRadius: 4,
                        background: 'var(--dsw-alias-brand-primary)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginTop: 3 }}>
                    {s.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '0 1 320px', minWidth: 260 }}>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-12)' }}>
            组内 vs 组间：数值刻度只管单值，<strong>关系归官方规则</strong>
            （组间距要明显大于组内，标题更靠近自己那组的内容）。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-24)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-6)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dsw-alias-label-primary)' }}>第一组</div>
              <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>组内成员 A（gap 6px）</div>
              <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>组内成员 B（gap 6px）</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-6)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dsw-alias-label-primary)' }}>第二组</div>
              <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>组内成员 A（gap 6px）</div>
              <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>组内成员 B（gap 6px）</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginTop: 'var(--dsh-space-12)', lineHeight: 1.7 }}>
            组间 24px 对组内 6px：间隔明显更大，分组关系才立得住。
            等距只是下限（相等即反转）。
          </div>
        </div>
      </div>
    </Demo>
  )
}

function MotionSection() {
  const [on, setOn] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('daily')
  return (
    <Demo
      id="motion"
      title="Motion（动效档位）"
      wide
      code={`/* 过渡只取官方三档 + 官方缓动（自有件护栏会拦字面时长与字面曲线） */
.chevron { transition: transform var(--ds-transition-duration) var(--ds-ease-in-out); }
.dot     { transition: opacity var(--ds-transition-duration-fast) var(--ds-ease-in-out); }

/* 循环节律（呼吸 / 旋转 / 闪烁）豁免字面时长，但必须配降级 */
.spinner { animation: spinner-rotate 700ms linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}`}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dsh-space-32)', width: '100%', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--dsh-space-12)', marginBottom: 'var(--dsh-space-16)', flexWrap: 'wrap' }}>
            <Button variant="outline" style={{ whiteSpace: 'nowrap' }} onClick={() => setOn((v) => !v)}>
              {on ? '复位' : '同时触发三档'}
            </Button>
            <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
              底座是官方 token（ui-theme 持有 motion），本仓只定「哪一档用在哪」
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-16)' }}>
            {TIERS.map((t) => (
              <div key={t.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--dsh-space-12)', marginBottom: 'var(--dsh-space-6)', flexWrap: 'wrap' }}>
                  <code style={{ ...mono, color: 'var(--dsw-alias-label-primary)' }}>{t.token}</code>
                  <span style={{ ...mono, color: 'var(--dsw-alias-label-secondary)' }}>{t.ms}</span>
                  <span style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' }}>{t.use}</span>
                </div>
                <div
                  style={{
                    width: 280,
                    height: 28,
                    borderRadius: 6,
                    background: 'var(--dsw-alias-bg-layer-2)',
                    border: '1px solid var(--dsw-alias-border-l2)',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: 'var(--dsw-alias-brand-primary)',
                      transform: on ? 'translateX(240px)' : 'translateX(0)',
                      transition: `transform ${t.token} var(--ds-ease-in-out)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '0 1 320px', minWidth: 260 }}>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-12)' }}>
            真组件：RadioGroup 是 fast 档（100ms），Collapsible 是 normal 档（200ms）。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-16)' }}>
            <RadioGroup
              value={value}
              onValueChange={setValue}
              name="spec-demo"
              options={[
                { value: 'daily', label: '每天摘要' },
                { value: 'weekly', label: '每周摘要' },
              ]}
            />
            <div style={{ width: 280 }}>
              <Collapsible trigger="高级选项" open={open} onOpenChange={setOpen}>
                箭头旋转 200ms（normal 档）。
              </Collapsible>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', margin: 'var(--dsh-space-20) 0 var(--dsh-space-8)' }}>
            循环节律豁免：呼吸、旋转、闪烁不是交互时长
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--dsh-space-16)' }}>
            <Spinner size={16} />
            <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-6)' }}>
              <Skeleton style={{ width: '100%', height: 12 }} />
              <Skeleton style={{ width: '70%', height: 12 }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginTop: 'var(--dsh-space-12)', lineHeight: 1.7 }}>
            系统开启「减少动效」时，自有件的过渡会降级（transition: none / animation: none），
            骨架屏与加载环直接停。
          </div>
        </div>
      </div>
    </Demo>
  )
}

export const specSections: DemoSection = {
  group: '规范',
  items: [
    { id: 'spacing', title: 'Spacing（间距刻度）' },
    { id: 'motion', title: 'Motion（动效档位）' },
  ],
  node: (
    <>
      <SpacingSection />
      <MotionSection />
    </>
  ),
}
