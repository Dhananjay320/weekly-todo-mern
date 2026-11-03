import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Task } from '../lib/types'
import { useTasks } from '../store'
import { Icon } from '../components/Icon'
import { TaskRow } from '../components/TaskRow'

interface SearchProps {
  onBack: () => void
  onView: (t: Task) => void
  onEdit: (t: Task) => void
}

/** Keyword search over title and description, done by the API. */
export function Search({ onBack, onView, onEdit }: SearchProps) {
  const { tasks } = useTasks()
  const [query, setQuery] = useState('')
  const [ids, setIds] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const q = query.trim()

  useEffect(() => {
    if (!q) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        const found = await api.list(q)
        if (!cancelled) {
          setIds(found.map((t) => t.id))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Search failed')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q])

  // Render from the shared list, so edits, ticks and deletes show here immediately.
  const results = q && ids ? ids.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t) : []

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-white px-5 pt-5 pb-10 md:max-w-2xl">
      <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-slate-100">
        <Icon name="back" />
      </button>
      <h1 className="sr-only">Search tasks</h1>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-4">
        <label htmlFor="search" className="sr-only">Search tasks by title or description</label>
        <input id="search" type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a task"
          className="h-12 w-full rounded-lg border border-line pr-11 pl-4 text-sm placeholder:text-slate-400 focus:border-brand" />
        <Icon name="search" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink" />
      </form>

      <div className="mt-4" aria-live="polite">
        {!q ? (
          <p className="py-10 text-center text-sm text-muted">Type a word from a task&apos;s title or description.</p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-pending" role="alert">{error}</p>
        ) : busy && !ids ? (
          <p className="py-10 text-center text-sm text-muted">Searching…</p>
        ) : results.length ? (
          <>
            <p className="text-xs text-muted">{results.length} result{results.length === 1 ? '' : 's'}</p>
            <ul className="mt-1">{results.map((t) => <TaskRow key={t.id} task={t} onView={onView} onEdit={onEdit} showDate />)}</ul>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No tasks match “{q}”.</p>
        )}
      </div>
    </main>
  )
}
