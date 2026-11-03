import { formatLongDay, formatTime } from '../lib/dates'
import { PRIORITY_LABEL, type Task } from '../lib/types'
import { useTasks } from '../store'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onEdit: (task: Task) => void
}

/** Read-only view of a task, with status toggle, edit and delete. */
export function TaskDetail({ task, onClose, onEdit }: TaskDetailProps) {
  const { tasks, toggle, remove } = useTasks()
  // Show the live copy, so toggling the status updates this sheet too.
  const current = tasks.find((t) => t.id === task.id) ?? task
  const start = new Date(current.startAt)
  const done = current.status === 'completed'

  return (
    <Sheet title="Task details" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${done ? 'bg-done-bg text-brand' : 'bg-pending-bg text-pending'}`}>
            <Icon name={done ? 'check' : 'clock'} size={14} stroke={2.2} />
            {done ? 'Completed' : 'In progress'}
          </span>
          <h3 className={`mt-3 text-xl font-semibold ${done ? 'text-muted line-through' : ''}`}>{current.title}</h3>
        </div>

        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 text-sm">
          <dt className="text-muted"><Icon name="calendar" size={18} /><span className="sr-only">Date</span></dt>
          <dd>{formatLongDay(start)}</dd>
          <dt className="text-muted"><Icon name="clock" size={18} /><span className="sr-only">Time</span></dt>
          <dd>{formatTime(start)}{current.endAt && ` – ${formatTime(new Date(current.endAt))}`}</dd>
          <dt className="text-muted"><Icon name="flag" size={18} /><span className="sr-only">Priority</span></dt>
          <dd>{current.priority ? PRIORITY_LABEL[current.priority] : 'No priority'}</dd>
        </dl>

        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
          {current.description || <span className="text-muted">No description</span>}
        </p>

        <button type="button" onClick={() => toggle(current)}
          className={`h-12 w-full rounded-lg text-sm font-medium text-white transition-colors ${done ? 'bg-navy hover:bg-navy/90' : 'bg-brand hover:bg-brand-dark'}`}>
          {done ? 'Mark as in progress' : 'Mark as completed'}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onEdit(current)}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium hover:bg-slate-50">
            <Icon name="edit" size={18} />Edit
          </button>
          <button type="button" onClick={() => { remove(current); onClose() }}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-medium text-pending hover:bg-red-50">
            <Icon name="trash" size={18} />Delete
          </button>
        </div>
      </div>
    </Sheet>
  )
}
