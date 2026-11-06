import { useSessionStore } from '@/state/sessionStore'

export function LoadProgress() {
  const status = useSessionStore((s) => s.status)
  const progress = useSessionStore((s) => s.progress)
  const file = useSessionStore((s) => s.file)
  const cancel = useSessionStore((s) => s.cancelLoad)

  if (status !== 'loading') return null

  return (
    <div role="status" className="card space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm">
          <span className="font-semibold">{progress?.stage ?? 'Starting'}…</span>{' '}
          <span className="truncate font-mono text-xs text-muted">{file?.name}</span>
        </p>
        <button type="button" onClick={cancel} className="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
      <progress className="block w-full" max={1} value={progress?.fraction} aria-label="Loading progress" />
    </div>
  )
}