import type { LayoutMode } from '@shared/types'

interface LayoutSwitcherProps {
  layout: LayoutMode
  onChange: (mode: LayoutMode) => void
}

const MODES: LayoutMode[] = [1, 2, 3, 4, 5, 6, 7, 8]

/** 1~8 分屏模式切换器 */
export default function LayoutSwitcher({ layout, onChange }: LayoutSwitcherProps) {
  return (
    <div className="layout-switcher">
      {MODES.map((m) => (
        <button
          key={m}
          className={`layout-btn ${layout === m ? 'active' : ''}`}
          onClick={() => onChange(m)}
          title={`${m} 个终端`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
