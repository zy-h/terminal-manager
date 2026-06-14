import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Settings, Lang } from '../../shared/types'

/** 应用设置持久化：读写 userData/settings.json（默认目录、界面语言） */
function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let settings: Settings = { defaultCwd: '', language: 'zh' }

/** 应用 ready 后调用，从磁盘恢复设置 */
export function initSettings(): void {
  try {
    const p = settingsPath()
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf-8'))
      settings = {
        defaultCwd: typeof data.defaultCwd === 'string' ? data.defaultCwd : '',
        language: data.language === 'en' ? 'en' : 'zh'
      }
    }
  } catch {
    /* 损坏的 JSON 忽略 */
  }
}

export function getSettings(): Settings {
  return settings
}

function save(): void {
  try {
    writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    /* 写入失败忽略 */
  }
}

export function setDefaultCwd(cwd: string): void {
  settings = { ...settings, defaultCwd: cwd }
  save()
}

export function setLanguage(lang: Lang): void {
  settings = { ...settings, language: lang }
  save()
}
