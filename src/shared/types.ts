// 跨进程共享类型与 IPC 通道名常量

/** 支持的 shell 类型 */
export type ShellType = 'powershell' | 'cmd' | 'wsl' | 'gitbash' | 'pwsh'

/** shell 类型 → 默认显示名 */
export const SHELL_LABELS: Record<ShellType, string> = {
  powershell: 'Windows PowerShell',
  cmd: '命令提示符 (CMD)',
  wsl: 'WSL (Ubuntu)',
  gitbash: 'Git Bash',
  pwsh: 'PowerShell 7'
}

/** 探测到的某个 shell 信息 */
export interface ShellInfo {
  type: ShellType
  label: string
  path: string
  available: boolean
}

/** 会话定义（持久化） */
export interface Session {
  id: string
  name: string
  shellType: ShellType
  cwd: string
  createdAt: number
}

/** 会话运行状态：idle=在池中未启动，active=已放入分屏运行中 */
export type SessionStatus = 'idle' | 'active'

/** 分屏布局模式：1~8 个终端 */
export type LayoutMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** 界面语言 */
export type Lang = 'zh' | 'en'

/** 应用设置 */
export interface Settings {
  defaultCwd: string
  language: Lang
}

/** 通过 contextBridge 暴露给渲染进程的终端 API 形状 */
export interface TerminalApi {
  terminal: {
    spawn: (sessionId: string, shellType: ShellType, cwd?: string) => Promise<{ ok: boolean }>
    input: (sessionId: string, data: string) => void
    resize: (sessionId: string, cols: number, rows: number) => void
    kill: (sessionId: string) => void
    onData: (cb: (payload: { sessionId: string; data: string }) => void) => () => void
    onExit: (cb: (payload: { sessionId: string; exitCode: number }) => void) => () => void
  }
  shell: {
    detect: () => Promise<ShellInfo[]>
  }
  session: {
    list: () => Promise<Session[]>
    create: (name: string, shellType: ShellType, cwd: string) => Promise<Session>
    rename: (id: string, name: string) => Promise<{ ok: boolean }>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  dialog: {
    chooseDirectory: () => Promise<string | null>
  }
  settings: {
    get: () => Promise<Settings>
    setDefaultCwd: (cwd: string) => Promise<void>
    setLanguage: (lang: Lang) => Promise<void>
  }
}

declare global {
  interface Window {
    api: TerminalApi
  }
}
