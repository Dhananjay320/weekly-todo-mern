import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icon'

interface SheetProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

/** Bottom sheet on phones, centred dialog on wider screens. Escape or a tap outside closes it. */
export function Sheet({ title, onClose, children }: SheetProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  // Callers pass a new onClose each render; read the latest one without re-running the mount effect.
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    // One query per selector: a selector list would return the first match in document order (the close button).
    const target = ['[data-autofocus]', 'input', 'button'].map((s) => panel.current?.querySelector<HTMLElement>(s)).find(Boolean)
    target?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="animate-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-10 place-items-center rounded-full text-ink hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
