import { useMemo, useState } from 'react'
import { addDays, dayKey, formatLongDay, formatWeekRange, formatWeekday, sameDay, startOfWeek, weekKey } from '../lib/dates'
import type { Task } from '../lib/types'
import { useTasks } from '../store'
import { Icon } from '../components/Icon'
import { TaskRow } from '../components/TaskRow'
import { WeekCard } from '../components/WeekCard'

interface HomeProps {
  onSearch: () => void
  onAdd: (date: Date) => void
  onView: (t: Task) => void
  onEdit: (t: Task) => void
}

export function Home({ onSearch, onAdd, onView, onEdit }: HomeProps) {
  const { tasks, loading, loadError, reload, loadSample } = useTasks()
  const today = new Date()
  const [selected, setSelected] = useState(today)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([weekKey(today)]))

  const monday = startOfWeek(selected)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  // Group every task into its Monday–Sunday week.
  const weeks = useMemo(() => {
    const map = new Map<string, { monday: Date; tasks: Task[] }>()
    for (const t of tasks) {
      const m = startOfWeek(new Date(t.startAt))
      const key = dayKey(m)
      if (!map.has(key)) map.set(key, { monday: m, tasks: [] })
      map.get(key)!.tasks.push(t)
    }
    return [...map.values()].sort((a, b) => a.monday.getTime() - b.monday.getTime())
  }, [tasks])

  const thisWeek = weeks.find((w) => sameDay(w.monday, monday))?.tasks ?? []
  const completed = thisWeek.filter((t) => t.status === 'completed').length
  const pending = thisWeek.length - completed
  const pct = thisWeek.length ? Math.round((completed / thisWeek.length) * 100) : 0
  const dayTasks = thisWeek.filter((t) => sameDay(new Date(t.startAt), selected))
  const daysWithTasks = new Set(thisWeek.map((t) => dayKey(new Date(t.startAt))))
  const isToday = sameDay(selected, today)

  function toggleWeek(key: string) {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-white pb-28 md:max-w-5xl md:px-6">
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
        {/* Left column: search, week strip, this week's numbers, the selected day's tasks */}
        <div className="px-5 pt-6 md:px-0">
          <h1 className="sr-only">My tasks</h1>
          <button type="button" onClick={onSearch}
            className="flex h-12 w-full items-center justify-between rounded-lg border border-line px-4 text-left text-sm text-slate-400 hover:border-brand/40">
            Search for a task
            <Icon name="search" className="text-ink" />
          </button>

          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={() => setSelected(addDays(selected, -7))} aria-label="Previous week"
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-slate-100">
              <Icon name="chevronLeft" size={18} />
            </button>
            <p className="text-sm font-medium">{formatWeekRange(monday)}</p>
            <button type="button" onClick={() => setSelected(addDays(selected, 7))} aria-label="Next week"
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-slate-100">
              <Icon name="chevronRight" size={18} />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Days of the week">
            {days.map((d) => {
              const active = sameDay(d, selected)
              return (
                <button key={dayKey(d)} type="button" onClick={() => setSelected(d)} aria-pressed={active}
                  aria-label={`${formatLongDay(d)}${daysWithTasks.has(dayKey(d)) ? ', has tasks' : ''}`}
                  className={`flex flex-col items-center rounded-lg py-2 transition-colors ${active ? 'bg-brand text-white' : 'text-muted hover:bg-slate-100'}`}>
                  <span className="text-[11px]">{formatWeekday(d)}</span>
                  <span className={`mt-0.5 text-sm ${active ? 'font-semibold' : ''} ${sameDay(d, today) && !active ? 'font-semibold text-brand' : ''}`}>
                    {String(d.getDate()).padStart(2, '0')}
                  </span>
                  <span className={`mt-1 size-1 rounded-full ${daysWithTasks.has(dayKey(d)) ? (active ? 'bg-white' : 'bg-brand') : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-done-bg p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-md border-2 border-brand bg-white/60 text-brand"><Icon name="check" size={14} stroke={3} /></span>
                <span className="text-xs">Task Complete</span>
              </div>
              <p className="mt-2 pl-1 text-2xl font-semibold">{String(completed).padStart(2, '0')} <span className="text-[11px] font-normal text-muted">This Week</span></p>
            </div>
            <div className="rounded-lg bg-pending-bg p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-md border-2 border-pending bg-white/60 text-pending"><Icon name="x" size={14} stroke={3} /></span>
                <span className="text-xs">Task Pending</span>
              </div>
              <p className="mt-2 pl-1 text-2xl font-semibold">{String(pending).padStart(2, '0')} <span className="text-[11px] font-normal text-muted">This Week</span></p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">Weekly Progress</h2>
              <span className="text-xs text-muted">{pct}%</span>
            </div>
            <div className="mt-3 h-4 overflow-hidden bg-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tasks completed this week">
              <div className="h-full bg-navy transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">{isToday ? 'Tasks Today' : `Tasks · ${formatLongDay(selected)}`}</h2>
              <a href="#weeks" className="text-xs font-medium text-brand hover:underline">View All</a>
            </div>
            {loading ? (
              <div className="mt-3 space-y-3" aria-busy="true" aria-label="Loading tasks">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
              </div>
            ) : loadError ? (
              <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-pending" role="alert">
                {loadError} <button type="button" onClick={reload} className="ml-1 font-semibold underline">Retry</button>
              </div>
            ) : dayTasks.length ? (
              <ul className="mt-1">{dayTasks.map((t) => <TaskRow key={t.id} task={t} onView={onView} onEdit={onEdit} />)}</ul>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-line px-4 py-6 text-center">
                <p className="text-sm text-muted">Nothing planned for this day.</p>
                <button type="button" onClick={() => onAdd(selected)} className="mt-2 text-sm font-medium text-brand hover:underline">Add a task</button>
              </div>
            )}
          </div>
        </div>

        {/* Right column (below on phones): one summary card per week */}
        <section id="weeks" className="mt-9 scroll-mt-4 px-5 md:mt-6 md:px-0" aria-labelledby="weeks-title">
          <h2 id="weeks-title" className="text-base font-semibold">All Weeks</h2>
          <p className="mt-0.5 text-xs text-muted">Monday to Sunday. Tap a week to see its tasks.</p>
          {!loading && !loadError && weeks.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
              <p className="text-sm font-medium">No tasks yet</p>
              <p className="mt-1 text-xs text-muted">Add your first task, or load a few examples to look around.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button type="button" onClick={() => onAdd(selected)} className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark">Add task</button>
                <button type="button" onClick={loadSample} className="h-10 rounded-lg border border-line px-4 text-sm font-medium hover:bg-slate-50">Load sample tasks</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {weeks.map((w) => {
                const key = dayKey(w.monday)
                return (
                  <WeekCard key={key} monday={w.monday} tasks={w.tasks} expanded={expanded.has(key)}
                    onToggle={() => toggleWeek(key)} onView={onView} onEdit={onEdit} />
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Fade content out under the floating button so it never sits on top of task text. */}
      <div aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto h-28 max-w-md bg-gradient-to-t from-white from-45% to-transparent md:max-w-5xl xl:hidden" />
      {/* Phone/tablet: centred as in the Figma. Wide screens: beside the content, outside the card columns. */}
      <button type="button" onClick={() => onAdd(selected)} aria-label="Add task"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 grid size-14 -translate-x-1/2 xl:left-auto xl:right-[calc(50%-32rem-5rem)] xl:translate-x-0 xl:bottom-10 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition-colors hover:bg-brand-dark">
        <Icon name="plus" size={26} stroke={2.2} />
      </button>
    </main>
  )
}
