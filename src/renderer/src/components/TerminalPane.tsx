import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { ShellType } from '@shared/types'
import { useStore } from '../store/useStore'
import { getTerminalBuffer } from '../terminalBuffer'
import '@xterm/xterm/css/xterm.css'

interface TerminalPaneProps {
  sessionId: string
  shellType: ShellType
  cwd?: string
}

/** 字体默认大小，Ctrl+0 重置时回到此值 */
const FONT_DEFAULT = 14

/**
 * 纯终端区：订阅某会话的 pty 输出 + 发送输入。
 *
 * pty 生命周期与会话绑定：切换会话时不 kill（由 removeSession / 彻底退出负责销毁），
 * 切走再切回时，挂载时从 terminalBuffer 重放该会话的历史输出，避免内容丢失。
 * 背景色 / 字体大小来自全局设置，变化时动态更新主题与字号（不重建终端、不丢历史）。
 */
export default function TerminalPane({ sessionId, shellType, cwd }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const bgColor = useStore((s) => s.settings.terminalBgColor)
  const fontSize = useStore((s) => s.settings.terminalFontSize)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new Terminal({
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize,
      cursorBlink: true,
      theme: { background: bgColor, foreground: '#d4d4d4', cursor: '#d4d4d4' }
    })
    termRef.current = term
    const fitAddon = new FitAddon()
    fitRef.current = fitAddon
    term.loadAddon(fitAddon)
    term.open(container)

    term.attachCustomKeyEventHandler((e) => {
      // 复制：Ctrl+Shift+C（有选区时）
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyC' && term.hasSelection()) {
        navigator.clipboard.writeText(term.getSelection()).catch(() => {})
        return false
      }
      // 粘贴：Ctrl+Shift+V
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        navigator.clipboard
          .readText()
          .then((text) => term.paste(text))
          .catch(() => {})
        return false
      }
      // 字体缩放：Ctrl + = 放大 / Ctrl + - 缩小 / Ctrl + 0 重置
      // （Ctrl 与 = / - / 0 不是 shell 控制字符，安全拦截，避免字符被发往 pty）
      if (e.type === 'keydown' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        const st = useStore.getState()
        const cur = st.settings.terminalFontSize
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
          st.setTerminalFontSize(cur + 1)
          return false
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
          st.setTerminalFontSize(cur - 1)
          return false
        }
        if (e.code === 'Digit0' || e.code === 'Numpad0') {
          st.setTerminalFontSize(FONT_DEFAULT)
          return false
        }
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

    // 重放该会话的历史输出：切走再切回时恢复之前已渲染的内容
    const history = getTerminalBuffer(sessionId)
    if (history) term.write(history)

    requestAnimationFrame(doFit)

    // 增量写入：仅显示「挂载之后」本会话产生的新数据（历史已由上方重放）
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
      fitRef.current = null
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      offData()
      inputDisposable.dispose()
      ro.disconnect()
      window.removeEventListener('resize', doFit)
      // 注意：这里不调用 terminal.kill —— pty 生命周期与会话绑定，
      // 切换会话只销毁前端 Terminal 实例，pty 继续运行，历史保留在 terminalBuffer。
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

  // 字体大小变化时更新字号并重新适配尺寸（不重建终端、不丢历史）
  useEffect(() => {
    const term = termRef.current
    const fit = fitRef.current
    if (term && fit) {
      term.options.fontSize = fontSize
      fit.fit()
      window.api.terminal.resize(sessionId, term.cols, term.rows)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize])

  return <div className="terminal-pane" ref={containerRef} />
}
