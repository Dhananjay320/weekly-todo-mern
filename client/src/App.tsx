import { useState } from 'react'
import type { Task } from './lib/types'
import { TasksProvider, useTasks } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Search } from './screens/Search'
import { TaskForm } from './components/TaskForm'
import { TaskDetail } from './components/TaskDetail'
import { Icon } from './components/Icon'

type Screen = 'onboarding' | 'home' | 'search'
type Overlay = { kind: 'form'; task?: Task; date: Date } | { kind: 'detail'; task: Task } | null

const SEEN_KEY = 'todo.onboarded'

function Toasts() {
  const { toasts } = useTasks()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}
          className={`animate-fade flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${t.kind === 'error' ? 'bg-pending text-white' : 'bg-ink text-white'}`}>
          <Icon name={t.kind === 'error' ? 'x' : 'check'} size={16} stroke={2.4} />
          {t.message}
        </div>
      ))}
    </div>
  )
}

function Shell() {
  const [screen, setScreen] = useState<Screen>(() => (localStorage.getItem(SEEN_KEY) ? 'home' : 'onboarding'))
  const [overlay, setOverlay] = useState<Overlay>(null)
  const view = (task: Task) => setOverlay({ kind: 'detail', task })
  const edit = (task: Task) => setOverlay({ kind: 'form', task, date: new Date(task.startAt) })
  const close = () => setOverlay(null)

  return (
    <>
      {screen === 'onboarding' && <Onboarding onStart={() => { localStorage.setItem(SEEN_KEY, '1'); setScreen('home') }} />}
      {screen === 'home' && <Home onSearch={() => setScreen('search')} onAdd={(date) => setOverlay({ kind: 'form', date })} onView={view} onEdit={edit} />}
      {screen === 'search' && <Search onBack={() => setScreen('home')} onView={view} onEdit={edit} />}

      {overlay?.kind === 'form' && <TaskForm task={overlay.task} defaultDate={overlay.date} onClose={close} />}
      {overlay?.kind === 'detail' && <TaskDetail task={overlay.task} onClose={close} onEdit={edit} />}
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <TasksProvider>
      <Shell />
    </TasksProvider>
  )
}
