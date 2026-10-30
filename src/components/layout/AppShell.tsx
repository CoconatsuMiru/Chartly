import type { ReactNode } from 'react'
import { STAGES } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'

export function AppShell({ children }: { children: ReactNode }) {
  const stage = useSessionStore((s) => s.stage)
  const result = useSessionStore((s) => s.result)
  const setStage = useSessionStore((s) => s.setStage)
  const reset = useSessionStore((s) => s.reset)

  return (
    <div className="flex h-full">
      <nav aria-label="Workflow stages" className="flex w-60 shrink-0 flex-col border-r border-line bg-surface p-4">
        <h1 className="mb-1 font-serif text-2xl text-primary">Chartly</h1>
        <p className="mb-6 text-xs text-muted">Auto-Report Studio</p>

        <ol className="flex flex-col gap-1">
          {STAGES.map((s, i) => {
            const disabled = s.id !== 'import' && !result
            const current = stage === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setStage(s.id)}
                  aria-current={current ? 'step' : undefined}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    current ? 'bg-primary-soft text-primary' : 'text-muted enabled:hover:bg-paper'
                  }`}
                >
                  <span className="font-mono text-xs">0{i + 1}</span>
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block text-xs">{s.hint}</span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto space-y-3 pt-6">
          {result ? (
            <div className="rounded-lg bg-paper p-3 text-xs">
              <p className="truncate font-medium text-ink" title={result.source.fileName}>
                {result.source.fileName}
              </p>
              <p className="mt-0.5 text-muted">
                {result.rowCount.toLocaleString('en-US')} rows · {result.columns.length} columns
              </p>
              <p className="text-muted">
                {result.source.parseWarnings.length === 0
                  ? 'No data notes'
                  : `${result.source.parseWarnings.length} data note(s)`}
              </p>
              <button type="button" onClick={reset} className="mt-2 text-primary underline underline-offset-2">
                Clear data
              </button>
            </div>
          ) : null}
          <p className="text-xs text-muted">Your file stays in this browser tab. Nothing is uploaded.</p>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1500px] p-8">{children}</div>
      </main>
    </div>
  )
}