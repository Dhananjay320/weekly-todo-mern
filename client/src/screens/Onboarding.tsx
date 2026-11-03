function Zigzag({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 70" className={className} fill="none" stroke="currentColor" strokeWidth="5">
      {[10, 30, 50].map((y) => (
        <path key={y} d={`M0 ${y + 10} L15 ${y} L30 ${y + 10} L45 ${y} L60 ${y + 10} L75 ${y} L90 ${y + 10} L105 ${y} L120 ${y + 10}`} />
      ))}
    </svg>
  )
}

export function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white sm:shadow-xl">
      <div className="relative flex-1 overflow-hidden bg-brand" style={{ minHeight: '58dvh' }}>
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
