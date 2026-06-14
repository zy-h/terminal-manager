import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Session, ShellType } from '../../shared/types'

/**
 * 会话定义持久化：读写 userData/sessions.json。
 * 只持久化会话定义（名称/shell/目录），不持久化运行状态——
 * 重启后恢复会话列表，但不会自动启动 pty，用户手动放入分屏才 spawn。
 */
function storePath(): string {
  return join(app.getPath('userData'), 'sessions.json')
}

function loadFromDisk(): Session[] {
  try {
    const p = storePath()
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf-8'))
      if (Array.isArray(data)) return data as Session[]
    }
  } catch {
    /* 损坏的 JSON 忽略，返回空列表 */
  }
  return []
}

function saveToDisk(list: Session[]): void {
  try {
    writeFileSync(storePath(), JSON.stringify(list, null, 2), 'utf-8')
  } catch {
    /* 写入失败忽略 */
  }
}

let sessions: Session[] = []

/** 应用 ready 后调用，从磁盘恢复会话列表 */
export function initStore(): void {
  sessions = loadFromDisk()
}

export function listSessions(): Session[] {
  return sessions
}

export function createSession(name: string, shellType: ShellType, cwd: string): Session {
  const session: Session = {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    shellType,
    cwd,
    createdAt: Date.now()
  }
  sessions.push(session)
  saveToDisk(sessions)
  return session
}

export function renameSession(id: string, name: string): void {
  const s = sessions.find((x) => x.id === id)
  if (s) {
    s.name = name
    saveToDisk(sessions)
  }
}

export function deleteSession(id: string): void {
  sessions = sessions.filter((x) => x.id !== id)
  saveToDisk(sessions)
}
