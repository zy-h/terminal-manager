import { PRESET_BG_COLORS } from '../constants'
import { useStore, useT } from '../store/useStore'

interface ColorPaletteDialogProps {
  onClose: () => void
}

/** 终端背景色选择：10 种护眼预设色板 + 自定义颜色 */
export default function ColorPaletteDialog({ onClose }: ColorPaletteDialogProps) {
  const t = useT()
  const terminalBgColor = useStore((s) => s.settings.terminalBgColor)
  const setTerminalBgColor = useStore((s) => s.setTerminalBgColor)

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog color-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{t('terminal.bgColor')}</div>
        <div className="color-grid">
          {PRESET_BG_COLORS.map((c) => {
            const active = terminalBgColor.toLowerCase() === c.color.toLowerCase()
            return (
              <button
                key={c.color}
                className={`color-item ${active ? 'active' : ''}`}
                style={{ background: c.color }}
                title={c.name}
                onClick={() => {
                  setTerminalBgColor(c.color)
                  onClose()
                }}
              >
                <span className="color-item-name">{c.name}</span>
              </button>
            )
          })}
        </div>
        <label className="form-label">
          <span>{t('terminal.customColor')}</span>
          <input
            type="color"
            className="color-picker"
            value={terminalBgColor}
            onChange={(e) => setTerminalBgColor(e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
