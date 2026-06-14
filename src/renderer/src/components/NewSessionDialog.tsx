import { useState } from 'react'
import { useStore } from '../store/useStore'
import { SHELL_LABELS, type ShellType } from '@shared/types'

interface NewSessionDialogProps {
  onClose: () => void
}

/**
 * 名称留空时的默认命名规则：
 * - 有目录：取最后一级文件夹名（如 E:\code4\1688_to_jd → 1688_to_jd）
 * - 系统盘根目录（如 C:\）或没填目录：用 shell 工具名（如 Windows PowerShell）
 */
function deriveDefaultName(cwd: string, shellType: ShellType): string {
  const trimmed = cwd.trim()
  if (!trimmed) return SHELL_LABELS[shellType]
  // 去掉末尾斜杠
  let path = trimmed
  while (path.length > 1 && (path.endsWith('\\') || path.endsWith('/'))) {
    path = path.slice(0, -1)
  }
  // 找最后一个路径分隔符
  let lastSep = -1
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '\\' || path[i] === '/') lastSep = i
  }
  const last = lastSep >= 0 ? path.slice(lastSep + 1) : path
  // 根目录（盘符，如 C:）或为空 → 用 shell 名
  if (!last || /^[A-Za-z]:$/.test(last)) return SHELL_LABELS[shellType]
  return last
}

/** 新建会话弹窗：名称 + shell + 起始目录（默认填默认目录，可浏览，可设为默认） */
export default function NewSessionDialog({ onClose }: NewSessionDialogProps) {
  const shells = useStore((s) => s.shells)
  const addSession = useStore((s) => s.addSession)
  const activateSession = useStore((s) => s.activateSession)
  const defaultCwd = useStore((s) => s.settings.defaultCwd)
  const setDefaultCwd = useStore((s) => s.setDefaultCwd)

  const firstType = shells[0]?.type ?? 'powershell'
  const [name, setName] = useState('')
  const [shellType, setShellType] = useState<ShellType>(firstType)
  const [cwd, setCwd] = useState(defaultCwd)
  const [savedTip, setSavedTip] = useState(false)

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.dialog.chooseDirectory()
    if (dir) setCwd(dir)
  }

  const handleSaveAsDefault = async (): Promise<void> => {
    await setDefaultCwd(cwd.trim())
    setSavedTip(true)
    window.setTimeout(() => setSavedTip(false), 1500)
  }

  const handleCreate = async (): Promise<void> => {
    const trimmedCwd = cwd.trim()
    const finalName = name.trim() || deriveDefaultName(trimmedCwd, shellType)
    const created = await addSession(finalName, shellType, trimmedCwd)
    activateSession(created.id)
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">新建终端会话</div>

        <label className="form-label">
          <span>名称</span>
          <input
            className="form-input"
            value={name}
            placeholder="留空则按目录或 Shell 自动命名"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />
        </label>

        <label className="form-label">
          <span>Shell 类型</span>
          <select
            className="form-input"
            value={shellType}
            onChange={(e) => setShellType(e.target.value as ShellType)}
          >
            {shells.map((sh) => (
              <option key={sh.type} value={sh.type}>
                {sh.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          <span>起始目录{defaultCwd ? `（默认：${defaultCwd}）` : '（可选）'}</span>
          <div className="cwd-row">
            <input
              className="form-input"
              value={cwd}
              placeholder="留空则用用户目录"
              onChange={(e) => setCwd(e.target.value)}
            />
            <button className="btn btn-secondary" type="button" onClick={handleBrowse}>
              浏览…
            </button>
            <button
              className="btn default-btn"
              type="button"
              onClick={handleSaveAsDefault}
              title="把当前目录设为新建会话的默认起始目录"
            >
              {savedTip ? '已保存' : '设为默认'}
            </button>
          </div>
        </label>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            创建并打开
          </button>
        </div>
      </div>
    </div>
  )
}
