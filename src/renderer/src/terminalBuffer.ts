/**
 * 每个终端会话的输出缓冲区（渲染进程单例）。
 *
 * 设计动机：pty 的生命周期与会话绑定（切换会话不 kill pty），但 xterm 的前端
 * Terminal 实例随 React 组件卸载而 dispose，已渲染的内容随之丢失。本模块把 pty
 * 的输出按 sessionId 累积到内存，TerminalPane 挂载时重放历史，从而「切走再切回」
 * 不会丢失之前的输出。
 *
 * 注意：这里只做「累积」，不往任何 Terminal 实例写入；实时显示仍由 TerminalPane
 * 自己的增量监听器负责，避免重复写入。
 */

const MAX_BUFFER = 256 * 1024 // 每会话最多保留约 256KB 历史，超出则截断保留最新部分

const buffers = new Map<string, string>()
let started = false

/** 启动全局监听：把所有 pty 输出按会话累积到内存缓冲区。应用启动时调用一次。 */
export function initTerminalBuffer(): void {
  if (started) return
  started = true
  window.api.terminal.onData(({ sessionId, data }) => {
    const prev = buffers.get(sessionId)
    let next = prev === undefined ? data : prev + data
    if (next.length > MAX_BUFFER) {
      // 仅保留最新的 MAX_BUFFER 字节，避免长时间运行后内存无限增长
      next = next.slice(next.length - MAX_BUFFER)
    }
    buffers.set(sessionId, next)
  })
}

/** 取某会话的累积输出（TerminalPane 挂载时用于重放历史） */
export function getTerminalBuffer(sessionId: string): string {
  return buffers.get(sessionId) ?? ''
}

/** 清除某会话的缓冲区（删除会话时调用，释放内存） */
export function clearTerminalBuffer(sessionId: string): void {
  buffers.delete(sessionId)
}
