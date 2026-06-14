import { useEffect } from 'react'
import SessionList from './components/SessionList'
import SplitView from './components/SplitView'
import SingleView from './components/SingleView'
import Splitter from './components/Splitter'
import GroupBar from './components/GroupBar'
import { useStore } from './store/useStore'
import { initTerminalBuffer } from './terminalBuffer'

export default function App() {
  const leftPct = useStore((s) => s.leftPct)
  const setLeftPct = useStore((s) => s.setLeftPct)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const sessions = useStore((s) => s.sessions)
  const load = useStore((s) => s.load)
  const setSlotSession = useStore((s) => s.setSlotSession)
  const clearSlot = useStore((s) => s.clearSlot)

  useEffect(() => {
    // 启动全局 pty 输出缓冲监听（用于会话切换时重放历史，单例，只启动一次）
    initTerminalBuffer()
    load()
  }, [load])

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null

  return (
    <div className="app-layout">
      <aside className="sidebar" style={{ width: `${leftPct}%` }}>
        <SessionList />
      </aside>
      <Splitter leftPct={leftPct} onResize={setLeftPct} />
      <main className="main-area">
        <GroupBar />
        {activeGroup ? (
          <SplitView
            group={activeGroup}
            sessions={sessions}
            onSelectSlotSession={setSlotSession}
            onClearSlot={clearSlot}
          />
        ) : (
          <SingleView />
        )}
      </main>
    </div>
  )
}
