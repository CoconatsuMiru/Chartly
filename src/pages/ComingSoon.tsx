import type { Stage } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'

const COPY: Partial<Record<Stage, { title: string; text: string }>> = {
  compose: {
    title: 'Compose',
    text: 'The report workspace is next: edit text, reorder sections, pick a theme and layout, and preview the pages.',
  },
  export: {
    title: 'Export',
    text: 'The export room comes after that: PDF and PowerPoint, with a preflight check before you download.',
  },
}

export default function ComingSoon({ stage }: { stage: Stage }) {
  const selected = useSessionStore((s) => s.selectedChartIds)
  const setStage = useSessionStore((s) => s.setStage)
  const copy = COPY[stage]

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-8">
      <h2 className="font-serif text-3xl">{copy?.title}</h2>
      <p className="mt-2 text-muted">{copy?.text}</p>
      <p className="mt-4 text-sm">
        Your {selected.length} selected chart{selected.length === 1 ? ' is' : 's are'} saved and waiting.
      </p>
      <button
        type="button"
        onClick={() => setStage('explore')}
        className="mt-4 rounded-lg border border-line px-4 py-2 text-sm hover:bg-paper"
      >
        Back to Explore
      </button>
    </div>
  )
}