import { useEffect, useRef, type ReactNode } from 'react'
import { useSessionStore } from '@/state/sessionStore'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { Stepper } from './Stepper'

export function AppShell({ children }: { children: ReactNode }) {
  const stage = useSessionStore((s) => s.stage)
  const result = useSessionStore((s) => s.result)
  const reset = useSessionStore((s) => s.reset)
  const mainRef = useRef<HTMLElement>(null)

  // Compose and Export need room for side panels around a page.
  const wide = stage === 'compose' || stage === 'export'

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [stage])

  return (
    <div className="flex h-full flex-col">
      <a
        href="#main"
        className="btn btn-primary btn-sm sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>

      <header className="relative z-20 shrink-0 border-b border-line bg-paper/90 backdrop-blur-md">
        <span aria-hidden="true" className="bg-brand-bar absolute inset-x-0 top-0 h-[3px]" />
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-10 gap-y-4 px-6 py-4 sm:px-8 min-[1320px]:flex-nowrap">
          <div className="flex shrink-0 items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="font-serif text-[1.45rem] leading-none tracking-tight">Chartly</h1>
              <p className="mt-1 hidden text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted sm:block">
                Auto-Report Studio
              </p>
            </div>
          </div>

          <Stepper className="order-3 w-full min-[1320px]:order-2 min-[1320px]:w-auto min-[1320px]:flex-1" />

          {result && (
            <div className="order-2 ml-auto flex shrink-0 items-center gap-2 min-[1320px]:order-3">
              <span className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm md:flex">
                <Icon name="sheet" size={16} className="text-primary" />
                <span className="max-w-[150px] truncate font-medium" title={result.source.fileName}>
                  {result.source.fileName}
                </span>
                <span className="text-xs text-muted">{result.rowCount.toLocaleString('en-US')} rows</span>
              </span>
              <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
                Clear data
              </button>
            </div>
          )}
        </div>
      </header>

      <main id="main" ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div
          key={stage}
          className={`rise mx-auto px-6 pb-10 pt-10 sm:px-8 lg:px-10 lg:pt-12 ${wide ? 'max-w-[1440px]' : 'max-w-[1200px]'}`}
        >
          {children}
          <p className="mt-16 flex items-center justify-center gap-2 text-xs text-muted">
            <Icon name="lock" size={13} />
            Your file stays in this browser tab. Nothing is uploaded.
          </p>
        </div>
      </main>
    </div>
  )
}