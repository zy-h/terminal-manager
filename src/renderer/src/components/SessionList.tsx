import { useState } from 'react'
import SessionItem from './SessionItem'
import NewSessionDialog from './NewSessionDialog'
import ConfirmDialog from './ConfirmDialog'
import { useStore } from '../store/useStore'

export default function SessionList() {
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
        <span>会话池</span>
        <button className="btn-new" onClick={() => setDialogOpen(true)} title="新建会话">
          +
        </button>
      </div>
      <div className="session-items">
        {sessions.length === 0 ? (
          <div className="session-list-empty">
            <div className="placeholder-icon">⟨ ⟩</div>
            <div className="placeholder-title">还没有会话</div>
            <div className="placeholder-hint">点击右上角 + 新建终端会话</div>
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
      <div className="session-list-tip">点击会话 → 单一显示 · 切换分组用顶部下拉</div>
      {dialogOpen && <NewSessionDialog onClose={() => setDialogOpen(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="删除会话"
          message={`确定删除会话「${confirmDelete.name}」吗？该操作不可撤销。`}
          confirmText="删除"
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
