import type { ParseWarning } from '@/domain'
import { Icon } from '../ui/Icon'

interface Props {
  warnings: ParseWarning[]
  duplicateRows: number
}

export function DataHealth({ warnings, duplicateRows }: Props) {
  const notes = warnings.map((w) => w.message)
  if (duplicateRows > 0) {
    notes.push(`${duplicateRows.toLocaleString('en-US')} duplicate row(s) found. They may be counted twice in totals.`)
  }

  if (notes.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-2xl bg-primary-soft px-5 py-3.5 text-sm text-primary-strong">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Icon name="check" size={14} />
        </span>
        No data problems found. Every cell was read cleanly.
      </p>
    )
  }

  return (
    <section aria-label="Data health" className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4 text-sm">
      <h3 className="flex items-center gap-2 font-semibold text-accent-ink">
        <Icon name="info" size={16} />
        Data notes
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </section>
  )
}