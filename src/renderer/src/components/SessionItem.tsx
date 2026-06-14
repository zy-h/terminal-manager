import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { SHELL_LABELS, type Session } from '@shared/types'
import { useT } from '../store/useStore'

interface SessionItemProps {
  session: Session
  shown: boolean
  onActivate: () => void
  onRename: (name: string) => void
  onDelete: () => void
}

/** 会话池中的单个会话项：第一行会话名，第二行 shell 类型（小字）。点击切换显示 */
export default function SessionItem({ session, shown, onActivate, onRename, onDelete }: SessionItemProps) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.name)

  const beginEdit = (e: ReactMouseEvent): void => {
    e.stopPropagation()
    setDraft(session.name)
    setEditing(true)
  }

  const commit = (): void => {
    const n = draft.trim()
    if (n && n !== session.name) onRename(n)
    setEditing(false)
  }

  const cancel = (): void => {
    setDraft(session.name)
    setEditing(false)
  }

  return (
    <div className={`session-item ${shown ? 'shown' : ''}`} onClick={onActivate}>
      <span className={`session-status ${shown ? 'on' : 'off'}`} />
      <div className="session-text">
        {editing ? (
          <input
            className="session-name-input"
            value={draft}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
          />
        ) : (
          <span className="session-name">{session.name}</span>
        )}
        <span className="session-shell">{SHELL_LABELS[session.shellType]}</span>
      </div>
      <div className="session-actions">
        <button className="icon-btn" title={t('session.rename')} onClick={beginEdit}>
          ✎
        </button>
        <button
          className="icon-btn danger"
          title={t('session.delete')}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
