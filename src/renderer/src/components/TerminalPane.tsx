import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { ShellType } from '@shared/types'
import { useStore } from '../store/useStore'
import '@xterm/xterm/css/xterm.css'

interface TerminalPaneProps {
  sessionId: string
  shellType: ShellType
  cwd?: string
}

/**
 * 纯终端区：订阅某会话的 pty 输出 + 发送输入。
 * 不管理 pty 生命周期（pty 按会话唯一，多窗口共享）。
 * 背景色来自全局设置，变化时动态更新主题（不重建终端）。
 */
export default function TerminalPane({ sessionId, shellType, cwd }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const bgColor = useStore((s) => s.settings.terminalBgColor)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new Terminal({
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      theme: { background: bgColor, foreground: '#d4d4d4', cursor: '#d4d4d4' }
    })
    termRef.current = term
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(container)

    term.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyC' && term.hasSelection()) {
        navigator.clipboard.writeText(term.getSelection()).catch(() => {})
        return false
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        navigator.clipboard
          .readText()
          .then((text) => term.paste(text))
          .catch(() => {})
        return false
      }
      return true
    })

    let fitTimer: number | null = null
    const doFit = (): void => {
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      fitTimer = window.setTimeout(() => {
        fitAddon.fit()
        window.api.terminal.resize(sessionId, term.cols, term.rows)
      }, 80)
    }

    window.api.terminal.spawn(sessionId, shellType, cwd)
    requestAnimationFrame(doFit)

    const offData = window.api.terminal.onData(({ sessionId: sid, data }) => {
      if (sid === sessionId) term.write(data)
    })
    const inputDisposable = term.onData((data) => {
      window.api.terminal.input(sessionId, data)
    })

    const ro = new ResizeObserver(doFit)
    ro.observe(container)
    window.addEventListener('resize', doFit)

    return () => {
      termRef.current = null
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      offData()
      inputDisposable.dispose()
      ro.disconnect()
      window.removeEventListener('resize', doFit)
      window.api.terminal.kill(sessionId)
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, shellType, cwd])

  // 背景色变化时更新主题（不重建终端、不丢历史）
  useEffect(() => {
    const term = termRef.current
    if (term) {
      term.options.theme = { background: bgColor, foreground: '#d4d4d4', cursor: '#d4d4d4' }
    }
  }, [bgColor])

  return <div className="terminal-pane" ref={containerRef} />
}
