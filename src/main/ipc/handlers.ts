import { ipcMain, dialog, BrowserWindow } from 'electron'
import { TerminalManager } from '../terminal/manager'
import { detectShells } from '../terminal/shells'
import {
  listSessions,
  createSession,
  renameSession,
  deleteSession
} from '../store/sessions'
import {
  getSettings,
  setDefaultCwd,
  setLanguage,
  setTerminalBgColor,
  setTerminalFontSize,
  setMinimizeShortcut,
  setMaximizeShortcut
} from '../store/settings'
import type { ShellType, Lang } from '../../shared/types'

/** 注册终端、Shell 探测、会话管理、系统对话框相关的 IPC 通道 */
export function registerIpc(manager: TerminalManager): void {
  // ===== 终端进程控制 =====
  ipcMain.handle(
    'terminal:spawn',
    (_e, args: { sessionId: string; shellType: ShellType; cwd?: string }) => {
      manager.spawn(args.sessionId, args.shellType, args.cwd)
      return { ok: true }
    }
  )
  ipcMain.on('terminal:input', (_e, args: { sessionId: string; data: string }) => {
    // 剥离 Ctrl+C(ETX,\x03)：语音输入法等可能绕过前端 DOM 拦截模拟 Ctrl+C，
    // 裸 \x03 会作为 SIGINT 中断终端里的程序（如 Claude Code）。真正中断走 interrupt 通道直写 pty。
    const safe = args.data.replace(/\x03/g, '')
    if (safe) manager.write(args.sessionId, safe)
  })
  ipcMain.on('terminal:interrupt', (_e, args: { sessionId: string }) => {
    manager.write(args.sessionId, '\x03')
  })
  ipcMain.on('terminal:resize', (_e, args: { sessionId: string; cols: number; rows: number }) => {
    manager.resize(args.sessionId, args.cols, args.rows)
  })
  ipcMain.on('terminal:kill', (_e, args: { sessionId: string }) => {
    manager.kill(args.sessionId)
  })

  // ===== Shell 探测 =====
  ipcMain.handle('shell:detect', () => detectShells())

  // ===== 会话管理 CRUD =====
  ipcMain.handle('session:list', () => listSessions())
  ipcMain.handle(
    'session:create',
    (_e, args: { name: string; shellType: ShellType; cwd: string }) =>
      createSession(args.name, args.shellType, args.cwd)
  )
  ipcMain.handle('session:rename', (_e, args: { id: string; name: string }) => {
    renameSession(args.id, args.name)
    return { ok: true }
  })
  ipcMain.handle('session:delete', (_e, args: { id: string }) => {
    deleteSession(args.id)
    return { ok: true }
  })

  // ===== 系统对话框：选择目录（创建终端时用） =====
  ipcMain.handle('dialog:chooseDirectory', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择终端起始目录',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // ===== 应用设置 =====
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:setDefaultCwd', (_e, args: { cwd: string }) => {
    setDefaultCwd(args.cwd)
    return { ok: true }
  })
  ipcMain.handle('settings:setLanguage', (_e, args: { lang: Lang }) => {
    setLanguage(args.lang)
    return { ok: true }
  })
  ipcMain.handle('settings:setTerminalBgColor', (_e, args: { color: string }) => {
    setTerminalBgColor(args.color)
    return { ok: true }
  })
  ipcMain.handle('settings:setTerminalFontSize', (_e, args: { size: number }) => {
    setTerminalFontSize(args.size)
    return { ok: true }
  })
  ipcMain.handle('settings:setMinimizeShortcut', (_e, args: { shortcut: string }) => {
    setMinimizeShortcut(args.shortcut)
    return { ok: true }
  })
  ipcMain.handle('settings:setMaximizeShortcut', (_e, args: { shortcut: string }) => {
    setMaximizeShortcut(args.shortcut)
    return { ok: true }
  })

  // ===== 窗口控制（应用内快捷键驱动；聚焦窗口即主窗口） =====
  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
}
