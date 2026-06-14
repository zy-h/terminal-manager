# Terminal Manager

**English** | [中文](./README.md)

A Windows desktop terminal manager: session pool on the left + multi-pane split groups on the right, supporting real shells (PowerShell / CMD / WSL / Git Bash). Built with Electron + node-pty + xterm.js.

## 📦 Download & Install

👉 [**Download the latest release**](https://github.com/zy-h/terminal-manager/releases/latest)

Grab `TerminalManager Setup 1.0.0.exe` from the Release page and run the installer.

- Requirements: Windows 10 1809+ (ConPTY support)
- Launch "TerminalManager" from the Start menu or desktop shortcut after install

## ✨ Features

- **Split layout**: session pool on the left + split area on the right, default 2:8 ratio, draggable (10%~40%)
- **1~8 panes**: multiple layout presets per pane count (2×2 / 1+3 / horizontal / vertical, etc.), switchable
- **Groups**: multiple groups coexist, renameable, switchable, deletable; the same session can be **duplicated across panes with live sync** (pty reused per session)
- **Multiple shells**: Windows PowerShell / CMD / WSL(Ubuntu) / Git Bash, auto-detected at startup (PowerShell 7 appears automatically if installed)
- **Session management**: clear all sessions on full exit, keep on tray minimize; configurable default working directory (persisted)
- **System tray**: close button minimizes to tray; right-click the tray to fully quit
- **Copy/paste**: Ctrl+Shift+C / Ctrl+Shift+V
- **Pick working directory** when creating a session; auto-naming from folder or shell when left blank

## 🛠 Tech Stack

- Electron + React + TypeScript
- electron-vite (build) + electron-builder (package)
- node-pty (pseudo terminal, Windows ConPTY) + @xterm/xterm (terminal rendering)
- zustand (state management)

## 💻 Development

```bash
npm install
npm run dev
```

## 📦 Build

```bash
npm run package
```

Output: `dist/TerminalManager Setup 1.0.0.exe`

## 🔧 About node-pty compilation

node-pty has three compilation hurdles on Windows:

1. **winpty bat calls**: Win11's cmd no longer searches the current directory for executables; `.\` prefix required
2. **Spectre mitigation libs**: binding.gyp / winpty.gyp force them; patched off
3. **ConPTY agent AttachConsole**: forking the sub-agent fails under Electron; patched with try-catch

All fixed via [patch-package](https://github.com/ds300/patch-package): `patches/node-pty+1.1.0.patch`. `npm install` applies the patch and rebuilds automatically.

> Packaging note: electron-builder's winCodeSign extraction creates macOS symlinks that need privileges on Windows; this project sets `win.signAndEditExecutable: false` in `electron-builder.yml` to bypass (unsigned + default icon). Enable Windows "Developer Mode" to restore custom icon / signing.

## 📁 Project Structure

```
src/
├── main/            # Main process (node-pty, IPC, tray, session/settings persistence)
├── preload/         # Preload (contextBridge secure bridge)
├── renderer/        # Renderer (React UI)
└── shared/          # Cross-process shared types
```
