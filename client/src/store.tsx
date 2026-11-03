import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from './lib/api'
import type { Task, TaskInput } from './lib/types'

interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

interface TasksState {
  tasks: Task[]
  loading: boolean
  loadError: string | null
  reload: () => Promise<void>
  create: (input: TaskInput) => Promise<Task>
  update: (id: string, input: TaskInput) => Promise<Task>
  toggle: (task: Task) => Promise<void>
  remove: (task: Task) => Promise<void>
  loadSample: () => Promise<void>
  toasts: Toast[]
  notify: (message: string, kind?: Toast['kind']) => void
}

const TasksContext = createContext<TasksState | null>(null)

const EMPTIED_KEY = 'todo.emptied'
const sortByStart = (list: Task[]) => [...list].sort((a, b) => a.startAt.localeCompare(b.startAt))
const message = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong')

/** Holds the visitor's tasks in memory; every change goes to the API first and then updates the list. */
export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, message: msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 5000 : 3000)
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      let list = await api.list()
      // Start with example tasks instead of a blank screen, unless the visitor deleted everything themselves.
      if (list.length === 0 && !localStorage.getItem(EMPTIED_KEY)) {
        list = sortByStart(await api.sample())
      }
      setTasks(list)
    } catch (err) {
      setLoadError(message(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const replace = (task: Task) => setTasks((list) => sortByStart(list.map((t) => (t.id === task.id ? task : t))))

  const value = useMemo<TasksState>(
    () => ({
      tasks,
      loading,
      loadError,
      reload,
      toasts,
      notify,
      async create(input) {
        const task = await api.create(input)
        setTasks((list) => sortByStart([...list, task]))
        notify('Task created')
        return task
      },
      async update(id, input) {
        const task = await api.update(id, input)
        replace(task)
        notify('Task updated')
        return task
      },
      async toggle(task) {
        const status = task.status === 'completed' ? 'in-progress' : 'completed'
        // Optimistic: tick the box at once, roll back if the API refuses.
        replace({ ...task, status })
        try {
          replace(await api.update(task.id, { status }))
        } catch (err) {
          replace(task)
          notify(message(err), 'error')
        }
      },
      async remove(task) {
        setTasks((list) => list.filter((t) => t.id !== task.id))
        try {
          await api.remove(task.id)
          if (tasks.length === 1) localStorage.setItem(EMPTIED_KEY, '1')
          notify(`“${task.title}” deleted`)
        } catch (err) {
          setTasks((list) => sortByStart([...list, task]))
          notify(message(err), 'error')
        }
      },
      async loadSample() {
        try {
          localStorage.removeItem(EMPTIED_KEY)
          const added = await api.sample()
          setTasks((list) => sortByStart([...list, ...added]))
          notify(`Added ${added.length} sample tasks`)
        } catch (err) {
          notify(message(err), 'error')
        }
      },
    }),
    [tasks, loading, loadError, reload, toasts, notify],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks(): TasksState {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used inside <TasksProvider>')
  return ctx
}
