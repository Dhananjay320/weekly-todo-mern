import { useState } from 'react'
import { ApiError } from '../lib/api'
import { addDays, combine, toDateInput, toTimeInput } from '../lib/dates'
import { PRIORITY_LABEL, type Priority, type Task } from '../lib/types'
import { useTasks } from '../store'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

interface TaskFormProps {
  /** Editing this task; otherwise a new one on `defaultDate`. */
  task?: Task
  defaultDate: Date
  onClose: () => void
}

function nextHalfHour(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  return toTimeInput(d)
}

const field = 'h-12 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand'
const label = 'mb-1.5 block text-xs text-muted'

export function TaskForm({ task, defaultDate, onClose }: TaskFormProps) {
  const { create, update } = useTasks()
  const start = task ? new Date(task.startAt) : null
  const [title, setTitle] = useState(task?.title ?? '')
  const [date, setDate] = useState(toDateInput(start ?? defaultDate))
  const [startTime, setStartTime] = useState(start ? toTimeInput(start) : nextHalfHour())
  const [endTime, setEndTime] = useState(task?.endAt ? toTimeInput(new Date(task.endAt)) : '')
  const [priority, setPriority] = useState<Priority | null>(task?.priority ?? null)
  const [description, setDescription] = useState(task?.description ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Give the task a title'
    if (!date) errs.date = 'Pick a date'
    if (!startTime) errs.startAt = 'Pick a start time'
    const startAt = date && startTime ? combine(date, startTime) : null
    let endAt = date && endTime ? combine(date, endTime) : null
    // An end time earlier than the start means the task runs past midnight.
    if (startAt && endAt && endAt < startAt) endAt = addDays(endAt, 1)
    setErrors(errs)
    if (Object.keys(errs).length || !startAt) return

    const input = { title: title.trim(), description: description.trim(), startAt: startAt.toISOString(), endAt: endAt?.toISOString() ?? null, priority }
    setSaving(true)
    try {
      if (task) await update(task.id, input)
      else await create(input)
      onClose()
    } catch (err) {
      setErrors(err instanceof ApiError && Object.keys(err.fields).length ? err.fields : { form: err instanceof Error ? err.message : 'Could not save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet title={task ? 'Edit Task' : 'Add New Task'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="task-title" className={label}>Task title</label>
          <input id="task-title" data-autofocus className={field} value={title} maxLength={120} placeholder="Doing Homework"
            onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-err' : undefined} />
          {errors.title && <p id="title-err" className="mt-1 text-xs text-pending">{errors.title}</p>}
        </div>

        <fieldset>
          <legend className={label}>Set Time</legend>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative block">
              <span className="sr-only">Start time</span>
              <Icon name="clock" size={18} className="pointer-events-none absolute z-10 top-1/2 left-3 -translate-y-1/2 text-ink" />
              <input type="time" required className={`${field} pl-10`} value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-invalid={!!errors.startAt} />
            </label>
            <label className="relative block">
              <span className="sr-only">End time (optional)</span>
              <Icon name="clock" size={18} className="pointer-events-none absolute z-10 top-1/2 left-3 -translate-y-1/2 text-ink" />
              <input type="time" className={`${field} pl-10`} value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-invalid={!!errors.endAt} />
            </label>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-4 text-[11px] text-muted"><span>Start</span><span>Ends (optional)</span></div>
          {(errors.startAt || errors.endAt) && <p className="mt-1 text-xs text-pending">{errors.startAt || errors.endAt}</p>}
        </fieldset>

        <div>
          <label htmlFor="task-date" className={label}>Set Date</label>
          <input id="task-date" type="date" required className={field} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
          {errors.date && <p className="mt-1 text-xs text-pending">{errors.date}</p>}
        </div>

        <fieldset>
          <legend className={label}>Priority <span className="text-slate-400">(optional)</span></legend>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button key={p} type="button" aria-pressed={priority === p} onClick={() => setPriority(priority === p ? null : p)}
                className={`h-10 rounded-lg border text-sm font-medium transition-colors ${priority === p ? 'border-brand bg-brand text-white' : 'border-line text-ink hover:border-brand/50'}`}>
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="task-desc" className={label}>Description</label>
          <textarea id="task-desc" rows={3} maxLength={1000} placeholder="Add Description" value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-lg border border-line px-3.5 py-3 text-sm placeholder:text-slate-400 focus:border-brand" />
        </div>

        {errors.form && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-pending">{errors.form}</p>}

        <button type="submit" disabled={saving}
          className="h-12 w-full rounded-lg bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </Sheet>
  )
}
