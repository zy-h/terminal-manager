import { useState } from 'react'
import { useStore, useT } from '../store/useStore'
import type { Group } from '../store/useStore'
import { getPresets } from '../layoutPresets'
import LayoutSwitcher from './LayoutSwitcher'
import ConfirmDialog from './ConfirmDialog'

/** 顶部分组栏：分组名(改名) + 排版下拉 + 分组切换下拉 + 语言切换 + 删除组(确认) + 窗口数 */
export default function GroupBar() {
  const t = useT()
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const singleSessionId = useStore((s) => s.singleSessionId)
  const sessions = useStore((s) => s.sessions)
  const switchGroup = useStore((s) => s.switchGroup)
  const renameActiveGroup = useStore((s) => s.renameActiveGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const setGroupPreset = useStore((s) => s.setGroupPreset)
  const createGroupByLayout = useStore((s) => s.createGroupByLayout)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)

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
            <span className="group-name" onClick={beginEdit} title={t('group.rename.hint')}>
              {activeGroup.name}
              <span className="group-layout-tag">
                {activeGroup.layout} {t('group.pane')}
              </span>
            </span>
          )
        ) : (
          <span className="group-name single">
            {singleSession?.name ?? t('group.single')}
            <span className="group-layout-tag">1 {t('group.pane')}</span>
          </span>
        )}
        {activeGroup && !editing && (
          <button className="icon-btn" title={t('group.delete')} onClick={() => setConfirmDelete(activeGroup)}>
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
            title={t('group.layout.switch')}
          >
            {presets.map((p, i) => (
              <option key={i} value={i}>
                {t('group.layout.prefix')}: {p.name}
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
          title={t('group.switch.title')}
        >
          <option value="" disabled>
            {t('group.switch.placeholder')}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}（{g.layout} {t('group.pane')}）
            </option>
          ))}
        </select>
        <button
          className="lang-btn"
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          title="Language / 语言"
        >
          {t('lang.toggle')}
        </button>
        <LayoutSwitcher layout={activeGroup?.layout ?? 1} onChange={createGroupByLayout} />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('group.delete.title')}
          message={t('group.delete.msg', { name: confirmDelete.name })}
          confirmText={t('common.delete')}
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
