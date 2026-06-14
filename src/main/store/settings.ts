import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Settings, Lang } from '../../shared/types'

/** 应用设置持久化：读写 userData/settings.json */
function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let settings: Settings = {
  defaultCwd: '',
  language: 'zh',
  terminalBgColor: '#1e1e1e',
  terminalFontSize: 14,
  minimizeHintShown: false,
  minimizeShortcut: 'Ctrl+Shift+M',
  maximizeShortcut: 'Ctrl+Shift+F'
}

/** 应用 ready 后调用，从磁盘恢复设置 */
export function initSettings(): void {
  try {
    const p = settingsPath()
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf-8'))
      settings = {
        defaultCwd: typeof data.defaultCwd === 'string' ? data.defaultCwd : '',
        language: data.language === 'en' ? 'en' : 'zh',
        terminalBgColor:
          typeof data.terminalBgColor === 'string' ? data.terminalBgColor : '#1e1e1e',
        terminalFontSize: clampFontSize(data.terminalFontSize),
        minimizeHintShown: data.minimizeHintShown === true,
        minimizeShortcut:
          typeof data.minimizeShortcut === 'string' ? data.minimizeShortcut : 'Ctrl+Shift+M',
        maximizeShortcut:
          typeof data.maximizeShortcut === 'string' ? data.maximizeShortcut : 'Ctrl+Shift+F'
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

export function setTerminalBgColor(color: string): void {
  settings = { ...settings, terminalBgColor: color }
  save()
}

/** 终端字体大小合法范围 */
export const FONT_MIN = 8
export const FONT_MAX = 40
export const FONT_DEFAULT = 14

/** 将任意值收敛到合法字体大小范围（非法值回退默认） */
export function clampFontSize(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return FONT_DEFAULT
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)))
}

export function setTerminalFontSize(size: number): void {
  settings = { ...settings, terminalFontSize: clampFontSize(size) }
  save()
}

export function setMinimizeHintShown(shown: boolean): void {
  settings = { ...settings, minimizeHintShown: shown }
  save()
}

export function setMinimizeShortcut(shortcut: string): void {
  settings = { ...settings, minimizeShortcut: shortcut }
  save()
}

export function setMaximizeShortcut(shortcut: string): void {
  settings = { ...settings, maximizeShortcut: shortcut }
  save()
}
