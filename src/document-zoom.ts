// document-zoom：文档/图片缩放的数值模型（官方 helper 保真复制）。
// 上游来源：packages/client/ui-primitives/src/document-zoom.ts @ dsh v0.2.2-rc.1 (66491b05e3)

/** Shared fixed document scales used by preview surfaces and their controls. */
/** Fixed scale limits, incremental step, and menu choices. */
export const DOCUMENT_ZOOM = { minimum: 0.25, maximum: 4, step: 0.25, presets: [0.25, 0.5, 1, 1.5, 2] } as const

/** Localized labels supplied by the document renderer. */
export interface DocumentZoomLabels {
  readonly controls: string
  readonly menu: string
  readonly out: string
  readonly into: string
  readonly value: (percent: number) => string
}
