import { useEffect, useRef, type ReactNode } from 'react'
import { STAGES } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

export function AppShell({ children }: { children: ReactNode }) {
  const stage = useSessionStore((s) => s.stage)
  const result = useSessionStore((s) => s.result)
  const setStage = useSessionStore((s) => s.setStage)
  const reset = useSessionStore((s) => s.reset)
  const mainRef = useRef<HTMLElement>(null)

  const currentIndex = STAGES.findIndex((s) => s.id === stage)
  const notes = result?.source.parseWarnings.length ?? 0

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [stage])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <a href="#main" className="btn btn-primary btn-sm sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50">
        Skip to content
      </a>

      <aside className="bg-night-grad shrink-0 text-white lg:flex lg:w-[284px] lg:flex-col lg:overflow-y-auto">
        <div className="flex items-center gap-3 px-5 pt-5 lg:px-6 lg:pt-8">
          <Logo size={38} />
          <div>
            <h1 className="font-serif text-[1.6rem] leading-none tracking-tight">Chartly</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-night-muted">
              Auto-Report Studio
            </p>
          </div>
        </div>

        <nav aria-label="Workflow stages" className="px-3 py-4 lg:mt-8 lg:px-4">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
            {STAGES.map((s, i) => {
              const locked = s.id !== 'import' && !result
              const current = stage === s.id
              const done = !!result && i < currentIndex
              return (
                <li
                  key={s.id}
                  className="relative shrink-0 lg:pb-1 lg:after:absolute lg:after:bottom-0 lg:after:left-[1.85rem] lg:after:top-[3.15rem] lg:after:w-px lg:after:bg-white/12 lg:last:after:hidden"
                >
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setStage(s.id)}
                    aria-current={current ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      current
                        ? 'bg-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
                        : 'enabled:hover:bg-white/6'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ring-1 transition-colors ${
                        current
                          ? 'bg-brand-glow text-night ring-transparent'
                          : done
                            ? 'bg-mint/15 text-mint ring-mint/40'
                            : 'text-night-muted ring-white/20'
                      }`}
                    >
                      {done ? <Icon name="check" size={16} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="hidden text-xs text-night-muted lg:block">{s.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="hidden space-y-4 px-4 pb-6 lg:mt-auto lg:block">
          {result && (
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-mint">
                  <Icon name="sheet" size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={result.source.fileName}>
                    {result.source.fileName}
                  </p>
                  <p className="text-xs text-night-muted">
                    {result.rowCount.toLocaleString('en-US')} rows · {result.columns.length} columns
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-night-muted">
                <span className={`size-1.5 rounded-full ${notes === 0 ? 'bg-mint' : 'bg-accent'}`} />
                {notes === 0 ? 'No data notes' : `${notes} data note(s)`}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-3 text-xs font-semibold text-mint underline underline-offset-4 hover:text-white"
              >
                Clear data
              </button>
            </div>
          )}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-night-muted">
            <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-mint" />
            Your file stays in this browser tab. Nothing is uploaded.
          </p>
        </div>
      </aside>

      <main id="main" ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div key={stage} className="rise mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}