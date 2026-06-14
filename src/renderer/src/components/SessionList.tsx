import { useState } from 'react'
import SessionItem from './SessionItem'
import NewSessionDialog from './NewSessionDialog'
import ConfirmDialog from './ConfirmDialog'
import { useStore, useT } from '../store/useStore'

export default function SessionList() {
  const t = useT()
  const sessions = useStore((s) => s.sessions)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const singleSessionId = useStore((s) => s.singleSessionId)
  const activateSession = useStore((s) => s.activateSession)
  const removeSession = useStore((s) => s.removeSession)
  const renameSession = useStore((s) => s.renameSession)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  // 当前正显示的会话（活动分组的 slots 去重，或单一视图）→ 高亮
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null
  const shownIds = new Set<string>(
    activeGroup
      ? activeGroup.slots.filter(Boolean)
      : singleSessionId
        ? [singleSessionId]
        : []
  )

  return (
    <div className="session-list">
      <div className="session-list-header">
        <span>{t('session.pool')}</span>
        <button className="btn-new" onClick={() => setDialogOpen(true)} title={t('session.new')}>
          +
        </button>
      </div>
      <div className="session-items">
        {sessions.length === 0 ? (
          <div className="session-list-empty">
            <div className="placeholder-icon">⟨ ⟩</div>
            <div className="placeholder-title">{t('session.empty.title')}</div>
            <div className="placeholder-hint">{t('session.empty.hint')}</div>
          </div>
        ) : (
          sessions.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              shown={shownIds.has(s.id)}
              onActivate={() => activateSession(s.id)}
              onRename={(name) => renameSession(s.id, name)}
              onDelete={() => setConfirmDelete({ id: s.id, name: s.name })}
            />
          ))
        )}
      </div>
      <div className="session-list-tip">{t('session.tip')}</div>
      {dialogOpen && <NewSessionDialog onClose={() => setDialogOpen(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title={t('session.delete.title')}
          message={t('session.delete.msg', { name: confirmDelete.name })}
          confirmText={t('common.delete')}
          onConfirm={() => {
            removeSession(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
