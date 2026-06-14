import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import type { ShellInfo } from '../../shared/types'

/** 用 where 命令查找可执行文件在 PATH 中的完整路径 */
function whereExe(name: string): string | null {
  try {
    const r = spawnSync('where', [name], { encoding: 'utf-8', windowsHide: true })
    if (r.status === 0 && r.stdout) {
      const line = r.stdout.split(/\r?\n/)[0]
      return line ? line.trim() : null
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * 探测系统当前可用的 shell。
 * 启动时调用，渲染进程据此动态生成会话池「shell 类型」下拉选项，
 * 将来安装 pwsh 等无需改代码即可自动出现。
 */
export function detectShells(): ShellInfo[] {
  const psPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
  const cmdPath = 'C:\\Windows\\System32\\cmd.exe'

  const pwshPath = whereExe('pwsh.exe')
  const wslPath = whereExe('wsl.exe')
  const bashPath = whereExe('bash.exe')

  return [
    { type: 'powershell', label: 'Windows PowerShell', path: psPath, available: existsSync(psPath) },
    { type: 'cmd', label: '命令提示符 (CMD)', path: cmdPath, available: existsSync(cmdPath) },
    { type: 'pwsh', label: 'PowerShell 7', path: pwshPath ?? '', available: !!pwshPath },
    { type: 'wsl', label: 'WSL (Ubuntu)', path: wslPath ?? '', available: !!wslPath },
    { type: 'gitbash', label: 'Git Bash', path: bashPath ?? '', available: !!bashPath }
  ]
}
