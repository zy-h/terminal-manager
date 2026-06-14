import { app, BrowserWindow, shell, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { TerminalManager } from './terminal/manager'
import { registerIpc } from './ipc/handlers'
import { initStore, clearSessions } from './store/sessions'
import { initSettings, getSettings, setMinimizeHintShown } from './store/settings'

// 捕获主进程未处理异常，输出到日志便于诊断（避免静默崩溃导致 exit 1）
process.on('uncaughtException', (err) => {
  console.error('[main uncaughtException]', err)
})
process.on('unhandledRejection', (err) => {
  console.error('[main unhandledRejection]', err)
})

const terminalManager = new TerminalManager()
let tray: Tray | null = null
// 是否正在彻底退出（仅托盘右键「彻底退出」会置 true，使窗口 close 不再拦截）
let isQuitting = false

function createTray(win: BrowserWindow): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'tray.png')
    : join(__dirname, '../../resources/tray.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('终端管理器')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        win.show()
        win.focus()
      }
    },
    { type: 'separator' },
    {
      label: '彻底退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win.show()
    win.focus()
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e1e',
    title: '终端管理器',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  terminalManager.setWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 关闭按钮（X）→ 最小化到托盘；彻底退出只能通过托盘右键菜单。
  // 首次点关闭时弹提示说明（仅一次）
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      if (!getSettings().minimizeHintShown) {
        const isEn = getSettings().language === 'en'
        dialog
          .showMessageBox(mainWindow, {
            type: 'info',
            message: isEn ? 'Minimized to tray' : '已最小化到系统托盘',
            detail: isEn
              ? 'Closing the window only minimizes it to the system tray; the app keeps running. To fully quit, right-click the tray icon and choose "Quit".'
              : '点击关闭按钮只会最小化到系统托盘，程序仍在后台运行。如需彻底退出，请在状态栏的图标上右键选择"彻底退出"。',
            buttons: ['OK']
          })
          .then(() => {
            setMinimizeHintShown(true)
            mainWindow.hide()
          })
      } else {
        mainWindow.hide()
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // 移除 Electron 默认应用菜单：默认菜单的 accelerator 在 Windows + 中文输入法(IME)
  // 环境下会拦截 ' 和 " 等字符，导致它们无法输入到 xterm 终端。终端类应用不需要这些菜单。
  Menu.setApplicationMenu(null)

  initSettings()
  initStore()
  registerIpc(terminalManager)
  createWindow()
  const win = BrowserWindow.getAllWindows()[0]
  if (win) createTray(win)

  app.on('activate', () => {
    const all = BrowserWindow.getAllWindows()
    if (all.length === 0) {
      createWindow()
    } else {
      all[0].show()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  clearSessions() // 彻底退出时清空所有会话，重新打开为空列表
  terminalManager.killAll()
})

// 托盘模式下窗口仅 hide 不 close，不会触发 window-all-closed；
// 彻底退出由托盘菜单驱动，这里不再主动 quit。
app.on('window-all-closed', () => {
  // no-op（保留生命周期钩子）
})
