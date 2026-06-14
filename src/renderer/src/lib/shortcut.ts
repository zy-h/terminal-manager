/**
 * 快捷键规范化与匹配工具。
 *
 * 统一用规范化字符串表示一个组合键，如 "Ctrl+Shift+M"、"Alt+F2"。
 * 渲染进程用 KeyboardEvent 生成、比较；持久化与显示均以此字符串为准。
 */

/** 单独按下这些键（仅修饰键）时不算一个完整快捷键 */
const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

/** 终端已占用的组合：设置窗口快捷键时给出警告（仍允许，但会和终端同时触发） */
export const TERMINAL_RESERVED = new Set(['Ctrl+Shift+C', 'Ctrl+Shift+V'])

/** 把键盘事件规范化为快捷键字符串；仅修饰键返回 ''（表示未完成） */
export function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.metaKey) parts.push('Meta')
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  // 只按修饰键，继续等待真正的按键
  if (MODIFIER_KEYS.has(e.key)) return ''

  let key = e.key
  if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()
  // 其余（Enter / Escape / ArrowUp / F1 ...）保持 e.key 原样
  parts.push(key)
  return parts.join('+')
}

/** 把 "Ctrl+Shift+M" 这种内部串显示得更友好（当前仅原样返回，便于统一） */
export function formatShortcut(s: string): string {
  return s || ''
}
