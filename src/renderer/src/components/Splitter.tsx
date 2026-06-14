import type { MouseEvent as ReactMouseEvent } from 'react'

interface SplitterProps {
  leftPct: number
  onResize: (pct: number) => void
}

/** 左右区域之间的可拖拽分隔条，默认 2:8，拖拽范围限制在 [10%, 40%] */
export default function Splitter({ leftPct, onResize }: SplitterProps) {
  const handleMouseDown = (e: ReactMouseEvent): void => {
    e.preventDefault()
    const startX = e.clientX
    const winWidth = window.innerWidth || 1

    const onMove = (ev: MouseEvent): void => {
      const deltaPct = ((ev.clientX - startX) / winWidth) * 100
      const next = Math.max(10, Math.min(40, leftPct + deltaPct))
      onResize(next)
    }

    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
    }

    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return <div className="splitter" onMouseDown={handleMouseDown} />
}
