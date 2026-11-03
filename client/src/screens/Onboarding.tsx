function Zigzag({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 70" className={className} fill="none" stroke="currentColor" strokeWidth="5">
      {[10, 30, 50].map((y) => (
        <path key={y} d={`M0 ${y + 10} L15 ${y} L30 ${y + 10} L45 ${y} L60 ${y + 10} L75 ${y} L90 ${y + 10} L105 ${y} L120 ${y + 10}`} />
      ))}
    </svg>
  )
}

// A small "task list" card so the blue panel isn't empty.
function Illustration() {
  const rows = [
    { done: true, w: 'w-28' },
    { done: true, w: 'w-20' },
    { done: false, w: 'w-24' },
  ]
  return (
    <div aria-hidden="true" className="relative w-64 rotate-[-4deg] rounded-2xl bg-white p-5 shadow-2xl shadow-navy/30">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-2.5 w-20 rounded-full bg-navy/80" />
        <div className="text-[11px] font-semibold text-brand">67%</div>
      </div>
      <div className="mb-5 h-2 rounded-full bg-track"><div className="h-2 w-2/3 rounded-full bg-navy" /></div>
      <ul className="space-y-3.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`grid size-5 place-items-center rounded-md border-2 ${r.done ? 'border-brand bg-brand' : 'border-brand/50'}`}>
              {r.done && (
                <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2.5 6.2 5 8.5l4.5-5" /></svg>
              )}
            </span>
            <span className="flex-1 space-y-1.5">
              <span className={`block h-2 rounded-full ${r.w} ${r.done ? 'bg-muted/30' : 'bg-ink/70'}`} />
              <span className="block h-1.5 w-14 rounded-full bg-muted/20" />
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute -right-5 -bottom-5 grid size-12 place-items-center rounded-full bg-navy text-2xl font-light text-white shadow-lg">+</div>
    </div>
  )
}

export function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white sm:shadow-xl">
      <div className="relative grid flex-1 place-items-center overflow-hidden bg-brand" style={{ minHeight: '58dvh' }}>
        <Illustration />
        <div aria-hidden="true" className="absolute -top-10 -right-10 size-28 rounded-full border-[14px] border-white/15" />
        <Zigzag className="absolute top-16 left-6 w-28 text-white/25" />
        <Zigzag className="absolute right-6 bottom-10 w-28 text-white/25" />
      </div>
      <div className="flex flex-col px-6 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-semibold">Manage What To Do</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button type="button" onClick={onStart}
          className="mt-12 h-12 w-full rounded-lg bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-dark">
          Get Started
        </button>
      </div>
    </main>
  )
}
