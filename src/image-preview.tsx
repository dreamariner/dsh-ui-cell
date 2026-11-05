// ImagePreview: DSH 官方 ui-primitives 保真复制。
// 上游来源：packages/client/ui-primitives/src/ImagePreview.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// DOM 结构、行为与 token 引用照抄官方；类名前缀化由 add 转换器处理。
/** Passive, contained image preview for Markdown image links. */
import { useState } from 'react'
import { IconLoadingOutlineRegular } from './icons.tsx'
import css from './image-preview.css'

/**
 * Render an image without introducing a second activation target.
 * @param props - Source, accessible description, localized status.
 * @returns A contained preview with loading or failure status.
 */
export function ImagePreview({ src, alt, loadingLabel, failedLabel }: {
  src: string
  alt: string
  loadingLabel: string
  failedLabel: string
}) {
  return <Preview key={src} src={src} alt={alt} loadingLabel={loadingLabel} failedLabel={failedLabel} />
}

function Preview({ src, alt, loadingLabel, failedLabel }: {
  src: string
  alt: string
  loadingLabel: string
  failedLabel: string
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  return <span className={css.frame}>
    {state !== 'failed' && <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer"
      className={css.image} data-ready={state === 'ready' || undefined}
      onLoad={() => { setState('ready') }} onError={() => { setState('failed') }} />}
    {state !== 'ready' && <span className={css.status} role="status">
      {state === 'loading' && <IconLoadingOutlineRegular size={16} />}
      <span>{state === 'loading' ? loadingLabel : failedLabel}</span>
    </span>}
  </span>
}
