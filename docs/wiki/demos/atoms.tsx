// atoms：基础原子演示
import { useState, type CSSProperties } from 'react'
import { Demo, type DemoSection } from './demo-cell.tsx'
import {
  Button, Input, Textarea, Tag, Pill, StateDot, Checkbox, Switch, Label, Separator,
  AspectRatio, Progress, Spinner, Skeleton, Avatar, ShortcutKeys, CommandText,
  PathLabel, TextShimmer,
} from '../../../src/index.ts'
import {
  IconDatabaseOutlineRegular, IconWarningOutlineRegular, IconCloseOutlineRegular,
  IconChevronDownOutlineRegular, IconSearchOutlineRegular, IconCheckOutlineRegular,
  IconRefreshOutlineRegular, IconCheckCircleOutlineRegular, IconLoadingOutlineRegular,
  IconChevronUpOutlineRegular, IconPlusOutlineRegular, IconCopyOutlineRegular,
  IconWrapLinesOutlineRegular, IconNowrapFillRegular, IconWrapFillRegular,
} from '../../../src/icons.tsx'

const TONES = ['outline', 'solid', 'neutral', 'quiet', 'success', 'info', 'warning', 'danger'] as const

function ButtonSection() {
  return (
    <Demo id="button" title="Button" code={`import { Button } from '../ui/button.tsx'

<Button variant="primary">主操作</Button>
<Button variant="ghost">次操作</Button>
<Button variant="outline">描边</Button>
<Button variant="toolbar" icon={<IconDatabaseOutlineRegular size={13} />}>工具条</Button>
<Button variant="primary" size="sm">小尺寸</Button>`}>
      <Button variant="primary">主操作</Button>
      <Button variant="ghost">次操作</Button>
      <Button variant="outline">描边</Button>
      <Button variant="toolbar" icon={<IconDatabaseOutlineRegular size={13} />}>工具条</Button>
      <Button variant="primary" size="sm">小尺寸</Button>
      <Button variant="ghost" size="sm" icon={<IconSearchOutlineRegular size={13} />}>搜索</Button>
    </Demo>
  )
}

function InputSection() {
  const [text, setText] = useState('')
  return (
    <Demo id="input" title="Input" code={`import { Input } from '../ui/input.tsx'

<Input value={text} onChange={(event) => setText(event.target.value)} placeholder="搜索记忆…" />
<Input value={text} onChange={(event) => setText(event.target.value)} icon={<IconSearchOutlineRegular size={13} />} />`}>
      <div style={{ width: 220 }}>
        <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="搜索记忆…" />
        <div style={{ height: 8 }} />
        <Input value={text} onChange={(event) => setText(event.target.value)} icon={<IconSearchOutlineRegular size={13} />} placeholder="带前导图标" />
      </div>
    </Demo>
  )
}

function TextareaSection() {
  const [text, setText] = useState('多行内容…')
  return (
    <Demo id="textarea" title="Textarea" code={`import { Textarea } from '../ui/textarea.tsx'

<Textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} />`}>
      <div style={{ width: 260 }}>
        <Textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} />
      </div>
    </Demo>
  )
}

/** 每个 tone 的配色构成（照 src/tag.css 的 token 引用写的，给读者对照用）。 */
const TAG_TONE_NOTES: Record<string, string> = {
  outline: '0.5px 描边 + 三级字',
  solid: '正文色实底 + 反色字',
  neutral: '平台灰底 + 次级字',
  quiet: '无底色 + 三级字',
  success: '成功色 10% 底 + 同色字',
  info: '业务蓝 10% 底 + 同色字',
  warning: '警告色 12% 底 + 同色字',
  danger: '错误色 10% 底 + 同色字',
}

function TagSection() {
  return (
    <Demo id="tag" title="Tag" code={`import { Tag } from '../ui/tag.tsx'

<Tag tone="success">已完成</Tag>
<Tag tone="danger">失败</Tag>`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dsh-space-16)' }}>
        {TONES.map((tone) => (
          <div key={tone} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
            <Tag tone={tone}>{tone}</Tag>
            <span style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' }}>{TAG_TONE_NOTES[tone]}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        neutral 与 quiet 是两个「安静档」，天生就长得像：neutral 有一层极浅的灰底
        （亮色 rgb(245,246,247)，压在白面板上只差 4% 亮度），quiet 完全没有底色，
        两者只差「字色深一档」。暗色主题里差距更小：平台灰底与面板色 rgb(53,54,56) 同色，
        底色直接看不见，只剩字色差。其余六色都是状态色（10~12% 同色底 + 同色字），一眼可辨。
      </p>
    </Demo>
  )
}

function PillSection() {
  const [active, setActive] = useState(true)
  const note = { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } as CSSProperties
  return (
    <Demo id="pill" title="Pill" code={`import { Pill } from '../ui/pill.tsx'

<Pill active>激活</Pill>
<Pill onClick={() => set(!active)}>可点击</Pill>`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dsh-space-16)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Pill active>激活</Pill>
          <span style={note}>浅底 + 1px 内描边 + 正文色</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Pill>未激活</Pill>
          <span style={note}>幽灵态：底色 = 面板色</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Pill onClick={() => {}} style={{ background: 'var(--dsw-alias-interactive-bg-hover)' }}>hover 底色</Pill>
          <span style={note}>静态预览：真实只有悬停时才有</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Pill active={active} onClick={() => setActive(!active)}>点我切换</Pill>
          <span style={note}>可交互：鼠标悬停有底色</span>
        </div>
      </div>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        未激活是「幽灵态」：底色取 <code>bg-layer-2</code>（亮色 rgb(255,255,255)，与面板同色），
        所以看不见胶囊、只剩字 —— 上游用它做 tab bar 的未选中项，靠 hover（rgba(38,49,72,0.06)）
        与激活态（浅底 + 1px 内描边）区分。把鼠标放到「点我切换」那枚上就能看到 hover 底色。
      </p>
    </Demo>
  )
}

function StateDotSection() {
  return (
    <Demo id="state-dot" title="StateDot" code={`import { StateDot } from '../ui/state-dot.tsx'

<StateDot state="done" />
<StateDot state="error" />
<StateDot state="ongoing" appearance="step" />`}>
      <StateDot state="done" />
      <StateDot state="warning" />
      <StateDot state="ongoing" />
      <StateDot state="error" />
      <StateDot state="idle" />
      <StateDot state="ongoing" appearance="step" />
    </Demo>
  )
}

function CheckboxSection() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <Demo id="checkbox" title="Checkbox" code={`import { Checkbox } from '../ui/checkbox.tsx'

<Checkbox checked={a} onChange={setA} label="启用自动整理" />`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-8)' }}>
        <Checkbox checked={a} onChange={setA} label="启用自动整理" />
        <Checkbox checked={b} onChange={setB} label="包含已归档记忆" />
      </div>
    </Demo>
  )
}

function SwitchSection() {
  const [on, setOn] = useState(true)
  return (
    <Demo id="switch" title="Switch" code={`import { Switch } from '../ui/switch.tsx'

<Switch checked={on} onChange={setOn} label="自动记忆" />`}>
      <Switch checked={on} onChange={setOn} label="自动记忆" />
      <Switch checked={!on} onChange={(v) => setOn(!v)} label="反向示例" />
    </Demo>
  )
}

function IconSection() {
  const icons = [
    IconDatabaseOutlineRegular, IconWarningOutlineRegular, IconCloseOutlineRegular,
    IconChevronDownOutlineRegular, IconChevronUpOutlineRegular, IconSearchOutlineRegular,
    IconCheckOutlineRegular, IconRefreshOutlineRegular, IconCheckCircleOutlineRegular,
    IconLoadingOutlineRegular, IconPlusOutlineRegular, IconCopyOutlineRegular,
    IconWrapLinesOutlineRegular, IconNowrapFillRegular, IconWrapFillRegular,
  ]
  return (
    <Demo id="icon" title="Icon" code={`import { IconDatabaseOutlineRegular } from '../ui/icons.tsx'

<IconDatabaseOutlineRegular size={16} />
{/* currentColor：颜色随容器，inline path 不依赖宿主 sprite */}`}>
      <div style={{ display: 'flex', gap: 'var(--dsh-space-12)', color: 'var(--dsw-alias-label-secondary)', alignItems: 'center' }}>
        {icons.map((Icon, index) => <Icon key={index} size={16} />)}
        <span style={{ color: 'var(--dsw-alias-state-error-primary)' }}><IconWarningOutlineRegular size={16} /></span>
      </div>
    </Demo>
  )
}

function ShortcutKeysSection() {
  return (
    <Demo id="shortcut-keys" title="ShortcutKeys" code={`import { ShortcutKeys } from '../ui/shortcut-keys.tsx'

<ShortcutKeys keys={['⌘', 'K']} />`}>
      <ShortcutKeys keys={['⌘', 'K']} />
      <ShortcutKeys keys={['Ctrl', 'Shift', 'P']} />
    </Demo>
  )
}

function CommandTextSection() {
  return (
    <Demo id="command-text" title="CommandText" code={`import { CommandText } from '../ui/command-text.tsx'

<CommandText text="/memory search" label="命令" />`}>
      <CommandText text="/memory search" label="命令" />
    </Demo>
  )
}

function PathLabelSection() {
  return (
    <Demo id="path-label" title="PathLabel" code={`import { PathLabel } from '../ui/path-label.tsx'

<PathLabel path="/workspace/demo/src/components/button.tsx" />`}>
      <PathLabel path="/workspace/demo/src/components/button.tsx" />
    </Demo>
  )
}

function TextShimmerSection() {
  return (
    <Demo id="text-shimmer" title="TextShimmer" code={`import { TextShimmer } from '../ui/text-shimmer.tsx'

<TextShimmer active>正在生成记忆摘要…</TextShimmer>`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-8)' }}>
        {/* 微光层是「文字色的一份半透明副本」压在真文字上：默认 token 是文字色 30% 的透明黑，
            压在深色正文上等于同色叠加，看不出扫描带。DSH 应用里的跑动状态就是重新定义
            这个 token 才让效果显形的，这里照抄那个做法。
            文字写长一点：扫描带宽度是文字宽的 20%，字多则带宽，好盯着看。 */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>
            扫描带（shimmer 色改成高对比的浅灰，带子扫过时字明显变亮）
          </div>
          <div style={{ '--dsw-alias-label-shimmer': 'var(--dsw-alias-label-caption)' } as CSSProperties}>
            <TextShimmer active>正在生成记忆摘要，请稍候…</TextShimmer>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>
            默认 token（正文色上几乎看不出在动）
          </div>
          <div>
            <TextShimmer active>正在生成记忆摘要，请稍候…</TextShimmer>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' }}>
            静置态（无动画）
          </div>
          <div>
            <TextShimmer>正在生成记忆摘要，请稍候…</TextShimmer>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
          微光层是「文字色的一份半透明副本」叠在真文字上（亮色主题默认 30% 黑、暗色 45% 白），
          所以底色越深越看不出来：第一行把 <code>--dsw-alias-label-shimmer</code> 重新定义成浅灰，
          扫描带才一眼看得见（DSH 应用的跑动状态就是这么改这个 token 的）。
          动画是<b>循环</b>的：一轮 1.5s（0.3s 延迟 → 1s 扫过，分 48 格跳 → 0.5s 静止），然后重来。
          另：系统开了「减少动态效果」时组件整体不显示微光（可访问性降级）。
        </p>
      </div>
    </Demo>
  )
}

function SpinnerSection() {
  return (
    <Demo id="spinner" title="Spinner" code={`import { Spinner } from '../ui/spinner.tsx'

<Spinner size={16} />`}>
      <Spinner size={16} />
      <Spinner size={24} />
    </Demo>
  )
}

function SkeletonSection() {
  return (
    <Demo id="skeleton" title="Skeleton" code={`import { Skeleton } from '../ui/skeleton.tsx'

<Skeleton style={{ width: 220, height: 12 }} />`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-8)', width: 240 }}>
        <Skeleton style={{ width: '60%', height: 12 }} />
        <Skeleton style={{ width: '100%', height: 12 }} />
        <Skeleton style={{ width: '85%', height: 12 }} />
      </div>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        占位色是主题指定的 <code>bg-skeleton</code>：亮色 <code>rgba(0,0,0,0.04)</code>
        （压在白面板上 = rgb(245,245,245)）、暗色 <code>rgba(255,255,255,0.08)</code>；
        呼吸动画在 <code>opacity 1 ↔ 0.45</code> 之间，所以最亮也只有 4% —— 视觉上刻意很轻
        （与 shadcn 的 <code>bg-muted</code> 约 5% 同量级；DSH 上游自己的骨架条
        <code>MenuView.module.css</code> 的 <code>.skeletonBar</code> 也是同一个 token + 同款呼吸）。
        需要更明显时自己盖一层更深的底色或加描边。
      </p>
    </Demo>
  )
}

function AvatarSection() {
  // 演示用的头像图片：一个明显是「图」的渐变人像（免得看起来像空色块）
  const picture = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236b8afd'/%3E%3Cstop offset='1' stop-color='%23234567'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' fill='url(%23g)'/%3E%3Ccircle cx='16' cy='12' r='5.5' fill='%23ffffff' fill-opacity='.85'/%3E%3Cpath d='M6.5 32c0-5.8 4.3-9 9.5-9s9.5 3.2 9.5 9z' fill='%23ffffff' fill-opacity='.85'/%3E%3C/svg%3E"
  const label = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 'var(--dsh-space-6)' } as CSSProperties
  return (
    <Demo id="avatar" title="Avatar" code={`import { Avatar } from '../ui/avatar.tsx'

<Avatar fallback="林" />
<Avatar src={badUrl} fallback="L" /> {/* 加载失败自动回退 */}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-8)' }}>
        <div>
          <div style={label}>首字母回退（有底色与描边）</div>
          <Avatar fallback="林" size={32} />
        </div>
        <div>
          <div style={label}>多个字（字号按字数自动缩，不被圆裁掉）</div>
          <Avatar fallback="助手" size={32} />
        </div>
        <div>
          <div style={label}>图片</div>
          <Avatar src={picture} size={32} />
        </div>
        <div>
          <div style={label}>图片加载失败 → 自动回退</div>
          <Avatar src="https://invalid.example/x.png" fallback="回退" size={32} />
        </div>
      </div>
    </Demo>
  )
}

function LabelSection() {
  return (
    <Demo id="label" title="Label" code={`import { Label } from '../ui/label.tsx'

<Label htmlFor="demo-input">记忆标题</Label>`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-4)', width: 220 }}>
        <Label htmlFor="demo-input">记忆标题</Label>
        <Input id="demo-input" placeholder="输入…" />
      </div>
    </Demo>
  )
}

function SeparatorSection() {
  return (
    <Demo id="separator" title="Separator" code={`import { Separator } from '../ui/separator.tsx'

<Separator />
<Separator orientation="vertical" />`}>
      <div style={{ width: 240 }}>
        <div style={{ padding: 'var(--dsh-space-4) 0' }}>上段</div>
        <Separator />
        <div style={{ padding: 'var(--dsh-space-4) 0' }}>下段</div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--dsh-space-8)', height: 40, alignItems: 'center' }}>
        <span>左</span>
        <Separator orientation="vertical" />
        <span>右</span>
      </div>
    </Demo>
  )
}

function AspectRatioSection() {
  return (
    <Demo id="aspect-ratio" title="AspectRatio" code={`import { AspectRatio } from '../ui/aspect-ratio.tsx'

<AspectRatio ratio={16 / 9}>内容铺满</AspectRatio>`}>
      <div style={{ width: 240 }}>
        <AspectRatio ratio={16 / 9}>
          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--dsw-alias-bg-layer-3)', borderRadius: 'inherit' }}>16 : 9</div>
        </AspectRatio>
      </div>
    </Demo>
  )
}

function ProgressSection() {
  return (
    <Demo id="progress" title="Progress" code={`import { Progress } from '../ui/progress.tsx'

<Progress value={40} />
<Progress /> {/* indeterminate */}`}>
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-12)' }}>
        <Progress value={40} />
        <Progress value={85} />
        <Progress />
      </div>
    </Demo>
  )
}

export const atomSections: DemoSection = {
  group: '基础原子',
  items: [
    { id: 'button', title: 'Button' },
    { id: 'input', title: 'Input' },
    { id: 'textarea', title: 'Textarea' },
    { id: 'tag', title: 'Tag' },
    { id: 'pill', title: 'Pill' },
    { id: 'state-dot', title: 'StateDot' },
    { id: 'checkbox', title: 'Checkbox' },
    { id: 'switch', title: 'Switch' },
    { id: 'icon', title: 'Icon' },
    { id: 'shortcut-keys', title: 'ShortcutKeys' },
    { id: 'command-text', title: 'CommandText' },
    { id: 'path-label', title: 'PathLabel' },
    { id: 'text-shimmer', title: 'TextShimmer' },
    { id: 'spinner', title: 'Spinner' },
    { id: 'skeleton', title: 'Skeleton' },
    { id: 'avatar', title: 'Avatar' },
    { id: 'label', title: 'Label' },
    { id: 'separator', title: 'Separator' },
    { id: 'aspect-ratio', title: 'AspectRatio' },
    { id: 'progress', title: 'Progress' },
  ],
  node: (
    <>
      <ButtonSection />
      <InputSection />
      <TextareaSection />
      <TagSection />
      <PillSection />
      <StateDotSection />
      <CheckboxSection />
      <SwitchSection />
      <IconSection />
      <ShortcutKeysSection />
      <CommandTextSection />
      <PathLabelSection />
      <TextShimmerSection />
      <SpinnerSection />
      <SkeletonSection />
      <AvatarSection />
      <LabelSection />
      <SeparatorSection />
      <AspectRatioSection />
      <ProgressSection />
    </>
  ),
}
