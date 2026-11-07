// atoms：基础原子演示
import { useState } from 'react'
import { Demo, type DemoSection } from '../demo-cell.tsx'
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

function TagSection() {
  return (
    <Demo id="tag" title="Tag" code={`import { Tag } from '../ui/tag.tsx'

<Tag tone="success">已完成</Tag>
<Tag tone="danger">失败</Tag>`}>
      {TONES.map((tone) => <Tag key={tone} tone={tone}>{tone}</Tag>)}
    </Demo>
  )
}

function PillSection() {
  const [active, setActive] = useState(true)
  return (
    <Demo id="pill" title="Pill" code={`import { Pill } from '../ui/pill.tsx'

<Pill active>激活</Pill>
<Pill onClick={() => set(!active)}>可点击</Pill>`}>
      <Pill active>激活</Pill>
      <Pill>未激活</Pill>
      <Pill active={active} onClick={() => setActive(!active)}>点我切换</Pill>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      <div style={{ display: 'flex', gap: 14, color: 'var(--dsw-alias-label-secondary)', alignItems: 'center' }}>
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

<PathLabel path="/Users/nan/Documents/zero/AGENTS.md" />`}>
      <PathLabel path="/Users/nan/Documents/zero/AGENTS.md" />
    </Demo>
  )
}

function TextShimmerSection() {
  return (
    <Demo id="text-shimmer" title="TextShimmer" code={`import { TextShimmer } from '../ui/text-shimmer.tsx'

<TextShimmer active>正在生成记忆摘要…</TextShimmer>`}>
      <TextShimmer active>正在生成记忆摘要…</TextShimmer>
      <TextShimmer>静置态（无动画）</TextShimmer>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
        <Skeleton style={{ width: '60%', height: 12 }} />
        <Skeleton style={{ width: '100%', height: 12 }} />
        <Skeleton style={{ width: '85%', height: 12 }} />
      </div>
    </Demo>
  )
}

function AvatarSection() {
  return (
    <Demo id="avatar" title="Avatar" code={`import { Avatar } from '../ui/avatar.tsx'

<Avatar fallback="林" />
<Avatar src={badUrl} fallback="L" /> {/* 加载失败自动回退 */}`}>
      <Avatar fallback="林" size={32} />
      <Avatar fallback="助手" size={32} />
      <Avatar src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%234a5568'/%3E%3C/svg%3E" size={32} />
      <Avatar src="https://invalid.example/x.png" fallback="回退" size={32} />
    </Demo>
  )
}

function LabelSection() {
  return (
    <Demo id="label" title="Label" code={`import { Label } from '../ui/label.tsx'

<Label htmlFor="demo-input">记忆标题</Label>`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 220 }}>
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
        <div style={{ padding: '4px 0' }}>上段</div>
        <Separator />
        <div style={{ padding: '4px 0' }}>下段</div>
      </div>
      <div style={{ display: 'flex', gap: 10, height: 40, alignItems: 'center' }}>
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
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
