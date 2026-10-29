import type { ChartRecommendation, ColumnMeta } from '@/domain'
import { ChartCard } from './ChartCard'

interface Props {
  items: ChartRecommendation[]
  columns: ColumnMeta[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function RecommendationList({ items, columns, selectedIds, onToggle }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No chart suggestions for this file yet.</p>
  }

  return (
    <ul className="grid gap-4 2xl:grid-cols-2">
      {items.map((r) => (
        <li key={r.id} id={`chart-${r.id}`} className="scroll-mt-4">
          <ChartCard
            spec={r.spec}
            columns={columns}
            footer={
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  {r.reason} <span className="font-mono">({Math.round(r.score * 100)}% match)</span>
                </p>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => onToggle(r.id)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  Include in report
                </label>
              </div>
            }
          />
        </li>
      ))}
    </ul>
  )
}