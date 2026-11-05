// overlays：浮层与反馈演示
import { useState } from 'react'
import { Demo, type DemoSection } from '../demo-kit.tsx'
import {
  Modal, RiskConfirmation, Tooltip, Popover, HoverCard, Toast, Menu,
  ContextMenu, Menubar, NavigationMenu, Sheet, Pagination, Button,
} from '../../../src/index.ts'

function ModalSection() {
  const [open, setOpen] = useState(false)
  return (
    <Demo id="modal" title="Modal" code={`import { Modal } from '../ui/modal.tsx'

<Modal open={open} title="删除记忆" closeLabel="关闭" onClose={() => setOpen(false)}>…</Modal>
{/* portal + 焦点陷阱 + Escape + 焦点归还；只有最上层拥有 Escape */}`}>
      <Button variant="primary" onClick={() => setOpen(true)}>打开模态</Button>
      <Modal open={open} title="删除记忆" closeLabel="关闭" onClose={() => setOpen(false)}>
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)' }}>该操作会移除 1 条记忆，且不可撤销。</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="duk-button duk-button-ghost duk-button-sm" type="button" onClick={() => setOpen(false)}>取消</button>
          <button className="duk-button duk-button-primary duk-button-sm" type="button" onClick={() => setOpen(false)}>确认删除</button>
        </div>
      </Modal>
    </Demo>
  )
}

function RiskConfirmationSection() {
  const [open, setOpen] = useState(false)
  const [ack, setAck] = useState(false)
  return (
    <Demo id="risk-confirmation" title="RiskConfirmation" code={`import { RiskConfirmation } from '../ui/risk-confirmation.tsx'

<RiskConfirmation open={open} acknowledged={ack} onAcknowledgedChange={setAck}
  title="清空全部记忆" … />`}>
      <Button variant="primary" onClick={() => { setAck(false); setOpen(true) }}>危险操作</Button>
      <RiskConfirmation
        open={open}
        title="清空全部记忆"
        description="将删除全部 902 条记忆，操作不可撤销。"
        acknowledgeLabel="我已了解后果，确认执行"
        cancelLabel="取消"
        closeLabel="关闭"
        confirmLabel="确认清空"
        acknowledged={ack}
        onAcknowledgedChange={setAck}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </Demo>
  )
}

function TooltipSection() {
  return (
    <Demo id="tooltip" title="Tooltip" code={`import { Tooltip } from '../ui/tooltip.tsx'

<Tooltip label="打开记忆面板" shortcutKeys={['⌘', 'M']} side="bottom">
  <Button variant="toolbar">悬停我</Button>
</Tooltip>`}>
      <Tooltip label="打开记忆面板" shortcutKeys={['⌘', 'M']} side="bottom">
        <Button variant="toolbar">悬停我（带快捷键）</Button>
      </Tooltip>
      <Tooltip label={() => '函数标签也支持'} side="bottom">
        <Button variant="outline">悬停我</Button>
      </Tooltip>
    </Demo>
  )
}

function PopoverSection() {
  return (
    <Demo id="popover" title="Popover" code={`import { Popover } from '../ui/popover.tsx'

<Popover trigger={<Button variant="outline">点开</Button>}
  content={<div>任意内容</div>} />`}>
      <Popover
        trigger={<Button variant="outline">点开浮层</Button>}
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <strong style={{ fontSize: 13 }}>记忆统计</strong>
            <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>902 条 · 3 条待确认</span>
          </div>
        }
      />
    </Demo>
  )
}

function HoverCardSection() {
  return (
    <Demo id="hover-card" title="HoverCard" code={`import { HoverCard } from '../ui/hover-card.tsx'

<HoverCard anchor={<a href="#">Luna</a>} content={…}
  copyText="Luna" copyLabel="复制" copiedLabel="已复制" />`}>
      <span style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
        概念生命
        <HoverCard
          anchor={<a href="#" style={{ color: 'var(--dsw-alias-link)' }}>Luna</a>}
          content={<div style={{ fontSize: 12 }}>Luna 是运行在 DSH 上的概念生命，记忆与人格由本插件承载。</div>}
          copyText="Luna 是运行在 DSH 上的概念生命。"
          copyLabel="复制"
          copiedLabel="已复制"
        />
        悬停查看卡片
      </span>
    </Demo>
  )
}

function ToastSection() {
  const [toast, setToast] = useState<string | undefined>()
  return (
    <Demo id="toast" title="Toast" code={`import { Toast } from '../ui/toast.tsx'

{toast !== undefined && <Toast text={toast} tone="success" onDone={() => setToast(undefined)} />}`}>
      <Button variant="primary" onClick={() => setToast('记忆已保存（3 秒后自动消失）')}>触发轻通知</Button>
      {toast !== undefined && <Toast text={toast} tone="success" onDone={() => setToast(undefined)} />}
    </Demo>
  )
}

function MenuSection() {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | undefined>()
  return (
    <Demo id="menu" title="Menu" code={`import { Menu } from '../ui/menu.tsx'

<Menu open={open} anchor={<Button>打开菜单</Button>}
  items={[{ id: 'a', label: '重建索引' }, { type: 'separator', id: 's' }, …]}
  onSelect={…} onClose={() => setOpen(false)} />`}>
      <Menu
        open={open}
        anchor={
          <Button variant="outline" onClick={() => setOpen(!open)}>
            {picked !== undefined ? '已选：' + picked : '打开菜单'}
          </Button>
        }
        items={[
          { id: 'rebuild', label: '重建索引', shortcut: { keys: ['⌘', 'R'] } },
          { id: 'dedup', label: '去重合并' },
          { type: 'separator', id: 's1' },
          { type: 'label', id: 'danger-zone', text: '危险区' },
          { id: 'clear', label: '清空全部', danger: true },
        ]}
        onSelect={(id) => { setPicked(id); setOpen(false) }}
        onClose={() => setOpen(false)}
      />
    </Demo>
  )
}

function ContextMenuSection() {
  return (
    <Demo id="context-menu" title="ContextMenu" code={`import { ContextMenu } from '../ui/context-menu.tsx'

<ContextMenu items={[…]} onSelect={…}>
  <div>在这个区域上右键</div>
</ContextMenu>`}>
      <ContextMenu
        items={[
          { id: 'copy', label: '复制内容' },
          { id: 'pin', label: '置顶' },
          { type: 'separator', id: 's' },
          { id: 'forget', label: '遗忘这条', danger: true },
        ]}
        onSelect={(id) => { window.console.log('选中', id) }}
      >
        <div style={{ width: 300, padding: 16, border: '1px dashed var(--dsw-alias-border-l3)', borderRadius: 8, fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
          在这个区域上右键，试试官方 Menu 的指针模式。
        </div>
      </ContextMenu>
    </Demo>
  )
}

function MenubarSection() {
  return (
    <Demo id="menubar" title="Menubar" code={`import { Menubar } from '../ui/menubar.tsx'

<Menubar entries={[{ id: 'file', label: '文件', items: […] }, …]} />`}>
      <Menubar
        entries={[
          { id: 'file', label: '文件', items: [{ id: 'new', label: '新建记忆' }, { id: 'export', label: '导出' }] },
          { id: 'edit', label: '编辑', items: [{ id: 'undo', label: '撤销', shortcut: { keys: ['⌘', 'Z'] } }] },
          { id: 'view', label: '视图', items: [{ id: 'dark', label: '切换暗色' }] },
        ]}
        onSelect={(id) => { window.console.log('menubar 选中', id) }}
      />
    </Demo>
  )
}

function NavigationMenuSection() {
  return (
    <Demo id="navigation-menu" title="NavigationMenu" wide code={`import { NavigationMenu } from '../ui/navigation-menu.tsx'

<NavigationMenu items={[{ id, label, current?, children? }]} />`}>
      <NavigationMenu
        items={[
          { id: 'memories', label: '记忆', current: true },
          { id: 'scenes', label: '场景' },
          { id: 'more', label: '更多', children: [{ id: 'audit', label: '审计日志' }, { id: 'settings', label: '设置' }] },
        ]}
      />
    </Demo>
  )
}

function SheetSection() {
  const [open, setOpen] = useState(false)
  return (
    <Demo id="sheet" title="Sheet" code={`import { Sheet } from '../ui/sheet.tsx'

<Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
  内容
</Sheet>
{/* side="bottom" 即抽屉形态 */}`}>
      <Button variant="primary" onClick={() => setOpen(true)}>打开右侧面板</Button>
      <Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: 13 }}>
          侧滑面板：portal + modal 层级栈（Escape 只归最上层），mask 点击关闭。
          side="bottom" 即抽屉（drawer）形态。
        </p>
      </Sheet>
    </Demo>
  )
}

function PaginationSection() {
  const [page, setPage] = useState(6)
  return (
    <Demo id="pagination" title="Pagination" code={`import { Pagination } from '../ui/pagination.tsx'

<Pagination page={page} totalPages={24} onPageChange={setPage} />`}>
      <Pagination page={page} totalPages={24} onPageChange={setPage} />
    </Demo>
  )
}

export const overlaySections: DemoSection = {
  group: '浮层与反馈',
  items: [
    { id: 'modal', title: 'Modal' },
    { id: 'risk-confirmation', title: 'RiskConfirmation' },
    { id: 'tooltip', title: 'Tooltip' },
    { id: 'popover', title: 'Popover' },
    { id: 'hover-card', title: 'HoverCard' },
    { id: 'toast', title: 'Toast' },
    { id: 'menu', title: 'Menu' },
    { id: 'context-menu', title: 'ContextMenu' },
    { id: 'menubar', title: 'Menubar' },
    { id: 'navigation-menu', title: 'NavigationMenu' },
    { id: 'sheet', title: 'Sheet' },
    { id: 'pagination', title: 'Pagination' },
  ],
  node: (
    <>
      <ModalSection />
      <RiskConfirmationSection />
      <TooltipSection />
      <PopoverSection />
      <HoverCardSection />
      <ToastSection />
      <MenuSection />
      <ContextMenuSection />
      <MenubarSection />
      <NavigationMenuSection />
      <SheetSection />
      <PaginationSection />
    </>
  ),
}
