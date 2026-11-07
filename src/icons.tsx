// Icons: current-color product icons（源自 DSH 官方 ui-primitives 的 icons/ 子集）。
//
// 上游来源：packages/client/ui-primitives/src/icons/index.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
// ⚠ 0.2.2 起官方图标改为文档级 sprite（<use href="#dsw-icon-*">，ui-theme 维护 symbol 表）。
// 本仓刻意**不跟**：插件可能独立于宿主 sprite 运行，inline path 才符合「复制即独立」；
// 五个图标的 path 已与 artwork.ts 逐字节比对，零变化，以下 inline 实现继续有效。
// 官方 icons/ 共 190 个图标（全量复制体积大、且多数用不上），本仓只带首批必需的几个，
// 需要更多时按官方复制规范从 checkout 补：复制对应 const Icon*Artwork 函数体 +
// Regular/Medium 两个导出，命名保持 Icon{Name}Outline{Regular|Medium}。
//
// 规范：颜色走 currentColor、aria-hidden、尺寸由 size prop 给（不写进组件名）。

/** Shared props for every product icon component. */
export interface IconProps {
  /** Square edge in px; defaults to the glyph's own drawn size. */
  size?: number | undefined
  /** Extra class for layout placement; color rides currentColor. */
  className?: string | undefined
}

interface WeightedIconProps extends IconProps {
  strokeWidth: number
}

/** Regular stroke width used by the product icon set. */
export const ICON_REGULAR_STROKE = 1

const IconDatabaseOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M13.1967 5.1869C13.7232 4.77378 14.0003 4.30517 14.0001 3.82819C14.0003 3.3512 13.7232 2.88259 13.1967 2.46947C12.6702 2.05635 11.9128 1.71328 11.0006 1.47475C10.0885 1.23621 9.05371 1.11062 8.00039 1.1106C6.94707 1.11057 5.9123 1.23612 5.00009 1.47461C4.08742 1.71301 3.32948 2.05604 2.80249 2.46919C2.2755 2.88235 1.99805 3.35106 1.99805 3.82819C1.99805 4.30531 2.2755 4.77402 2.80249 5.18718C3.32948 5.60033 4.08742 5.94336 5.00009 6.18176C5.9123 6.42025 6.94707 6.5458 8.00039 6.54578C9.05371 6.54575 10.0885 6.42016 11.0006 6.18163C11.9128 5.94309 12.6702 5.60002 13.1967 5.1869Z" stroke="currentColor" />
    <path d="M2 3.80371V11.7848" stroke="currentColor" />
    <path d="M14 3.80371V11.7848" stroke="currentColor" />
    <path d="M2 7.81396C2 8.60524 2.63214 9.36411 3.75736 9.92363C4.88258 10.4832 6.4087 10.7975 8 10.7975C9.5913 10.7975 11.1174 10.4832 12.2426 9.92363C13.3679 9.36411 14 8.60524 14 7.81396" stroke="currentColor" />
    <path d="M2 11.7847C2 12.6081 2.63214 13.3977 3.75736 13.98C4.88258 14.5622 6.4087 14.8893 8 14.8893C9.5913 14.8893 11.1174 14.5622 12.2426 13.98C13.3679 13.3977 14 12.6081 14 11.7847" stroke="currentColor" />
  </svg>
)

/** Regular one-pixel IconDatabaseOutline artwork. */
export const IconDatabaseOutlineRegular = (props: IconProps) => (
  <IconDatabaseOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

/**
 * 通用 globe 图标（markdown 链接用）。
 * 上游来源：packages/client/ui-primitives/src/icons/shared-artwork.tsx @ dsh v0.2.2-rc.1 (66491b05e3)
 */
const IconGlobeOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M7.99986 14.0887C11.3626 14.0887 14.0886 11.3627 14.0886 7.99998C14.0886 4.63727 11.3626 1.91125 7.99986 1.91125C4.63715 1.91125 1.91113 4.63727 1.91113 7.99998C1.91113 11.3627 4.63715 14.0887 7.99986 14.0887Z" stroke="currentColor" />
    <path d="M2.34619 8H13.6538" stroke="currentColor" strokeLinecap="square" />
    <path d="M7.99976 14.0889C9.23509 14.0889 10.1743 11.3629 10.1743 8.00006C10.1743 4.63739 9.23509 1.91138 7.99976 1.91138" stroke="currentColor" />
    <path d="M7.99973 14.0889C6.76445 14.0889 5.8252 11.3629 5.8252 8.00006C5.8252 4.63739 6.76445 1.91138 7.99973 1.91138" stroke="currentColor" />
  </svg>
)

/** 文件图标（markdown 文件引用用；本仓自绘，与官方 FileTypeIcon 的品牌件无关）。 */
const IconFileOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M9 1.5H4.5C3.67157 1.5 3 2.17157 3 3V13C3 13.8284 3.67157 14.5 4.5 14.5H11.5C12.3284 14.5 13 13.8284 13 13V5.5L9 1.5Z" stroke="currentColor" strokeLinejoin="round" />
    <path d="M9 1.5V5.5H13" stroke="currentColor" strokeLinejoin="round" />
  </svg>
)
const IconWarningOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z" stroke="currentColor" />
    <path d="M8 4.29199V9.79199" stroke="currentColor" />
    <path d="M8 10.708V11.708" stroke="currentColor" />
  </svg>
)

/** Regular one-pixel IconWarningOutline artwork. */
export const IconWarningOutlineRegular = (props: IconProps) => (
  <IconWarningOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

const IconCloseOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M2.5 2.5L13.5 13.5" stroke="currentColor" />
    <path d="M13.5 2.5L2.5 13.5" stroke="currentColor" />
  </svg>
)

/** Regular one-pixel IconCloseOutline artwork. */
export const IconCloseOutlineRegular = (props: IconProps) => (
  <IconCloseOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

const IconChevronDownOutlineArtwork = ({ size = 14, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
  </svg>
)

/** Regular one-pixel IconChevronDownOutline artwork. */
export const IconChevronDownOutlineRegular = (props: IconProps) => (
  <IconChevronDownOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

const IconSearchOutlineArtwork = ({ size = 16, className, strokeWidth }: WeightedIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" strokeWidth={strokeWidth}>
    <path d="M6.58727 11.8586C9.55061 11.8586 11.9529 9.45637 11.9529 6.49304C11.9529 3.5297 9.55061 1.12744 6.58727 1.12744C3.62394 1.12744 1.22168 3.5297 1.22168 6.49304C1.22168 9.45637 3.62394 11.8586 6.58727 11.8586Z" stroke="currentColor" />
    <path d="M10.2991 10.3933L14.7783 14.8725" stroke="currentColor" />
  </svg>
)

/** Regular one-pixel IconSearchOutline artwork. */
export const IconSearchOutlineRegular = (props: IconProps) => (
  <IconSearchOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

// ── 0.2.2-rc.1 补充（自官方 icons/artwork.ts 提取 inline path，Regular 权重）──

/** Regular one-pixel check-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconCheckOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4" stroke="currentColor"></path></svg>
)

/** Regular one-pixel refresh-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconRefreshOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M14.5001 8C14.5 9.28552 14.1188 10.5422 13.4045 11.611C12.6903 12.6799 11.6752 13.5129 10.4875 14.0049C9.29982 14.4968 7.99295 14.6255 6.73212 14.3747C5.4713 14.124 4.31314 13.505 3.4041 12.596C2.49514 11.687 1.87614 10.5288 1.62537 9.26798C1.37459 8.00716 1.50331 6.70028 1.99525 5.51261C2.48719 4.32494 3.32025 3.30981 4.3891 2.59557C5.45795 1.88134 6.71458 1.50008 8.0001 1.5C9.9001 1.5 11.7001 2.3 13.0001 3.6L14.5001 5.1" stroke="currentColor"></path><path d="M14.4999 1.5V5.1H10.8999" stroke="currentColor"></path></svg>
)

/** Regular one-pixel check-circle-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconCheckCircleOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M12.5303 6.53027L8.80273 10.2578C8.54967 10.5109 8.31796 10.7439 8.10645 10.9141C7.88375 11.0932 7.616 11.2602 7.27344 11.3145C7.09229 11.3431 6.90771 11.3431 6.72656 11.3145C6.384 11.2602 6.11625 11.0932 5.89355 10.9141C5.68204 10.7439 5.45033 10.5109 5.19727 10.2578L3.46973 8.53027L4.53027 7.46973L6.25781 9.19727C6.53457 9.47402 6.70036 9.63859 6.83398 9.74609C6.95637 9.84453 6.98241 9.83644 6.96094 9.83301C6.98679 9.83709 7.01321 9.83709 7.03906 9.83301C7.01759 9.83644 7.04363 9.84453 7.16602 9.74609C7.29964 9.63859 7.46543 9.47402 7.74219 9.19727L11.4697 5.46973L12.5303 6.53027Z" fill="currentColor"></path><path d="M14.5996 8C14.5996 4.35492 11.6451 1.40039 8 1.40039C4.35492 1.40039 1.40039 4.35492 1.40039 8C1.40039 11.6451 4.35492 14.5996 8 14.5996C11.6451 14.5996 14.5996 11.6451 14.5996 8ZM15.9004 8C15.9004 12.363 12.363 15.9004 8 15.9004C3.63695 15.9004 0.0996094 12.363 0.0996094 8C0.0996094 3.63695 3.63695 0.0996094 8 0.0996094C12.363 0.0996094 15.9004 3.63695 15.9004 8Z" fill="currentColor"></path></svg>
)

/** Regular one-pixel loading-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconLoadingOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M12.596 12.596C11.687 13.5049 10.5288 14.1239 9.26798 14.3747C8.00716 14.6255 6.70028 14.4968 5.51261 14.0048C4.32494 13.5129 3.30981 12.6798 2.59557 11.611C1.88134 10.5421 1.50008 9.2855 1.5 7.99998C1.50008 6.71446 1.88134 5.45783 2.59557 4.38898C3.30981 3.32013 4.32494 2.48707 5.51261 1.99513C6.70028 1.50319 8.00716 1.37447 9.26798 1.62524C10.5288 1.87602 11.687 2.49502 12.596 3.40398" stroke="currentColor"></path></svg>
)

/** Regular one-pixel chevron-up-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconChevronUpOutlineRegular = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M12 10L8.70711 6.70711C8.31658 6.31658 7.68342 6.31658 7.29289 6.70711L4 10" stroke="currentColor"></path></svg>
)

/** Regular one-pixel plus-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconPlusOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M8 2V14" stroke="currentColor"></path><path d="M2 8H14" stroke="currentColor"></path></svg>
)

// ── 0.2.2-rc.1 内容块补充（自 artwork.ts svg(1) 提取 inline，Regular 权重）──

/** copy-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconCopyOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><rect x="1.52075" y="4.07373" width="10.3932" height="10.3932" rx="2" stroke="currentColor"></rect><path d="M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z" fill="currentColor"></path></svg>
)

/** wrap-lines-outline artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconWrapLinesOutlineRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" aria-hidden="true"><path d="M2.3457 3.19299H13.6541" stroke="currentColor"></path><path d="M2.3457 7.46497H9.19332" stroke="currentColor"></path><path d="M2.3457 11.7369H6.4849" stroke="currentColor"></path><path d="M9.1936 7.46497H11.5183C12.6981 7.46497 13.6544 8.42132 13.6544 9.60103C13.6544 10.7808 12.6981 11.7371 11.5183 11.7371H9.1936" stroke="currentColor"></path><path d="M10.9505 9.7677L9.12262 11.5956C9.04452 11.6737 9.04452 11.8003 9.12262 11.8784L10.9505 13.7063" stroke="currentColor"></path></svg>
)

/** nowrap-fill artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconNowrapFillRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path d="M2 15H1V1H2V15Z" fill="currentColor"></path><path d="M12.3535 7.64645C12.5487 7.84171 12.5487 8.15829 12.3535 8.35355L9.85352 10.8535L9.14648 10.1465L10.793 8.5H3.5V7.5H10.793L9.14648 5.85352L9.85352 5.14648L12.3535 7.64645Z" fill="currentColor"></path><path d="M15 15H14V1H15V15Z" fill="currentColor"></path></svg>
)

/** wrap-fill artwork（自 artwork.ts svg(1) 提取，权重已内联）. */
export const IconWrapFillRegular = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path d="M10.9999 8C10.9999 6.89543 10.1046 6 9 6H4.5V5H9C10.6568 5 11.9999 6.34315 11.9999 8C11.9999 9.65685 10.6568 11 9 11H6.20703L6.85351 11.6465L6.14648 12.3535L4.64652 10.8536C4.45126 10.6583 4.45126 10.3417 4.64652 10.1464L6.14648 8.64648L6.85351 9.35352L6.20703 10H9C10.1046 10 10.9999 9.10457 10.9999 8Z" fill="currentColor"></path><path d="M2 15H1V1H2V15Z" fill="currentColor"></path><path d="M15 15H14V1H15V15Z" fill="currentColor"></path></svg>
)

/** 通用 globe 图标（markdown 链接前缀用）。 */
export const IconGlobeOutlineRegular = (props: IconProps) => (
  <IconGlobeOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)

/** 文件图标（markdown 文件引用前缀用）。 */
export const IconFileOutlineRegular = (props: IconProps) => (
  <IconFileOutlineArtwork {...props} strokeWidth={ICON_REGULAR_STROKE} />
)
