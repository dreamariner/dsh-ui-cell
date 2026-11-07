// containers：容器与布局演示
import { useState } from 'react'
import { Demo, type DemoSection } from '../demo-cell.tsx'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Alert, AlertTitle, AlertDescription,
  Collapsible, Accordion, ScrollArea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DataTable, Toggle, ToggleGroup,
  Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions,
  Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
  Field, ButtonGroup, SegmentedControl, SegmentedTabs,
  Input, Button,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  ConfigField, InlineEditor, DisclosureRow, FoldToggle,
  ConnectionIndicator, Sidebar, Resizable, Tag,
} from '../../../src/index.ts'
import { IconDatabaseOutlineRegular, IconWarningOutlineRegular } from '../../../src/icons.tsx'

function CardSection() {
  return (
    <Demo id="card" title="Card" wide code={`import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card.tsx'

<Card>…</Card>`}>
      <div style={{ width: 320 }}>
        <Card>
          <CardHeader>
            <CardTitle>记忆面板</CardTitle>
            <CardDescription>展示当前会话沉淀的结构化记忆。</CardDescription>
          </CardHeader>
          <CardContent>共 902 条记忆，3 条待确认。</CardContent>
          <CardFooter>
            <button className="duc-button duc-button-primary duc-button-sm" type="button">查看</button>
          </CardFooter>
        </Card>
      </div>
    </Demo>
  )
}

function AlertSection() {
  return (
    <Demo id="alert" title="Alert" wide code={`import { Alert, AlertTitle, AlertDescription } from '../ui/alert.tsx'

<Alert variant="warning" icon={<IconWarningOutlineRegular size={15} />}>
  <AlertTitle>记忆写入被跳过</AlertTitle>
  <AlertDescription>该会话处于只读模式。</AlertDescription>
</Alert>`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 380 }}>
        <Alert variant="info"><AlertTitle>信息</AlertTitle><AlertDescription>新版本 0.2.2-rc.1 已发布。</AlertDescription></Alert>
        <Alert variant="success"><AlertTitle>成功</AlertTitle><AlertDescription>902 条记忆已重建索引。</AlertDescription></Alert>
        <Alert variant="warning" icon={<IconWarningOutlineRegular size={15} />}><AlertTitle>警告</AlertTitle><AlertDescription>该会话处于只读模式。</AlertDescription></Alert>
        <Alert variant="danger"><AlertTitle>失败</AlertTitle><AlertDescription>边界修复执行失败，已回滚。</AlertDescription></Alert>
        <Alert><AlertTitle>默认</AlertTitle><AlertDescription>无语义色的中性提示。</AlertDescription></Alert>
      </div>
    </Demo>
  )
}

function CollapsibleSection() {
  const [open, setOpen] = useState(true)
  return (
    <Demo id="collapsible" title="Collapsible" wide code={`import { Collapsible } from '../ui/collapsible.tsx'

<Collapsible trigger="高级选项" open={open} onOpenChange={setOpen}>
  内容
</Collapsible>`}>
      <div style={{ width: 320 }}>
        <Collapsible trigger="高级选项" open={open} onOpenChange={setOpen}>
          这里是折叠区内容，展开时渲染。
        </Collapsible>
      </div>
    </Demo>
  )
}

function AccordionSection() {
  return (
    <Demo id="accordion" title="Accordion" wide code={`import { Accordion } from '../ui/accordion.tsx'

<Accordion type="single" items={[{ key, header, content }]} />`}>
      <div style={{ width: 340 }}>
        <Accordion
          type="single"
          items={[
            { key: 'a', header: '什么是记忆边界?', content: '记忆边界判定决定一条消息是否值得沉淀为长期记忆。' },
            { key: 'b', header: '如何修复边界误判?', content: 'boundary_fix 会按会话日志重建 reconstructed 状态。' },
            { key: 'c', header: '数据存在哪里?', content: 'lmem_* 表，经 seam 服务读写。' },
          ]}
        />
      </div>
    </Demo>
  )
}

function ScrollAreaSection() {
  return (
    <Demo id="scroll-area" title="ScrollArea" code={`import { ScrollArea } from '../ui/scroll-area.tsx'

<ScrollArea style={{ height: 120 }}>…</ScrollArea>`}>
      <ScrollArea style={{ height: 120, width: 240, padding: 8 }}>
        {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ padding: '4px 0' }}>记忆条目 #{i + 1}</div>)}
      </ScrollArea>
    </Demo>
  )
}

function TableSection() {
  return (
    <Demo id="table" title="Table" wide code={`import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table.tsx'`}>
      <div style={{ width: 380 }}>
        <Table>
          <TableHeader>
            <TableRow><TableHead>记忆</TableHead><TableHead>状态</TableHead><TableHead>更新时间</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>用户偏好深色</TableCell><TableCell>已确认</TableCell><TableCell>11-04</TableCell></TableRow>
            <TableRow><TableCell>项目代号 zero</TableCell><TableCell>已确认</TableCell><TableCell>11-05</TableCell></TableRow>
            <TableRow><TableCell>喜欢简体中文回复</TableCell><TableCell>待确认</TableCell><TableCell>11-06</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>
    </Demo>
  )
}

function DataTableSection() {
  const rows = [
    { name: '自动整理', count: 312, status: '运行中' },
    { name: '边界修复', count: 96, status: '完成' },
    { name: '去重合并', count: 214, status: '完成' },
  ]
  return (
    <Demo id="data-table" title="DataTable" wide code={`import { DataTable } from '../ui/data-table.tsx'

<DataTable columns={[{ key: 'name', header: '任务' }, { key: 'count', header: '条数' }]} rows={rows} />
{/* 点表头排序，内置 asc/desc/清除 三态 */}`}>
      <div style={{ width: 400 }}>
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', header: '任务' },
            { key: 'count', header: '条数' },
            { key: 'status', header: '状态' },
          ]}
        />
      </div>
    </Demo>
  )
}

function ToggleSection() {
  const [on, setOn] = useState(true)
  return (
    <Demo id="toggle" title="Toggle" code={`import { Toggle } from '../ui/toggle.tsx'

<Toggle pressed={on} onPressedChange={setOn}>加粗</Toggle>`}>
      <Toggle pressed={on} onPressedChange={setOn}>加粗</Toggle>
      <Toggle variant="ghost" pressed={!on} onPressedChange={(v) => setOn(!v)}>斜体</Toggle>
    </Demo>
  )
}

function ToggleGroupSection() {
  const [value, setValue] = useState<string[]>(['memory'])
  return (
    <Demo id="toggle-group" title="ToggleGroup" code={`import { ToggleGroup } from '../ui/toggle-group.tsx'

<ToggleGroup type="multiple" value={value} onValueChange={setValue}
  options={[{ value: 'memory', label: '记忆' }, { value: 'skills', label: '技能' }]} />`}>
      <ToggleGroup
        type="multiple"
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'memory', label: '记忆' },
          { value: 'skills', label: '技能' },
          { value: 'diary', label: '日记' },
        ]}
      />
    </Demo>
  )
}

function ItemSection() {
  return (
    <Demo id="item" title="Item" wide code={`import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from '../ui/item.tsx'`}>
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Item>
          <ItemMedia><IconDatabaseOutlineRegular size={16} /></ItemMedia>
          <ItemContent>
            <ItemTitle>记忆条目 #902</ItemTitle>
            <ItemDescription>用户偏好深色主题与简体中文回复。</ItemDescription>
          </ItemContent>
          <ItemActions><Tag tone="info">已确认</Tag></ItemActions>
        </Item>
        <Item>
          <ItemMedia><IconWarningOutlineRegular size={16} /></ItemMedia>
          <ItemContent>
            <ItemTitle>待确认条目</ItemTitle>
            <ItemDescription>边界判定为 uncertain，等待用户复核。</ItemDescription>
          </ItemContent>
          <ItemActions><Tag tone="warning">待确认</Tag></ItemActions>
        </Item>
      </div>
    </Demo>
  )
}

function EmptySection() {
  return (
    <Demo id="empty" title="Empty" wide code={`import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty.tsx'`}>
      <div style={{ width: 380 }}>
        <Empty>
          <EmptyMedia><IconDatabaseOutlineRegular size={28} /></EmptyMedia>
          <EmptyTitle>还没有记忆</EmptyTitle>
          <EmptyDescription>和助手多聊几句，记忆会自动沉淀在这里。</EmptyDescription>
          <EmptyContent><button className="duc-button duc-button-outline duc-button-sm" type="button">了解记忆系统</button></EmptyContent>
        </Empty>
      </div>
    </Demo>
  )
}

function FieldSection() {
  return (
    <Demo id="field" title="Field" wide code={`import { Field } from '../ui/field.tsx'

<Field name="title" label="标题" description="会显示在记忆列表">
  <Input />
</Field>`}>
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field name="t1" label="标题" description="会显示在记忆列表">
          <Input defaultValue="用户偏好" />
        </Field>
        <Field name="t2" label="保留天数" error="必须为 1 到 365 之间的整数">
          <Input defaultValue="400" />
        </Field>
      </div>
    </Demo>
  )
}

function ButtonGroupSection() {
  return (
    <Demo id="button-group" title="ButtonGroup" code={`import { ButtonGroup } from '../ui/button-group.tsx'

<ButtonGroup>…按钮集合…</ButtonGroup>`}>
      <ButtonGroup>
        <Button variant="outline" size="sm">复制</Button>
        <Button variant="outline" size="sm">移动</Button>
        <Button variant="outline" size="sm">删除</Button>
      </ButtonGroup>
    </Demo>
  )
}

function SegmentedControlSection() {
  const [value, setValue] = useState('memories')
  return (
    <Demo id="segmented-control" title="SegmentedControl" code={`import { SegmentedControl } from '../ui/segmented-control.tsx'

<SegmentedControl value={value} onChange={setValue}
  options={[{ value: 'memories', label: '记忆' }, …]} />`}>
      <SegmentedControl
        id="demo-seg"
        label="视图切换"
        value={value}
        onChange={setValue}
        options={[
          { value: 'memories', label: '记忆' },
          { value: 'scenes', label: '场景' },
          { value: 'audit', label: '审计' },
        ]}
      />
    </Demo>
  )
}

function SegmentedTabsSection() {
  const [value, setValue] = useState('all')
  return (
    <Demo id="segmented-tabs" title="SegmentedTabs" code={`import { SegmentedTabs } from '../ui/segmented-tabs.tsx'

<SegmentedTabs items={[…]} value={value} onChange={setValue} />`}>
      <SegmentedTabs
        label="记忆过滤"
        value={value}
        onChange={setValue}
        items={[
          { id: 'tab-all', panelId: 'panel-all', value: 'all', label: '全部' },
          { id: 'tab-confirmed', panelId: 'panel-confirmed', value: 'confirmed', label: '已确认' },
          { id: 'tab-pending', panelId: 'panel-pending', value: 'pending', label: '待确认' },
        ]}
      />
    </Demo>
  )
}

function BreadcrumbSection() {
  return (
    <Demo id="breadcrumb" title="Breadcrumb" wide code={`import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/breadcrumb.tsx'`}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#">zero</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#">知识库</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>记忆面板</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Demo>
  )
}

function ConfigFieldSection() {
  const [value, setValue] = useState('16')
  return (
    <Demo id="config-field" title="ConfigField" wide code={`import { ConfigField } from '../ui/config-field.tsx'

<ConfigField label="保留天数" value={value} secret={false} choices={[]}
  disabled={false} overridden invalid={false}
  labels={{ reset: '重置', inherited: '继承', invalid: '格式无效' }}
  onChange={setValue} onReset={() => {}} />`}>
      <div style={{ width: 340 }}>
        <ConfigField
          label="保留天数"
          value={value}
          secret={false}
          choices={['7', '30', '90', '365']}
          disabled={false}
          overridden
          invalid={false}
          labels={{ reset: '重置', inherited: '继承', invalid: '格式无效' }}
          onChange={setValue}
          onReset={() => { setValue('30') }}
        />
      </div>
    </Demo>
  )
}

function InlineEditorSection() {
  const [value, setValue] = useState('用户偏好深色主题')
  return (
    <Demo id="inline-editor" title="InlineEditor" wide code={`import { InlineEditor } from '../ui/inline-editor.tsx'

<InlineEditor value={value} label="记忆内容" onChange={setValue}
  onSave={() => {}} onCancel={() => {}} />`}>
      <div style={{ width: 320 }}>
        <InlineEditor value={value} label="记忆内容" onChange={setValue} onSave={() => {}} onCancel={() => {}} />
      </div>
    </Demo>
  )
}

function DisclosureRowSection() {
  const [open, setOpen] = useState(false)
  return (
    <Demo id="disclosure-row" title="DisclosureRow" wide code={`import { DisclosureRow } from '../ui/disclosure-row.tsx'

<DisclosureRow icon={…} title="记忆条目" open={open} expandable
  onToggle={() => setOpen(!open)} />`}>
      <div style={{ width: 340 }}>
        <DisclosureRow
          icon={<IconDatabaseOutlineRegular size={14} />}
          title="记忆条目 #902"
          open={open}
          expandable
          onToggle={() => setOpen(!open)}
          expandOnRowClick
        />
        {open && <div style={{ padding: '6px 0 0 24px', fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>用户偏好深色主题与简体中文回复。</div>}
      </div>
    </Demo>
  )
}

function FoldToggleSection() {
  const [expanded, setExpanded] = useState(false)
  return (
    <Demo id="fold-toggle" title="FoldToggle" code={`import { FoldToggle } from '../ui/fold-toggle.tsx'

<FoldToggle expanded={expanded} hidden={12} labels={{
  collapseAria: '收起', expandAria: (n) => '展开 ' + n + ' 行',
}} onToggle={() => set(!expanded)} />`}>
      <FoldToggle
        className=""
        expanded={expanded}
        hidden={12}
        labels={{ collapseAria: '收起', expandAria: (n) => '展开 ' + n + ' 行', collapse: '收起', expand: (n) => '展开 ' + n + ' 行' }}
        onToggle={() => setExpanded(!expanded)}
      />
    </Demo>
  )
}

function ConnectionIndicatorSection() {
  return (
    <Demo id="connection-indicator" title="ConnectionIndicator" wide code={`import { ConnectionIndicator } from '../ui/connection-indicator.tsx'

<ConnectionIndicator state="connecting" …labels />`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
        <ConnectionIndicator state="connecting" disconnectedLabel="已断开" connectingLabel="连接中" recoveredLabel="已恢复" reconnectActionLabel="重连" restartActionLabel="重启" onReconnect={() => {}} />
        <ConnectionIndicator state="connecting" disconnectedLabel="已断开" connectingLabel="连接中" recoveredLabel="已恢复" reconnectActionLabel="重连" restartActionLabel="重启" onReconnect={() => {}} />
      </div>
    </Demo>
  )
}

function SidebarSection() {
  return (
    <Demo id="sidebar" title="Sidebar" wide code={`import { Sidebar } from '../ui/sidebar.tsx'

<Sidebar header={…} footer={…}>导航内容</Sidebar>`}>
      <div style={{ width: 400, height: 180, display: 'flex' }}>
        <Sidebar header={<div style={{ fontWeight: 600 }}>助手</div>} footer={<div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>v0.2.1</div>}>
          {['记忆', '技能', '日记'].map((label) => (
            <div key={label} style={{ padding: '6px 10px', borderRadius: 6, color: 'var(--dsw-alias-label-secondary)' }}>{label}</div>
          ))}
        </Sidebar>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-label-tertiary)', fontSize: 13 }}>主内容区</div>
      </div>
    </Demo>
  )
}

function ResizableSection() {
  return (
    <Demo id="resizable" title="Resizable" wide code={`import { Resizable } from '../ui/resizable.tsx'

<Resizable left={…} right={…} initialLeftPercent={50} />`}>
      <div style={{ width: 440, height: 130, border: '1px dashed var(--dsw-alias-border-l3)', borderRadius: 8, overflow: 'hidden' }}>
        <Resizable
          initialLeftPercent={45}
          left={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-tertiary)' }}>拖我试试</div>}
          right={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-label-tertiary)' }}>右栏</div>}
        />
      </div>
    </Demo>
  )
}

export const containerSections: DemoSection = {
  group: '容器与布局',
  items: [
    { id: 'card', title: 'Card' },
    { id: 'alert', title: 'Alert' },
    { id: 'collapsible', title: 'Collapsible' },
    { id: 'accordion', title: 'Accordion' },
    { id: 'scroll-area', title: 'ScrollArea' },
    { id: 'table', title: 'Table' },
    { id: 'data-table', title: 'DataTable' },
    { id: 'toggle', title: 'Toggle' },
    { id: 'toggle-group', title: 'ToggleGroup' },
    { id: 'item', title: 'Item' },
    { id: 'empty', title: 'Empty' },
    { id: 'field', title: 'Field' },
    { id: 'button-group', title: 'ButtonGroup' },
    { id: 'segmented-control', title: 'SegmentedControl' },
    { id: 'segmented-tabs', title: 'SegmentedTabs' },
    { id: 'breadcrumb', title: 'Breadcrumb' },
    { id: 'config-field', title: 'ConfigField' },
    { id: 'inline-editor', title: 'InlineEditor' },
    { id: 'disclosure-row', title: 'DisclosureRow' },
    { id: 'fold-toggle', title: 'FoldToggle' },
    { id: 'connection-indicator', title: 'ConnectionIndicator' },
    { id: 'sidebar', title: 'Sidebar' },
    { id: 'resizable', title: 'Resizable' },
  ],
  node: (
    <>
      <CardSection />
      <AlertSection />
      <CollapsibleSection />
      <AccordionSection />
      <ScrollAreaSection />
      <TableSection />
      <DataTableSection />
      <ToggleSection />
      <ToggleGroupSection />
      <ItemSection />
      <EmptySection />
      <FieldSection />
      <ButtonGroupSection />
      <SegmentedControlSection />
      <SegmentedTabsSection />
      <BreadcrumbSection />
      <ConfigFieldSection />
      <InlineEditorSection />
      <DisclosureRowSection />
      <FoldToggleSection />
      <ConnectionIndicatorSection />
      <SidebarSection />
      <ResizableSection />
    </>
  ),
}
