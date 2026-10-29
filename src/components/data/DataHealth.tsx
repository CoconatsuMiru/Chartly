import type { ParseWarning } from '@/domain'

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
      <p className="rounded-lg bg-primary-soft px-4 py-3 text-sm text-primary">
        No data problems found. Every cell was read cleanly.
      </p>
    )
  }

  return (
    <section aria-label="Data health" className="rounded-lg bg-accent-soft px-4 py-3 text-sm">
      <h3 className="font-medium">Data notes</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </section>
  )
}