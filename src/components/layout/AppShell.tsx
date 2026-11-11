import { useEffect, useRef, type ReactNode } from 'react'
import { useSessionStore } from '@/state/sessionStore'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { Stepper } from './Stepper'

/** Each stage gets the width its content needs: reading, analysis, or an editor with side panels. */
const WIDTH = {
  import: 'max-w-[1200px]',
  explore: 'max-w-[1360px]',
  compose: 'max-w-[1440px]',
  export: 'max-w-[1440px]',
} as const

export function AppShell({ children }: { children: ReactNode }) {
  const stage = useSessionStore((s) => s.stage)
  const result = useSessionStore((s) => s.result)
  const reset = useSessionStore((s) => s.reset)
  const mainRef = useRef<HTMLElement>(null)

  const editor = stage === 'compose'

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
            <Logo size={34} />
            <div>
              <h1 className="font-serif text-[1.4rem] font-medium leading-none tracking-tight">Chartly</h1>
              <p className="mt-1 hidden text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted sm:block">
                Auto-Report Studio
              </p>
            </div>
          </div>

          <Stepper className="order-3 w-full min-[1320px]:order-2 min-[1320px]:w-auto min-[1320px]:flex-1" />

          {result && (
            <div className="order-2 ml-auto flex shrink-0 items-center gap-2 min-[1320px]:order-3">
              <span className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] md:flex">
                <Icon name="sheet" size={15} className="text-primary" />
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
          className={`rise mx-auto px-6 pb-10 sm:px-8 lg:px-10 ${editor ? 'pt-8' : 'pt-10 lg:pt-12'} ${WIDTH[stage]}`}
        >
          {children}
          <p className="mt-14 flex items-center justify-center gap-2 text-xs text-muted">
            <Icon name="lock" size={13} />
            Your file stays in this browser tab. Nothing is uploaded.
          </p>
        </div>
      </main>
    </div>
  )
}