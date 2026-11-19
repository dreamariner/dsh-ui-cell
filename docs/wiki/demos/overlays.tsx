// overlays：浮层与反馈演示
import { useState } from 'react'
import { Demo, type DemoSection } from './demo-cell.tsx'
import {
  Modal, RiskConfirmation, Tooltip, Popover, HoverCard, Toast, Menu,
  ContextMenu, Menubar, NavigationMenu, Sheet, Pagination, Button,
} from '../../../src/index.ts'

function ModalSection() {
  const [open, setOpen] = useState(false)
  const [warnOpen, setWarnOpen] = useState(false)
  return (
    <Demo id="modal" title="Modal" code={`import { Modal } from '../ui/modal.tsx'

<Modal open={open} title="删除记忆" closeLabel="关闭" onClose={() => setOpen(false)}>…</Modal>

{/* rc.5 新增：tone='warning' —— 标题前加琥珀警告图标，标题与正文间距收紧 */}
<Modal open={warnOpen} title="连接已断开" tone="warning" closeLabel="关闭" onClose={() => setWarnOpen(false)}>…</Modal>

{/* portal + 焦点陷阱 + Escape + 焦点归还；只有最上层拥有 Escape */}`}>
      <Button variant="primary" onClick={() => setOpen(true)}>打开模态</Button>
      <Button variant="outline" onClick={() => setWarnOpen(true)}>警告态模态</Button>
      <Modal open={open} title="删除记忆" closeLabel="关闭" onClose={() => setOpen(false)}>
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)' }}>该操作会移除 1 条记忆，且不可撤销。</p>
        <div style={{ display: 'flex', gap: 'var(--dsh-space-8)', justifyContent: 'flex-end', marginTop: 'var(--dsh-space-16)' }}>
          <button className="duc-button duc-button-ghost duc-button-sm" type="button" onClick={() => setOpen(false)}>取消</button>
          <button className="duc-button duc-button-primary duc-button-sm" type="button" onClick={() => setOpen(false)}>确认删除</button>
        </div>
      </Modal>
      <Modal open={warnOpen} title="连接已断开" tone="warning" closeLabel="关闭" onClose={() => setWarnOpen(false)}>
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)' }}>
          宿主与后台的连接中断，未保存的改动已暂存。
        </p>
        <div style={{ display: 'flex', gap: 'var(--dsh-space-8)', justifyContent: 'flex-end', marginTop: 'var(--dsh-space-16)' }}>
          <button className="duc-button duc-button-ghost duc-button-sm" type="button" onClick={() => setWarnOpen(false)}>稍后再说</button>
          <button className="duc-button duc-button-primary duc-button-sm" type="button" onClick={() => setWarnOpen(false)}>重新连接</button>
        </div>
      </Modal>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        上游 rc.5 给模态加了 <code>tone=&quot;warning&quot;</code>：标题前出现琥珀色警告图标，
        标题与正文的间距收紧一档（警告态通常要更快被读到）。
        <code>RiskConfirmation</code> 就是靠它上收警告图标的（见下）。
      </p>
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
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        上游 rc.5 把这个组件重写了：警告图标<strong>上收到 Modal 的
        <code>tone=&quot;warning&quot;</code></strong>（不再自己画一个图标），
        勾选框改用共享的 <code>Checkbox</code> 组件（带 <code>modalAutofocus</code>：
        初始焦点落在勾选框上，而不是 React 的 <code>autoFocus</code>）。
        本仓两处都跟了。
      </p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-6)' }}>
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

<HoverCard anchor={<a href="#">助手</a>}
  copyText="助手" copyLabel="复制" copiedLabel="已复制"
  content={<div style={{ color: 'var(--dsw-alias-hovercard-label-primary)' }}>…</div>} />`}>
      <span style={{ display: 'flex', gap: 'var(--dsh-space-16)', alignItems: 'center', fontSize: 13 }}>
        概念生命
        <HoverCard
          anchor={<a href="#" style={{ color: 'var(--dsw-alias-link)' }}>助手</a>}
          content={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dsh-space-4)', fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--dsw-alias-hovercard-label-primary)', fontWeight: 500 }}>助手</span>
              <span style={{ color: 'var(--dsw-alias-hovercard-label-secondary)' }}>运行在 DSH 上的智能体，面板与状态由本插件承载。</span>
              <span style={{ color: 'var(--dsw-alias-hovercard-label-tertiary)' }}>内容配色要用 hovercard-label-* 族，卡片底色恒暗。</span>
            </div>
          }
          copyText="助手是运行在 DSH 上的智能体。"
          copyLabel="复制"
          copiedLabel="已复制"
        />
        悬停查看卡片
      </span>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        卡片底色取 <code>--dsw-alias-hovercard-bg</code>（亮暗两套主题都是深面 —— tooltip 语言，
        浮在任何内容上都成立），所以内容配色不能用主题正文色：正文字是深色，压在恒暗面上
        就是黑上黑。要用配套的 <code>hovercard-label-*</code> token 族
        （primary 近白 / secondary / tertiary），上游的会话标记与工作区行都是这么配的。
      </p>
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
  onSelect={…} onClose={() => setOpen(false)} />

{/* rc.5 起条目可带 submenu：悬停 / 聚焦 / 点击 / ArrowRight 打开 */}
<Menu items={[{ id: 'export', label: '导出', submenu: [{ id: 'md', label: 'Markdown' }] }]} />`}>
      <Menu
        open={open}
        anchor={
          <Button variant="outline" onClick={() => setOpen(!open)}>
            {picked !== undefined ? '已选：' + picked : '打开菜单'}
          </Button>
        }
        items={[
          { id: 'rebuild', label: '重建索引', shortcut: { keys: ['⌘', 'R'] } },
          // rc.5 新增：子菜单（悬停 / 聚焦 / 点击 / ArrowRight 都能打开）
          {
            id: 'export',
            label: '导出',
            submenu: [
              { id: 'export-md', label: 'Markdown' },
              { id: 'export-json', label: 'JSON' },
              { type: 'separator', id: 'export-sep' },
              { id: 'export-clip', label: '复制到剪贴板', shortcut: { keys: ['⌘', '⇧', 'C'] } },
            ],
          },
          { id: 'dedup', label: '去重合并' },
          { type: 'separator', id: 's1' },
          { type: 'label', id: 'danger-zone', text: '危险区' },
          { id: 'clear', label: '清空全部', danger: true },
        ]}
        onSelect={(id) => { setPicked(id); setOpen(false) }}
        onClose={() => setOpen(false)}
      />
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        上游 rc.5 把菜单族重写了：条目可带 <code>submenu</code>，
        <strong>悬停、聚焦、点击、ArrowRight</strong> 都能打开；<strong>ArrowLeft</strong> 返回父级，
        <strong>Escape</strong> 先关子菜单而不是直接关整个菜单；子菜单走 body portal
        （不再被父级容器的 overflow 裁掉），定位改用 CSS anchor（不再用 JS 测量）。
        试试：鼠标移到「导出」上，或用方向键走到它按 Right。
      </p>
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
        <div style={{ width: 300, padding: 'var(--dsh-space-16)', border: '1px dashed var(--dsw-alias-border-l3)', borderRadius: 8, fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
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

<NavigationMenu defaultCurrentId="memories" onNavigate={(id) => …}
  items={[{ id, label, current?, children? }]} />`}>
      <NavigationMenu
        defaultCurrentId="memories"
        items={[
          { id: 'memories', label: '记忆' },
          { id: 'scenes', label: '场景' },
          { id: 'more', label: '更多', children: [{ id: 'audit', label: '审计日志' }, { id: 'settings', label: '设置' }] },
        ]}
      />
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        下划线双模式：非受控传 <code>defaultCurrentId</code>，点击条目自迁移
        （点「场景」试试；「更多」是下拉，选中子项下划线留在父项）；
        声明了 <code>current: true</code> 即进入受控模式，以声明为准
        （路由是真相的消费端用这个，点条目只回调 <code>onNavigate</code>）。
      </p>
    </Demo>
  )
}

function SheetSection() {
  const [open, setOpen] = useState(false)
  const [smallOpen, setSmallOpen] = useState(false)
  return (
    <Demo id="sheet" title="Sheet" code={`import { Sheet } from '../ui/sheet.tsx'

<Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
  内容
</Sheet>
{/* 圆角可自定义（缺省 radius-panel 28px）；side="bottom" 即抽屉形态 */}
<Sheet open={smallOpen} onOpenChange={setSmallOpen} radius="var(--dsw-radius-lg)">…</Sheet>`}>
      <Button variant="primary" onClick={() => setOpen(true)}>打开右侧面板</Button>
      <Button variant="ghost" onClick={() => setSmallOpen(true)}>小圆角（lg 16px）</Button>
      <Sheet open={open} onOpenChange={setOpen} side="right" title="会话详情">
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: 13 }}>
          侧滑面板：portal + modal 层级栈（Escape 只归最上层），mask 点击关闭。
          side="bottom" 即抽屉（drawer）形态。圆角缺省 radius-panel（28px），
          只圆「靠内容侧」两角，贴边侧直角。
        </p>
      </Sheet>
      <Sheet open={smallOpen} onOpenChange={setSmallOpen} side="right" radius="var(--dsw-radius-lg)" title="局部抽屉">
        <p style={{ margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: 13 }}>
          radius=&quot;var(--dsw-radius-lg)&quot;：小屏抽屉 / 局部容器里 28px 嫌大时收小
          （数字按 px，字符串原样引用，可传任意 radius token）。
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
