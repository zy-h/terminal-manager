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

    // 兼容合成事件（语音输入法等模拟的按键 e.code 可能为空）：结合 code/key/keyCode 判断
    const isKeyC = (ev: KeyboardEvent): boolean =>
      ev.code === 'KeyC' || ev.key === 'c' || ev.key === 'C' || ev.keyCode === 67
    const isKeyV = (ev: KeyboardEvent): boolean =>
      ev.code === 'KeyV' || ev.key === 'v' || ev.key === 'V' || ev.keyCode === 86

    term.attachCustomKeyEventHandler((e) => {
      // 中断命令（SIGINT）：Ctrl+Shift+C → 走专门 interrupt 通道直写 pty（绕过 \x03 过滤）
      if (e.type === 'keydown' && e.ctrlKey && e.shiftKey && isKeyC(e)) {
        window.api.terminal.interrupt(sessionId)
        return false
      }
      // 复制：Ctrl+C 有选区时复制；无选区也拦截，避免作为 SIGINT 中断当前命令。
      // 语音输入法模拟的 Ctrl+C 的 e.code 常为空，必须用 isKeyC 兜底，否则会漏拦 → 中断 pty 里的程序。
      if (e.type === 'keydown' && e.ctrlKey && !e.shiftKey && !e.altKey && isKeyC(e)) {
        if (term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection()).catch(() => {})
        }
        return false
      }
      // 粘贴：Ctrl+V 或 Ctrl+Shift+V → 读剪贴板文本写入 pty。
      // 必须拦截 Ctrl+V：语音输入法用 Ctrl+V 粘贴，但其合成的 Ctrl+V 若放行，
      // 会被 xterm 转成 \x16 发往 pty，被 codex/claude 等解释为特殊键
      // （codex 报 "Failed to paste image"），导致文本进不去。统一走 term.paste 写真实文本。
      if (e.type === 'keydown' && e.ctrlKey && !e.altKey && isKeyV(e)) {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) term.paste(text)
          })
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

    // 阻止 xterm 自带 paste 处理：合成事件（语音输入法）下浏览器 paste 仍会触发，
    // 会与 keydown handler 里的 term.paste 重复写入文本。粘贴统一由 term.paste 完成。
    const onPaste = (ev: ClipboardEvent): void => {
      ev.preventDefault()
      ev.stopPropagation()
    }
    container.addEventListener('paste', onPaste, true)

    const ro = new ResizeObserver(doFit)
    ro.observe(container)
    window.addEventListener('resize', doFit)

    return () => {
      termRef.current = null
      fitRef.current = null
      if (fitTimer !== null) window.clearTimeout(fitTimer)
      offData()
      inputDisposable.dispose()
      container.removeEventListener('paste', onPaste, true)
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
