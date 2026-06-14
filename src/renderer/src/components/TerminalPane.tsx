import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { ShellType } from '@shared/types'
import '@xterm/xterm/css/xterm.css'

interface TerminalPaneProps {
  sessionId: string
  shellType: ShellType
  cwd?: string
}

/**
 * 纯终端区：订阅某会话的 pty 输出 + 发送输入。
 * 不管理 pty 生命周期（pty 按会话唯一，多窗口共享；由会话删除/应用退出时销毁），
 * 因此同会话的多个 TerminalPane 天然输入输出同步。
 */
export default function TerminalPane({ sessionId, shellType, cwd }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new Terminal({
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' }
    })
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

    // resize 防抖（80ms），避免布局变化时频繁 resize 触发 ConPTY 原生崩溃
    let fitTimer: number | null = null
    const doFit = (): void => {
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      fitTimer = window.setTimeout(() => {
        fitAddon.fit()
        window.api.terminal.resize(sessionId, term.cols, term.rows)
      }, 80)
    }

    // 复用会话的 pty（已存在则不重建）→ 同会话多窗口共享
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
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      offData()
      inputDisposable.dispose()
      ro.disconnect()
      window.removeEventListener('resize', doFit)
      // 注意：不 kill pty（pty 按会话唯一，多窗口共享，会话持续）
      term.dispose()
    }
  }, [sessionId, shellType, cwd])

  return <div className="terminal-pane" ref={containerRef} />
}
