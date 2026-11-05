// dsh-ui-cell 组件 barrel。
//
// ⚠ 这个 barrel 是**本仓内部**用的（消费端不会 import 它——add 复制的是单个组件文件）。
// 消费端拿到的是插件自己的 src/client/ui/ 目录（源码归插件），彼此不共享运行时。
// 按 registry ready 条目全量导出（文档站与预览用），组件源变更时重跑生成脚本或手工同步。

// ── button/button.tsx ──
export { Button } from './button.tsx'
export type { ButtonVariant } from './button.tsx'

// ── input/input.tsx ──
export { Input } from './input.tsx'

// ── tag/tag.tsx ──
export { Tag } from './tag.tsx'
export type { TagTone } from './tag.tsx'

// ── segmented-control/segmented-control.tsx ──
export { SegmentedControl } from './segmented-control.tsx'
export type { SegmentedControlOption } from './segmented-control.tsx'

// ── modal/modal.tsx ──
export { Modal } from './modal.tsx'

// ── risk-confirmation/risk-confirmation.tsx ──
export { RiskConfirmation } from './risk-confirmation.tsx'
export type { RiskConfirmationProps } from './risk-confirmation.tsx'

// ── select/select.tsx ──
export { Select } from './select.tsx'
export type { SelectOption, SelectProps } from './select.tsx'

// ── textarea/textarea.tsx ──
export { Textarea } from './textarea.tsx'
export type { TextareaProps } from './textarea.tsx'

// ── icon/icons.tsx ──
export { ICON_REGULAR_STROKE, IconDatabaseOutlineRegular, IconWarningOutlineRegular, IconCloseOutlineRegular, IconChevronDownOutlineRegular, IconSearchOutlineRegular, IconCheckOutlineRegular, IconRefreshOutlineRegular, IconCheckCircleOutlineRegular, IconLoadingOutlineRegular, IconChevronUpOutlineRegular, IconPlusOutlineRegular, IconCopyOutlineRegular, IconWrapLinesOutlineRegular, IconNowrapFillRegular, IconWrapFillRegular } from './icons.tsx'
export type { IconProps } from './icons.tsx'

// ── tooltip/tooltip.tsx ──
export { TooltipSuppression, Tooltip } from './tooltip.tsx'

// ── tooltip/tooltip-placement.ts ──
export { placeTooltip } from './tooltip-placement.ts'
export type { TooltipSide } from './tooltip-placement.ts'

// ── tooltip/input-modality.ts ──
export { INPUT_MODALITY, INPUT_MODALITY_ATTRIBUTE, pointerModality } from './input-modality.ts'

// ── menu/menu.tsx ──
export { MenuItemButton, Menu } from './menu.tsx'
export type { MenuItem, MenuSeparator, MenuLabel, MenuEntry, MenuItemButtonProps } from './menu.tsx'

// ── menu/menu-group.tsx ──
export { MenuGroup, observeStickyMenuGroups } from './menu-group.tsx'

// ── menu/menu-surface.tsx ──
export { MENU_TRANSITION_MS, MenuSurface } from './menu-surface.tsx'
export type { MenuSurfaceProps } from './menu-surface.tsx'

// ── switch/switch.tsx ──
export { Switch } from './switch.tsx'

// ── pill/pill.tsx ──
export { Pill } from './pill.tsx'

// ── state-dot/state-dot.tsx ──
export { StateDot } from './state-dot.tsx'
export type { StateDotState } from './state-dot.tsx'

// ── checkbox/checkbox.tsx ──
export { Checkbox } from './checkbox.tsx'

// ── disclosure-row/disclosure-row.tsx ──
export { DisclosureRow } from './disclosure-row.tsx'
export type { DisclosureRowProps } from './disclosure-row.tsx'

// ── fold-toggle/fold-toggle.tsx ──
export { FoldToggle } from './fold-toggle.tsx'

// ── shortcut-keys/shortcut-keys.tsx ──
export { ShortcutKeys } from './shortcut-keys.tsx'

// ── path-label/path-label.tsx ──
export { PathLabel } from './path-label.tsx'

// ── path-label/path-parts.ts ──
export { pathPartsOf } from './path-parts.ts'

// ── config-field/config-field.tsx ──
export { ConfigField } from './config-field.tsx'
export type { ConfigFieldProps } from './config-field.tsx'

// ── connection-indicator/connection-indicator.tsx ──
export { ConnectionIndicator } from './connection-indicator.tsx'
export type { ConnectionIndicatorState } from './connection-indicator.tsx'

// ── text-shimmer/text-shimmer.tsx ──
export { TextShimmer } from './text-shimmer.tsx'
export type { TextShimmerProps } from './text-shimmer.tsx'

// ── segmented-tabs/segmented-tabs.tsx ──
export { SegmentedTabs } from './segmented-tabs.tsx'
export type { SegmentedTab } from './segmented-tabs.tsx'

// ── command-text/command-text.tsx ──
export { CommandText } from './command-text.tsx'
export type { CommandTextProps } from './command-text.tsx'

// ── inline-editor/inline-editor.tsx ──
export { InlineEditor } from './inline-editor.tsx'

// ── toast/toast.tsx ──
export { Toast } from './toast.tsx'

// ── hover-card/hover-card.tsx ──
export { HoverCard } from './hover-card.tsx'

// ── hover-card/hover-card-group.tsx ──
export { HoverCardGroupContext, HoverCardGroup } from './hover-card-group.tsx'

// ── hover-card/overlay-top-margin.ts ──
export { overlayTopMargin } from './overlay-top-margin.ts'

// ── image-lightbox/image-lightbox.tsx ──
export { ImageLightbox } from './image-lightbox.tsx'
export type { ImageLightboxLabels } from './image-lightbox.tsx'

// ── image-preview/image-preview.tsx ──
export { ImagePreview } from './image-preview.tsx'

// ── animated-rows/animated-rows.tsx ──
export type { AnimatedRowsProps } from './animated-rows.tsx'

// ── user-message-bubble/user-message-bubble.tsx ──
export { UserMessageBubble } from './user-message-bubble.tsx'
export type { UserMessageBubbleProps } from './user-message-bubble.tsx'

// ── zoom-controls/zoom-controls.tsx ──
export { ZoomControls } from './zoom-controls.tsx'
export type { ZoomControlsHandle } from './zoom-controls.tsx'

// ── zoom-controls/document-zoom.ts ──
export { DOCUMENT_ZOOM } from './document-zoom.ts'
export type { DocumentZoomLabels } from './document-zoom.ts'

// ── focus/focus.ts ──
export { isMobileDevice, focusWithoutRing } from './focus.ts'

// ── keyboard-composition/keyboard-composition.ts ──
export { observeComposition } from './keyboard-composition.ts'

// ── modal-layer/use-modal-layer.ts ──
export { modalSelector, closeTopModal, isBehindModal, useModalLayer } from './use-modal-layer.ts'

// ── pointer-grace/pointer-grace.ts ──
export { POINTER_GRACE_MS, usePointerGrace } from './pointer-grace.ts'
export type { PointerGrace } from './pointer-grace.ts'

// ── separator/separator.tsx ──
export { Separator } from './separator.tsx'
export type { SeparatorProps } from './separator.tsx'

// ── aspect-ratio/aspect-ratio.tsx ──
export { AspectRatio } from './aspect-ratio.tsx'
export type { AspectRatioProps } from './aspect-ratio.tsx'

// ── label/label.tsx ──
export { Label } from './label.tsx'

// ── skeleton/skeleton.tsx ──
export { Skeleton } from './skeleton.tsx'

// ── progress/progress.tsx ──
export { Progress } from './progress.tsx'
export type { ProgressProps } from './progress.tsx'

// ── spinner/spinner.tsx ──
export { Spinner } from './spinner.tsx'
export type { SpinnerProps } from './spinner.tsx'

// ── avatar/avatar.tsx ──
export { Avatar } from './avatar.tsx'
export type { AvatarProps } from './avatar.tsx'

// ── breadcrumb/breadcrumb.tsx ──
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb.tsx'

// ── button-group/button-group.tsx ──
export { ButtonGroup } from './button-group.tsx'

// ── empty/empty.tsx ──
export { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './empty.tsx'

// ── item/item.tsx ──
export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from './item.tsx'

// ── field/field.tsx ──
export { Field } from './field.tsx'
export type { FieldProps } from './field.tsx'

// ── card/card.tsx ──
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card.tsx'

// ── alert/alert.tsx ──
export { Alert, AlertTitle, AlertDescription } from './alert.tsx'
export type { AlertVariant, AlertProps } from './alert.tsx'

// ── collapsible/collapsible.tsx ──
export { Collapsible } from './collapsible.tsx'
export type { CollapsibleProps } from './collapsible.tsx'

// ── accordion/accordion.tsx ──
export { Accordion } from './accordion.tsx'
export type { AccordionProps } from './accordion.tsx'

// ── scroll-area/scroll-area.tsx ──
export { ScrollArea } from './scroll-area.tsx'
export type { ScrollAreaProps } from './scroll-area.tsx'

// ── table/table.tsx ──
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './table.tsx'

// ── data-table/data-table.tsx ──
export { DataTable } from './data-table.tsx'
export type { DataTableColumn, DataTableProps } from './data-table.tsx'

// ── toggle/toggle.tsx ──
export { Toggle } from './toggle.tsx'
export type { ToggleProps } from './toggle.tsx'

// ── toggle-group/toggle-group.tsx ──
export { ToggleGroup } from './toggle-group.tsx'
export type { ToggleGroupProps } from './toggle-group.tsx'

// ── anchored-position/use-anchored-position.ts ──
export { useAnchoredPosition } from './use-anchored-position.ts'
export type { AnchoredPositionOptions } from './use-anchored-position.ts'

// ── dismiss-on-outside-pointer/use-dismiss-on-outside-pointer.ts ──
export { useDismissOnOutsidePointer } from './use-dismiss-on-outside-pointer.ts'

// ── popover/popover.tsx ──
export { Popover } from './popover.tsx'
export type { PopoverProps } from './popover.tsx'

// ── combobox/combobox.tsx ──
export { Combobox } from './combobox.tsx'
export type { ComboboxOption, ComboboxProps } from './combobox.tsx'

// ── command/command.tsx ──
export { Command } from './command.tsx'
export type { CommandItem, CommandProps } from './command.tsx'

// ── context-menu/context-menu.tsx ──
export { ContextMenu } from './context-menu.tsx'
export type { ContextMenuProps } from './context-menu.tsx'

// ── menubar/menubar.tsx ──
export { Menubar } from './menubar.tsx'
export type { MenubarEntry } from './menubar.tsx'

// ── sheet/sheet.tsx ──
export { Sheet } from './sheet.tsx'
export type { SheetSide, SheetProps } from './sheet.tsx'

// ── navigation-menu/navigation-menu.tsx ──
export { NavigationMenu } from './navigation-menu.tsx'
export type { NavigationMenuItem } from './navigation-menu.tsx'

// ── pagination/pagination.tsx ──
export { Pagination } from './pagination.tsx'
export type { PaginationProps } from './pagination.tsx'

// ── slider/slider.tsx ──
export { Slider } from './slider.tsx'
export type { SliderProps } from './slider.tsx'

// ── radio-group/radio-group.tsx ──
export { RadioGroup } from './radio-group.tsx'
export type { RadioGroupProps } from './radio-group.tsx'

// ── input-otp/input-otp.tsx ──
export { InputOtp } from './input-otp.tsx'
export type { InputOtpProps } from './input-otp.tsx'

// ── calendar/calendar.tsx ──
export { Calendar } from './calendar.tsx'
export type { CalendarProps } from './calendar.tsx'

// ── date-picker/date-picker.tsx ──
export { DatePicker } from './date-picker.tsx'
export type { DatePickerProps } from './date-picker.tsx'

// ── carousel/carousel.tsx ──
export { Carousel } from './carousel.tsx'
export type { CarouselProps } from './carousel.tsx'

// ── resizable/resizable.tsx ──
export { Resizable } from './resizable.tsx'
export type { ResizableProps } from './resizable.tsx'

// ── sidebar/sidebar.tsx ──
export { Sidebar } from './sidebar.tsx'
export type { SidebarProps } from './sidebar.tsx'

// ── chart/chart.tsx ──
export { BarChart, LineChart, Sparkline } from './chart.tsx'
export type { ChartDatum, BarChartProps, LineChartProps, SparklineProps } from './chart.tsx'

// ── form/form.tsx ──
export { Form } from './form.tsx'
export type { FormProps } from './form.tsx'

// ── clipboard-copy/use-clipboard-copy.ts ──
export { useClipboardCopy } from './use-clipboard-copy.ts'
export type { ClipboardCopyState } from './use-clipboard-copy.ts'

// ── json-tree/json-tree.tsx ──
export { JsonTree } from './json-tree.tsx'
export type { JsonTreeLabels, JsonTreeProps } from './json-tree.tsx'

// ── json-block/json-block.tsx ──
export { JsonBlock } from './json-block.tsx'

// ── search-block/search-block.tsx ──
export { DEFAULT_SEARCH_MAX_LINES, SearchBlock } from './search-block.tsx'
export type { SearchBlockLineMatch, SearchFileGroup, SearchBlockLabels, SearchMatchesBlockProps, SearchPathsBlockProps, SearchBlockProps } from './search-block.tsx'

// ── code-toolbar/code-toolbar.tsx ──
export { CodeToolbar } from './code-toolbar.tsx'
export type { CodeToolbarLabels } from './code-toolbar.tsx'

// ── code-toolbar/code-highlighting-lite.ts ──
export { supportsHighlighting, languageForPath } from './code-highlighting-lite.ts'

// ── diff-block/diff-block.tsx ──
export { DEFAULT_DIFF_MAX_LINES, diffTotals, DiffBlock } from './diff-block.tsx'
export type { DiffHunk, DiffBlockProps, DiffBlockLabels } from './diff-block.tsx'

// ── diff-block/mini-diff.ts ──
export { structuredPatch } from './mini-diff.ts'
export type { MiniDiffHunk, StructuredPatchOptions } from './mini-diff.ts'

// ── terminal-block/terminal-block.tsx ──
export { DEFAULT_TERMINAL_MAX_LINES, TerminalBlock } from './terminal-block.tsx'
export type { TerminalBlockLabels, TerminalBlockProps } from './terminal-block.tsx'

// ── terminal-block/ansi-lite.ts ──
export { parseAnsiLines } from './ansi-lite.ts'
export type { AnsiSpan, AnsiLine } from './ansi-lite.ts'

// ── head-tail-cap/head-tail-cap.ts ──
export { headTailCap } from './head-tail-cap.ts'
export type { HeadTailCap } from './head-tail-cap.ts'

