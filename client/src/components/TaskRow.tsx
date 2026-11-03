import { useRef, useState } from 'react'
import { formatShort, formatTime } from '../lib/dates'
import { PRIORITY_LABEL, type Task } from '../lib/types'
import { useTasks } from '../store'
import { Icon } from './Icon'

const REVEAL = 88 // width of the Delete button revealed by swiping left

const PRIORITY_STYLE = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-800',
  low: 'bg-emerald-50 text-emerald-700',
} as const

interface TaskRowProps {
  task: Task
  onView: (task: Task) => void
  onEdit: (task: Task) => void
  showDate?: boolean
}

/** One task: checkbox, title, time. Swipe left (or tap the bin) to reveal Delete. */
export function TaskRow({ task, onView, onEdit, showDate }: TaskRowProps) {
  const { toggle, remove } = useTasks()
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; base: number; horizontal: boolean | null } | null>(null)
  const done = task.status === 'completed'
  const open = offset <= -REVEAL / 2
  const startAt = new Date(task.startAt)

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') return
    start.current = { x: e.clientX, y: e.clientY, base: offset, horizontal: null }
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    // Decide once per gesture whether this is a horizontal swipe or a vertical scroll.
    if (s.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) s.horizontal = Math.abs(dx) > Math.abs(dy)
    if (!s.horizontal) return
    setDragging(true)
    setOffset(Math.max(-REVEAL - 24, Math.min(0, s.base + dx)))
  }
  function onPointerUp() {
    if (start.current?.horizontal) setOffset((o) => (o <= -REVEAL / 2 ? -REVEAL : 0))
    start.current = null
    setDragging(false)
  }

  return (
    <li className="relative overflow-hidden border-b border-line last:border-b-0">
      <button type="button" onClick={() => remove(task)} tabIndex={open ? 0 : -1} aria-hidden={!open}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-pending text-sm font-semibold text-white"
        style={{ width: REVEAL }}>
        Delete
      </button>

      <div
        className="relative flex touch-pan-y items-center gap-3 bg-white py-3.5"
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform .2s ease' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        <button type="button" role="checkbox" aria-checked={done} onClick={() => toggle(task)}
          aria-label={done ? `Mark “${task.title}” as in progress` : `Mark “${task.title}” as completed`}
          className="-m-2 grid size-10 shrink-0 place-items-center rounded-lg">
          <span className={`grid size-5 place-items-center rounded-[5px] border-[1.5px] transition-colors ${done ? 'border-brand bg-brand text-white' : 'border-brand bg-white'}`}>
            {done && <Icon name="check" size={14} stroke={3} />}
          </span>
        </button>

        <button type="button" onClick={() => (open ? setOffset(0) : onView(task))} className="min-w-0 flex-1 text-left">
          <span className={`block truncate text-sm font-medium ${done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>{showDate && `${formatShort(startAt)}, `}{formatTime(startAt)}{task.endAt && ` – ${formatTime(new Date(task.endAt))}`}</span>
            {task.priority && (
              <span className={`rounded-full px-2 py-px text-[11px] font-medium ${PRIORITY_STYLE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => setOffset(open ? 0 : -REVEAL)} aria-label={`Delete “${task.title}”`}
            className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-pending">
            <Icon name="trash" size={19} />
          </button>
          <button type="button" onClick={() => onEdit(task)} aria-label={`Edit “${task.title}”`}
            className="-mr-2 grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand">
            <Icon name="edit" size={19} />
          </button>
        </div>
      </div>
    </li>
  )
}
