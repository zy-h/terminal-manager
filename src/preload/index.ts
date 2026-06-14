import { contextBridge, ipcRenderer } from 'electron'
import type { TerminalApi } from '../shared/types'

const api: TerminalApi = {
  terminal: {
    spawn: (sessionId, shellType, cwd) =>
      ipcRenderer.invoke('terminal:spawn', { sessionId, shellType, cwd }),
    input: (sessionId, data) => ipcRenderer.send('terminal:input', { sessionId, data }),
    resize: (sessionId, cols, rows) =>
      ipcRenderer.send('terminal:resize', { sessionId, cols, rows }),
    kill: (sessionId) => ipcRenderer.send('terminal:kill', { sessionId }),
    onData: (cb) => {
      const handler = (
        _e: Electron.IpcRendererEvent,
        payload: { sessionId: string; data: string }
      ): void => cb(payload)
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.off('terminal:data', handler)
    },
    onExit: (cb) => {
      const handler = (
        _e: Electron.IpcRendererEvent,
        payload: { sessionId: string; exitCode: number }
      ): void => cb(payload)
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.off('terminal:exit', handler)
    }
  },
  shell: {
    detect: () => ipcRenderer.invoke('shell:detect')
  },
  session: {
    list: () => ipcRenderer.invoke('session:list'),
    create: (name, shellType, cwd) =>
      ipcRenderer.invoke('session:create', { name, shellType, cwd }),
    rename: (id, name) => ipcRenderer.invoke('session:rename', { id, name }),
    delete: (id) => ipcRenderer.invoke('session:delete', { id })
  },
  dialog: {
    chooseDirectory: () => ipcRenderer.invoke('dialog:chooseDirectory')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    setDefaultCwd: (cwd) => ipcRenderer.invoke('settings:setDefaultCwd', { cwd }),
    setLanguage: (lang) => ipcRenderer.invoke('settings:setLanguage', { lang })
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore render context
  window.api = api
}
