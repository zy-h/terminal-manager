import { ipcMain, dialog } from 'electron'
import { TerminalManager } from '../terminal/manager'
import { detectShells } from '../terminal/shells'
import {
  listSessions,
  createSession,
  renameSession,
  deleteSession
} from '../store/sessions'
import { getSettings, setDefaultCwd } from '../store/settings'
import type { ShellType } from '../../shared/types'

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
    manager.write(args.sessionId, args.data)
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
}
