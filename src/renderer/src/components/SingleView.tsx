import TerminalPane from './TerminalPane'
import { useStore, useT } from '../store/useStore'

/** 单一视图：点未分组会话时进入，该会话独占全屏 */
export default function SingleView() {
  const t = useT()
  const singleSessionId = useStore((s) => s.singleSessionId)
  const sessions = useStore((s) => s.sessions)

  const session = singleSessionId ? sessions.find((s) => s.id === singleSessionId) ?? null : null

  return (
    <div
      className="split-view"
      style={{
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
        gridTemplateAreas: '"a"'
      }}
    >
      <div className="pane-slot" style={{ gridArea: 'a' }}>
        <div className="pane-header">
          <span className="pane-title">{session?.name ?? t('pane.empty.unselected')}</span>
        </div>
        {session ? (
          <TerminalPane
            sessionId={session.id}
            shellType={session.shellType}
            cwd={session.cwd || undefined}
          />
        ) : (
          <div className="empty-slot">
            <div className="empty-slot-icon">▢</div>
            <div className="empty-slot-hint">{t('pane.empty.single')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
