import { useSessionStore } from '@/state/sessionStore'

export function LoadProgress() {
  const status = useSessionStore((s) => s.status)
  const progress = useSessionStore((s) => s.progress)
  const file = useSessionStore((s) => s.file)
  const cancel = useSessionStore((s) => s.cancelLoad)

  if (status !== 'loading') return null

  return (
    <div role="status" className="space-y-2 rounded-lg bg-paper px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          {progress?.stage ?? 'Starting'}…{' '}
          <span className="text-muted">{file?.name}</span>
        </p>
        <button type="button" onClick={cancel} className="rounded-lg border border-line px-3 py-1 text-sm hover:bg-surface">
          Cancel
        </button>
      </div>
      <progress
        className="h-2 w-full overflow-hidden rounded accent-[var(--color-primary)]"
        max={1}
        value={progress?.fraction}
        aria-label="Loading progress"
      />
    </div>
  )
}