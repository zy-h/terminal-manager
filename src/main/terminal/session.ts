import * as pty from 'node-pty'
import { EventEmitter } from 'events'
import type { ShellType } from '../../shared/types'

export interface PtySpawnOptions {
  sessionId: string
  shellType: ShellType
  cwd?: string
  cols?: number
  rows?: number
}

/** 根据 shell 类型解析可执行文件与启动参数 */
function resolveCommand(shellType: ShellType): { file: string; args: string[] } {
  switch (shellType) {
    case 'powershell':
      return { file: 'powershell.exe', args: ['-NoLogo'] }
    case 'cmd':
      return { file: 'cmd.exe', args: [] }
    case 'pwsh':
      return { file: 'pwsh.exe', args: ['-NoLogo'] }
    case 'wsl':
      return { file: 'wsl.exe', args: [] }
    case 'gitbash':
      return { file: 'bash.exe', args: ['--login', '-i'] }
    default:
      return { file: 'powershell.exe', args: ['-NoLogo'] }
  }
}

/** 单个伪终端会话的封装：spawn、读写、resize、kill */
export class PtySession extends EventEmitter {
  readonly sessionId: string
  private ptyProcess: pty.IPty | null = null
  private exited = false

  constructor(private opts: PtySpawnOptions) {
    super()
    this.sessionId = opts.sessionId
  }

  start(): void {
    const { file, args } = resolveCommand(this.opts.shellType)
    this.ptyProcess = pty.spawn(file, args, {
      name: 'xterm-256color',
      cols: this.opts.cols ?? 80,
      rows: this.opts.rows ?? 24,
      cwd: this.opts.cwd ?? process.env.USERPROFILE,
      env: process.env as Record<string, string>
    })

    this.ptyProcess.onData((data) => {
      this.emit('data', data)
    })

    this.ptyProcess.onExit(({ exitCode }) => {
      this.exited = true
      this.emit('exit', exitCode)
    })
  }

  write(data: string): void {
    if (!this.exited) this.ptyProcess?.write(data)
  }

  resize(cols: number, rows: number): void {
    if (!this.exited) this.ptyProcess?.resize(cols, rows)
  }

  kill(): void {
    if (this.ptyProcess && !this.exited) {
      try {
        this.ptyProcess.kill()
      } catch {
        /* 进程可能已退出，忽略 */
      }
    }
    this.ptyProcess = null
  }
}
