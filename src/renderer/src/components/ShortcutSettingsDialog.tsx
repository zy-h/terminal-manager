import { useEffect, useState, type ReactNode } from 'react'
import { useStore, useT } from '../store/useStore'
import { eventToShortcut, TERMINAL_RESERVED, formatShortcut } from '../lib/shortcut'

type Target = 'minimize' | 'maximize'

interface Props {
  onClose: () => void
}

/**
 * 窗口快捷键设置：最小化 / 最大化（还原）。
 * 点「修改」进入录制：在捕获阶段拦截按键并规范化保存；Esc 取消。
 * 两个快捷键不能相同；若选了终端保留组合（Ctrl+Shift+C/V）给出警告。
 */
export default function ShortcutSettingsDialog({ onClose }: Props) {
  const t = useT()
  const minimize = useStore((s) => s.settings.minimizeShortcut)
  const maximize = useStore((s) => s.settings.maximizeShortcut)
  const setMinimizeShortcut = useStore((s) => s.setMinimizeShortcut)
  const setMaximizeShortcut = useStore((s) => s.setMaximizeShortcut)

  const [recording, setRecording] = useState<Target | null>(null)
  const [warn, setWarn] = useState('')

  // 录制模式：捕获阶段优先拦截，避免按键发往终端
  useEffect(() => {
    if (!recording) return
    const onKey = (e: KeyboardEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(null)
        return
      }
      const sc = eventToShortcut(e)
      if (!sc) return // 仅修饰键，继续等待真正的按键
      const other = recording === 'minimize' ? maximize : minimize
      if (sc === other) {
        setWarn(t('shortcut.conflict'))
        return
      }
      setWarn('')
      if (recording === 'minimize') void setMinimizeShortcut(sc)
      else void setMaximizeShortcut(sc)
      setRecording(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [recording, minimize, maximize, setMinimizeShortcut, setMaximizeShortcut, t])

  const renderRow = (
    label: string,
    value: string,
    target: Target,
    setter: (s: string) => Promise<void>
  ): ReactNode => {
    const isRecording = recording === target
    const reserved = TERMINAL_RESERVED.has(value)
    return (
      <div className="shortcut-row" key={target}>
        <span className="shortcut-label">{label}</span>
        <span className={`shortcut-value ${isRecording ? 'recording' : ''}`}>
          {isRecording
            ? t('shortcut.recording')
            : value
              ? formatShortcut(value)
              : t('shortcut.disabled')}
        </span>
        {!isRecording && reserved && value ? (
          <span className="shortcut-warn">{t('shortcut.reserved')}</span>
        ) : null}
        <div className="shortcut-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setWarn('')
              setRecording(target)
            }}
          >
            {isRecording ? t('shortcut.waiting') : t('shortcut.change')}
          </button>
          <button
            className="btn btn-secondary"
            disabled={!value}
            onClick={() => {
              void setter('')
              setRecording(null)
              setWarn('')
            }}
          >
            {t('shortcut.clear')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog shortcut-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{t('shortcut.title')}</div>
        {renderRow(t('shortcut.minimize'), minimize, 'minimize', setMinimizeShortcut)}
        {renderRow(t('shortcut.maximize'), maximize, 'maximize', setMaximizeShortcut)}
        {warn ? <div className="shortcut-warn">{warn}</div> : null}
        <div className="shortcut-hint">{t('shortcut.hint')}</div>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
