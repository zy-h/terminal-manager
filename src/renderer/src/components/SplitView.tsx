import TerminalPane from './TerminalPane'
import { getPresets } from '../layoutPresets'
import { useT } from '../store/useStore'
import type { Group } from '../store/useStore'
import type { Session } from '@shared/types'

const AREA_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

interface SplitViewProps {
  group: Group
  sessions: Session[]
  onSelectSlotSession: (slotIndex: number, sessionId: string) => void
  onClearSlot: (slotIndex: number) => void
}

/** 渲染一个分屏分组：按 layout + presetIndex 取排版，每格标题下拉可选会话（允许重复） */
export default function SplitView({ group, sessions, onSelectSlotSession, onClearSlot }: SplitViewProps) {
  const t = useT()
  const presets = getPresets(group.layout)
  const preset = presets[group.presetIndex] ?? presets[0]
  const areas = preset.areas
  const cols = areas[0].split(/\s+/).length
  const gridTemplateAreas = areas.map((a) => `"${a}"`).join(' ')

  const getSession = (id: string): Session | null =>
    id ? sessions.find((s) => s.id === id) ?? null : null

  return (
    <div
      className="split-view"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${areas.length}, 1fr)`,
        gridTemplateAreas
      }}
    >
      {group.slots.map((sid, i) => {
        const session = getSession(sid)
        return (
          <div key={i} className="pane-slot" style={{ gridArea: AREA_LETTERS[i] }}>
            <div className="pane-header">
              <select
                className="pane-select"
                value={sid}
                title={t('pane.select.title')}
                onChange={(e) => {
                  const v = e.target.value
                  if (v) onSelectSlotSession(i, v)
                  else onClearSlot(i)
                }}
              >
                <option value="">{t('pane.notSelected')}</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
                <div className="empty-slot-hint">{t('pane.select.hint')}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
