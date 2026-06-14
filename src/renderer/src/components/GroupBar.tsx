import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Group } from '../store/useStore'
import { getPresets } from '../layoutPresets'
import LayoutSwitcher from './LayoutSwitcher'
import ConfirmDialog from './ConfirmDialog'

/** 顶部分组栏：分组名(改名) + 排版下拉 + 分组切换下拉 + 删除组(确认) + 窗口数切换器 */
export default function GroupBar() {
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const singleSessionId = useStore((s) => s.singleSessionId)
  const sessions = useStore((s) => s.sessions)
  const switchGroup = useStore((s) => s.switchGroup)
  const renameActiveGroup = useStore((s) => s.renameActiveGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const setGroupPreset = useStore((s) => s.setGroupPreset)
  const createGroupByLayout = useStore((s) => s.createGroupByLayout)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null)

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null
  const singleSession = singleSessionId ? sessions.find((s) => s.id === singleSessionId) ?? null : null
  const presets = activeGroup ? getPresets(activeGroup.layout) : []

  const beginEdit = (): void => {
    if (!activeGroup) return
    setDraft(activeGroup.name)
    setEditing(true)
  }

  const commit = (): void => {
    const n = draft.trim()
    if (n && activeGroup) renameActiveGroup(n)
    setEditing(false)
  }

  return (
    <div className="group-bar">
      <div className="group-name-area">
        {activeGroup ? (
          editing ? (
            <input
              className="group-name-input"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
            />
          ) : (
            <span className="group-name" onClick={beginEdit} title="点击重命名分组">
              {activeGroup.name}
              <span className="group-layout-tag">{activeGroup.layout} 屏</span>
            </span>
          )
        ) : (
          <span className="group-name single">
            {singleSession?.name ?? '单一会话'}
            <span className="group-layout-tag">1 屏</span>
          </span>
        )}
        {activeGroup && !editing && (
          <button
            className="icon-btn"
            title="删除该分组"
            onClick={() => setConfirmDelete(activeGroup)}
          >
            🗑
          </button>
        )}
      </div>

      <div className="group-tools">
        {activeGroup && (
          <select
            className="group-switch"
            value={activeGroup.presetIndex}
            onChange={(e) => setGroupPreset(Number(e.target.value))}
            title="切换排版方式"
          >
            {presets.map((p, i) => (
              <option key={i} value={i}>
                排版：{p.name}
              </option>
            ))}
          </select>
        )}
        <select
          className="group-switch"
          value={activeGroupId ?? ''}
          onChange={(e) => {
            if (e.target.value) switchGroup(e.target.value)
          }}
          title="切换分组"
        >
          <option value="" disabled>
            切换分组…
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}（{g.layout} 屏）
            </option>
          ))}
        </select>
        <LayoutSwitcher layout={activeGroup?.layout ?? 1} onChange={createGroupByLayout} />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="删除分组"
          message={`确定删除分组「${confirmDelete.name}」吗？分组配置将被移除（会话本身保留）。`}
          confirmText="删除"
          onConfirm={() => {
            removeGroup(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
