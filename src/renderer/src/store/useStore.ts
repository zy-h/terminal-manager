import { create } from 'zustand'
import type { Session, ShellInfo, ShellType, LayoutMode, Settings, Lang } from '@shared/types'
import { translate } from '../i18n'

/** 一个分屏分组：名称 + 窗口数 + 排版预设 + 每格会话（可重复=复制显示） */
export interface Group {
  id: string
  name: string
  layout: LayoutMode
  /** 排版预设索引（见 layoutPresets.ts） */
  presetIndex: number
  /** 长度恒等于 layout；元素为 sessionId 或 ''（空格）；允许重复 */
  slots: string[]
}

interface AppState {
  sessions: Session[]
  shells: ShellInfo[]
  settings: Settings
  /** 当前界面语言（独立存一份，便于 useT 订阅） */
  language: Lang

  groups: Group[]
  activeGroupId: string | null
  singleSessionId: string | null
  leftPct: number

  load: () => Promise<void>
  setLeftPct: (p: number) => void
  setDefaultCwd: (cwd: string) => Promise<void>
  setLanguage: (lang: Lang) => Promise<void>
  setTerminalBgColor: (color: string) => Promise<void>

  // 分组操作
  createGroupByLayout: (n: LayoutMode) => void
  switchGroup: (groupId: string) => void
  renameActiveGroup: (name: string) => void
  removeGroup: (groupId: string) => void
  setGroupPreset: (presetIndex: number) => void
  setSlotSession: (slotIndex: number, sessionId: string) => void
  clearSlot: (slotIndex: number) => void

  activateSession: (sessionId: string) => void

  addSession: (name: string, shellType: ShellType, cwd: string) => Promise<Session>
  renameSession: (id: string, name: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
}

let groupSeq = 0
function genGroupId(): string {
  groupSeq += 1
  return `g-${Date.now()}-${groupSeq}`
}

function padSlots(slots: string[], n: number): string[] {
  const next = slots.slice(0, n)
  while (next.length < n) next.push('')
  return next
}

export const useStore = create<AppState>((set, get) => ({
  sessions: [],
  shells: [],
  settings: { defaultCwd: '', language: 'zh', terminalBgColor: '#1e1e1e', minimizeHintShown: false },
  language: 'zh',
  groups: [],
  activeGroupId: null,
  singleSessionId: null,
  leftPct: 20,

  load: async () => {
    const [sessions, shells, settings] = await Promise.all([
      window.api.session.list(),
      window.api.shell.detect(),
      window.api.settings.get()
    ])
    set({
      sessions,
      shells: shells.filter((s) => s.available),
      settings,
      language: settings.language
    })
  },

  setLeftPct: (p) => set({ leftPct: p }),

  setDefaultCwd: async (cwd) => {
    await window.api.settings.setDefaultCwd(cwd)
    set({ settings: { ...get().settings, defaultCwd: cwd } })
  },

  setLanguage: async (lang) => {
    await window.api.settings.setLanguage(lang)
    set({ language: lang, settings: { ...get().settings, language: lang } })
  },

  setTerminalBgColor: async (color) => {
    await window.api.settings.setTerminalBgColor(color)
    set({ settings: { ...get().settings, terminalBgColor: color } })
  },

  createGroupByLayout: (n) => {
    const { groups, sessions, singleSessionId } = get()
    // 总是新建一个分组（切回旧分组用分组下拉）：
    // 填入「未分组的会话」，当前单一显示的会话优先放在第一格
    const used = new Set(groups.flatMap((g) => g.slots.filter(Boolean)))
    let pool = sessions.filter((s) => !used.has(s.id))
    if (singleSessionId) {
      pool = [
        ...pool.filter((s) => s.id === singleSessionId),
        ...pool.filter((s) => s.id !== singleSessionId)
      ]
    }
    const slots = padSlots(
      pool.slice(0, n).map((s) => s.id),
      n
    )
    const group: Group = {
      id: genGroupId(),
      name: translate(get().language, 'group.defaultName', { n: groups.length + 1 }),
      layout: n,
      presetIndex: 0,
      slots
    }
    set({ groups: [...groups, group], activeGroupId: group.id, singleSessionId: null })
  },

  switchGroup: (groupId) => set({ activeGroupId: groupId, singleSessionId: null }),

  renameActiveGroup: (name) => {
    const id = get().activeGroupId
    if (!id) return
    set({ groups: get().groups.map((g) => (g.id === id ? { ...g, name } : g)) })
  },

  removeGroup: (groupId) => {
    const { groups, activeGroupId, singleSessionId } = get()
    const next = groups.filter((g) => g.id !== groupId)
    const newActive = activeGroupId === groupId ? next[0]?.id ?? null : activeGroupId
    set({
      groups: next,
      activeGroupId: newActive,
      singleSessionId: newActive ? null : singleSessionId
    })
  },

  setGroupPreset: (presetIndex) => {
    const id = get().activeGroupId
    if (!id) return
    set({
      groups: get().groups.map((g) => (g.id === id ? { ...g, presetIndex } : g))
    })
  },

  setSlotSession: (slotIndex, sessionId) => {
    const id = get().activeGroupId
    if (!id) return
    set({
      groups: get().groups.map((g) => {
        if (g.id !== id) return g
        const slots = g.slots.slice()
        slots[slotIndex] = sessionId
        return { ...g, slots }
      })
    })
  },

  clearSlot: (slotIndex) => {
    const id = get().activeGroupId
    if (!id) return
    set({
      groups: get().groups.map((g) => {
        if (g.id !== id) return g
        const slots = g.slots.slice()
        slots[slotIndex] = ''
        return { ...g, slots }
      })
    })
  },

  activateSession: (sessionId) => {
    // 单击任意会话 → 总是单一窗口显示；切分组只能用分组下拉
    set({ activeGroupId: null, singleSessionId: sessionId })
  },

  addSession: async (name, shellType, cwd) => {
    const s = await window.api.session.create(name, shellType, cwd)
    set({ sessions: [...get().sessions, s] })
    return s
  },

  renameSession: async (id, name) => {
    await window.api.session.rename(id, name)
    set({ sessions: get().sessions.map((s) => (s.id === id ? { ...s, name } : s)) })
  },

  removeSession: async (id) => {
    const groups = get().groups.map((g) => ({
      ...g,
      slots: g.slots.map((sid) => (sid === id ? '' : sid))
    }))
    const singleId = get().singleSessionId === id ? null : get().singleSessionId
    await window.api.session.delete(id)
    window.api.terminal.kill(id)
    set({
      sessions: get().sessions.filter((s) => s.id !== id),
      groups,
      singleSessionId: singleId
    })
  }
}))

/** 翻译 hook：组件中 const t = useT() 后用 t('key', {var}) */
export function useT() {
  const lang = useStore((s) => s.language)
  return (key: string, vars?: Record<string, string | number>): string =>
    translate(lang, key, vars)
}
