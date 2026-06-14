# 终端管理器 (Terminal Manager)

一个 Windows 桌面终端管理器：左侧会话池 + 右侧多分屏分组，支持真实终端（PowerShell / CMD / WSL / Git Bash）。基于 Electron + node-pty + xterm.js。

## 功能特性

- **左右布局**：左侧会话池 + 右侧分屏区，默认 2:8 可拖拽调整（10%~40%）
- **1~8 屏分屏**：每个窗口数预制多种排版（2×2 / 1+3 / 横排 / 竖排 等），可切换
- **分组管理**：多分组共存、命名、切换、删除；同会话可在多个窗口**复制显示并实时同步**（pty 按会话复用）
- **多 Shell**：Windows PowerShell / CMD / WSL(Ubuntu) / Git Bash，启动时自动探测可用项（装了 PowerShell 7 也会自动出现）
- **会话持久化**：会话列表、默认起始目录均持久化，重启自动恢复
- **系统托盘**：关闭窗口最小化到托盘，右键菜单彻底退出
- **复制粘贴**：Ctrl+Shift+C / Ctrl+Shift+V
- **创建终端可选目录**，名称留空时按目录或 Shell 自动命名

## 技术栈

- Electron + React + TypeScript
- electron-vite（构建）+ electron-builder（打包）
- node-pty（伪终端，Windows ConPTY）+ @xterm/xterm（终端渲染）
- zustand（状态管理）

## 开发

```bash
npm install
npm run dev
```

## 打包

```bash
npm run package
```

产物：`dist/TerminalManager Setup 1.0.0.exe`

## 关于 node-pty 编译

node-pty 在 Windows 上有三处编译障碍：

1. **winpty 的 bat 调用**：Win11 的 cmd 不再从当前目录查找可执行文件，需 `.\` 前缀
2. **Spectre 缓解库**：binding.gyp / winpty.gyp 强制要求，已 patch 关闭
3. **ConPTY agent 的 AttachConsole**：Electron 下 fork 子 agent 会失败，已 patch 加 try-catch 容错

以上通过 [patch-package](https://github.com/ds300/patch-package) 固化为补丁：`patches/node-pty+1.1.0.patch`。`npm install` 会自动应用补丁并重编译（postinstall: patch-package && electron-rebuild）。

> 打包需注意：electron-builder 解压 winCodeSign 时创建 macOS 符号链接在 Windows 需权限，本项目的 `electron-builder.yml` 已设置 `win.signAndEditExecutable: false` 绕过（不签名 + 用默认图标）。如需自定义图标 / 签名，开启 Windows「开发者模式」后可恢复。

## 目录结构

```
src/
├── main/            # 主进程（node-pty、IPC、托盘、会话/设置持久化）
├── preload/         # 预加载（contextBridge 安全桥接）
├── renderer/        # 渲染进程（React UI）
└── shared/          # 跨进程共享类型
```
