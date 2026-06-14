import { BrowserWindow } from 'electron'
import { PtySession } from './session'
import type { ShellType } from '../../shared/types'

/**
 * 统一管理所有 pty 会话的生命周期，并把 pty 输出推送回渲染进程。
 * pty 按 sessionId 唯一：同一会话的多个窗口共享同一个 pty，
 * 因此「复制显示」时输入输出天然同步。
 */
export class TerminalManager {
  private sessions = new Map<string, PtySession>()
  private window: BrowserWindow | null = null

  setWindow(win: BrowserWindow): void {
    this.window = win
  }

  spawn(sessionId: string, shellType: ShellType, cwd?: string): void {
    // 已存在则复用（不重新 spawn），保证同会话多窗口共享同一 pty
    if (this.sessions.has(sessionId)) {
      return
    }
    const session = new PtySession({ sessionId, shellType, cwd })
    this.sessions.set(sessionId, session)

    session.on('data', (data: string) => {
      this.send('terminal:data', { sessionId, data })
    })
    session.on('exit', (exitCode: number) => {
      this.send('terminal:exit', { sessionId, exitCode })
      this.sessions.delete(sessionId)
    })
    session.start()
  }

  write(sessionId: string, data: string): void {
    this.sessions.get(sessionId)?.write(data)
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.sessions.get(sessionId)?.resize(cols, rows)
  }

  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.kill()
      this.sessions.delete(sessionId)
    }
  }

  killAll(): void {
    for (const session of this.sessions.values()) {
      session.kill()
    }
    this.sessions.clear()
  }

  private send(channel: string, payload: unknown): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, payload)
    }
  }
}
