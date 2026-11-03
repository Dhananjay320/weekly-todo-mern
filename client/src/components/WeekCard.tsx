import { useId } from 'react'
import { addDays, dayKey, formatLongDay, formatWeekRange, weekLabel } from '../lib/dates'
import type { Task } from '../lib/types'
import { Icon } from './Icon'
import { TaskRow } from './TaskRow'

interface WeekCardProps {
  monday: Date
  tasks: Task[]
  expanded: boolean
  onToggle: () => void
  onView: (t: Task) => void
  onEdit: (t: Task) => void
}

/** Summary card for one Monday–Sunday week: open vs completed; expands to the week's tasks by day. */
export function WeekCard({ monday, tasks, expanded, onToggle, onView, onEdit }: WeekCardProps) {
  const panelId = useId()
  const completed = tasks.filter((t) => t.status === 'completed').length
  const open = tasks.length - completed
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const byDay = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = dayKey(new Date(t.startAt))
    byDay.set(key, [...(byDay.get(key) ?? []), t])
  }
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => byDay.has(dayKey(d)))

  return (
    <section className="rounded-2xl border border-line bg-white">
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}
        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-slate-50/70">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{weekLabel(monday)}</p>
          <p className="text-xs text-muted">{formatWeekRange(monday)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
            <div className="h-full rounded-full bg-navy transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2 text-center">
          <div className="w-16 rounded-xl bg-pending-bg px-2 py-2">
            <p className="text-lg leading-none font-semibold text-pending">{open}</p>
            <p className="mt-1 text-[11px] text-pending">Open</p>
          </div>
          <div className="w-16 rounded-xl bg-done-bg px-2 py-2">
            <p className="text-lg leading-none font-semibold text-brand">{completed}</p>
            <p className="mt-1 text-[11px] text-brand">Completed</p>
          </div>
        </div>
        <Icon name="chevronDown" size={18} className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-line px-4 pb-2">
          {days.map((d) => (
            <div key={dayKey(d)}>
              <h3 className="pt-4 text-xs font-semibold tracking-wide text-muted uppercase">{formatLongDay(d)}</h3>
              <ul>{byDay.get(dayKey(d))!.map((t) => <TaskRow key={t.id} task={t} onView={onView} onEdit={onEdit} />)}</ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
