// demo-cell：文档站的 Demo 原语（各分类文件共用）。
import { useMemo, type ReactNode } from 'react'
import registryJson from '../../registry.json'

export interface NavItem {
  id: string
  title: string
}

export interface DemoSection {
  group: string
  items: NavItem[]
  node: ReactNode
}

export function Demo({ id, title, code, wide, children }: {
  id: string
  title: string
  code: string
  wide?: boolean
  children: ReactNode
}) {
  const desc = useMemo(() => {
    const item = (registryJson as { items: { name: string; description: string }[] }).items.find((i) => i.name === id)
    return item?.description ?? ''
  }, [id])
  return (
    <section id={id} className="demo-section">
      <h3>{title}</h3>
      <p className="desc">{desc}</p>
      <div className={wide === true ? 'demo-stage demo-stage-wide' : 'demo-stage'}>{children}</div>
      <pre className="demo-code">{code}</pre>
    </section>
  )
}
