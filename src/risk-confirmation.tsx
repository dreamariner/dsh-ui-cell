// RiskConfirmation: controlled risk acknowledgement dialog.
// 来源：packages/client/ui-primitives/src/RiskConfirmation.tsx @ dsh v0.2.2-rc.5 (9c2670d3bc)
// 主操作在调用方确认勾选前保持禁用；初始焦点落在勾选框（data-modal-autofocus）。
// rc.5 起警告图标上收到 Modal 的 tone='warning'，勾选框改用共享 Checkbox 组件。
// ── 用法（生成物，勿手改：改 docs/wiki/demos/ 后跑 pnpm skill:usage）
//   import { RiskConfirmation } from './risk-confirmation.tsx'
//   <RiskConfirmation open={open} acknowledged={ack} onAcknowledgedChange={setAck}
//   title="清空全部记忆" … />
//   props：open / title / description / acknowledgeLabel / cancelLabel / closeLabel / confirmLabel / acknowledged / disabled / onAcknowledgedChange / onCancel / onConfirm
// ────────────────────────────────────────────────────────────────────────

import { Button } from './button.tsx'
import { Checkbox } from './checkbox.tsx'
import { Modal } from './modal.tsx'
import css from './risk-confirmation.css'

export interface RiskConfirmationProps {
  open: boolean
  title: string
  description: string
  acknowledgeLabel: string
  cancelLabel: string
  closeLabel: string
  confirmLabel: string
  acknowledged: boolean
  disabled?: boolean
  onAcknowledgedChange: (acknowledged: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Render one in-page confirmation whose primary action is unavailable until
 * the caller-controlled acknowledgement is checked.
 */
export function RiskConfirmation({
  open,
  title,
  description,
  acknowledgeLabel,
  cancelLabel,
  closeLabel,
  confirmLabel,
  acknowledged,
  disabled = false,
  onAcknowledgedChange,
  onCancel,
  onConfirm,
}: RiskConfirmationProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      tone="warning"
      closeLabel={closeLabel}
      className={css.confirmation ?? ''}
      contentClassName={css.confirmationContent ?? ''}
      footer={(
        <>
          <Button variant="outline" className={css.modalAction} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            className={css.confirmAction}
            disabled={disabled || !acknowledged}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <p className={css.description}>{description}</p>
      <Checkbox
        className={css.acknowledgement}
        checked={acknowledged}
        disabled={disabled}
        modalAutofocus
        label={acknowledgeLabel}
        onChange={onAcknowledgedChange}
      />
    </Modal>
  )
}
