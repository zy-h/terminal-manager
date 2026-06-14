import { useT } from '../store/useStore'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

/** 通用确认弹窗（删除会话/分组等危险操作前确认） */
export default function ConfirmDialog({
  title,
  message,
  confirmText = '确定',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const t = useT()
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('dialog.cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
