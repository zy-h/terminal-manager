import type { Lang } from '@shared/types'

const zh: Record<string, string> = {
  'app.title': '终端管理器',
  'session.pool': '会话池',
  'session.new': '新建会话',
  'session.empty.title': '还没有会话',
  'session.empty.hint': '点击右上角 + 新建终端会话',
  'session.tip': '点击会话 → 单一显示 · 切换分组用顶部下拉',
  'session.rename': '重命名',
  'session.delete': '删除',
  'session.delete.title': '删除会话',
  'session.delete.msg': '确定删除会话「{name}」吗？该操作不可撤销。',
  'group.pane': '屏',
  'group.defaultName': '分组 {n}',
  'group.single': '单一会话',
  'group.rename.hint': '点击重命名分组',
  'group.delete': '删除该分组',
  'group.delete.title': '删除分组',
  'group.delete.msg': '确定删除分组「{name}」吗？分组配置将被移除（会话本身保留）。',
  'group.layout.switch': '切换排版方式',
  'group.layout.prefix': '排版',
  'group.switch.placeholder': '切换分组…',
  'group.switch.title': '切换分组',
  'pane.notSelected': '（未选择）',
  'pane.select.hint': '在上方下拉选择会话',
  'pane.select.title': '选择该窗口显示的会话（可重复=复制显示）',
  'pane.empty.single': '点击左侧会话开始',
  'pane.empty.unselected': '未选择会话',
  'layout.count': '{n} 个终端',
  'dialog.new.title': '新建终端会话',
  'dialog.new.name': '名称',
  'dialog.new.name.ph': '留空自动命名（如 {shell}）',
  'dialog.new.shell': 'Shell 类型',
  'dialog.new.cwd': '起始目录（可选）',
  'dialog.new.cwd.default': '起始目录（默认：{cwd}）',
  'dialog.new.cwd.ph': '留空则用用户目录',
  'dialog.new.browse': '浏览…',
  'dialog.new.setDefault': '设为默认',
  'dialog.new.saved': '已保存',
  'dialog.cancel': '取消',
  'dialog.create': '创建并打开',
  'common.delete': '删除',
  'lang.toggle': 'EN',
  'terminal.bgColor': '终端背景色',
  'terminal.customColor': '自定义颜色',
  'terminal.font.bigger': '放大字体',
  'terminal.font.smaller': '缩小字体',
  'terminal.font.reset': '重置字体大小',
  'terminal.font.size': '字号 {n}'
}

const en: Record<string, string> = {
  'app.title': 'Terminal Manager',
  'session.pool': 'Sessions',
  'session.new': 'New Session',
  'session.empty.title': 'No sessions yet',
  'session.empty.hint': 'Click + at top right to create a terminal session',
  'session.tip': 'Click a session → single view · switch group via the top dropdown',
  'session.rename': 'Rename',
  'session.delete': 'Delete',
  'session.delete.title': 'Delete Session',
  'session.delete.msg': 'Delete session "{name}"? This cannot be undone.',
  'group.pane': 'pane',
  'group.defaultName': 'Group {n}',
  'group.single': 'Single Session',
  'group.rename.hint': 'Click to rename group',
  'group.delete': 'Delete group',
  'group.delete.title': 'Delete Group',
  'group.delete.msg': 'Delete group "{name}"? The group config will be removed (sessions are kept).',
  'group.layout.switch': 'Switch layout',
  'group.layout.prefix': 'Layout',
  'group.switch.placeholder': 'Switch group…',
  'group.switch.title': 'Switch group',
  'pane.notSelected': '(none)',
  'pane.select.hint': 'Pick a session from the dropdown above',
  'pane.select.title': 'Choose the session for this pane (duplicates = mirror)',
  'pane.empty.single': 'Click a session on the left to start',
  'pane.empty.unselected': 'No session selected',
  'layout.count': '{n} panes',
  'dialog.new.title': 'New Terminal Session',
  'dialog.new.name': 'Name',
  'dialog.new.name.ph': 'Auto-named if empty (e.g. {shell})',
  'dialog.new.shell': 'Shell type',
  'dialog.new.cwd': 'Working directory (optional)',
  'dialog.new.cwd.default': 'Working directory (default: {cwd})',
  'dialog.new.cwd.ph': 'User directory if empty',
  'dialog.new.browse': 'Browse…',
  'dialog.new.setDefault': 'Set default',
  'dialog.new.saved': 'Saved',
  'dialog.cancel': 'Cancel',
  'dialog.create': 'Create & open',
  'common.delete': 'Delete',
  'lang.toggle': '中',
  'terminal.bgColor': 'Terminal background',
  'terminal.customColor': 'Custom color',
  'terminal.font.bigger': 'Increase font size',
  'terminal.font.smaller': 'Decrease font size',
  'terminal.font.reset': 'Reset font size',
  'terminal.font.size': 'Size {n}'
}

const dicts: Record<Lang, Record<string, string>> = { zh, en }

/** 按当前语言翻译 key，支持 {var} 占位符 */
export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  let s = dicts[lang][key] ?? dicts.zh[key] ?? key
  if (vars) {
    for (const k in vars) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]))
    }
  }
  return s
}
