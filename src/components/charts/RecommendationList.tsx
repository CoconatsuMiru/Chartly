import type { ChartRecommendation, ColumnMeta } from '@/domain'
import { Switch } from '../ui/Switch'
import { ChartCard } from './ChartCard'

interface Props {
  items: ChartRecommendation[]
  columns: ColumnMeta[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function RecommendationList({ items, columns, selectedIds, onToggle }: Props) {
  if (items.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="h-card">No chart suggestions yet</p>
        <p className="mt-1 text-sm text-muted">This file has no combination of columns that charts well.</p>
      </div>
    )
  }

  return (
    <ul className="panel divide-y divide-line overflow-hidden">
      {items.map((r) => {
        const on = selectedIds.includes(r.id)
        return (
          <li key={r.id} id={`chart-${r.id}`} className="scroll-mt-6">
            <ChartCard
              spec={r.spec}
              columns={columns}
              selected={on}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
                  <p className="min-w-0 flex-1 basis-60 text-xs leading-relaxed text-muted">
                    {r.reason} <span className="whitespace-nowrap tabular-nums">({Math.round(r.score * 100)}% match)</span>
                  </p>
                  <Switch label="Include in report" checked={on} onChange={() => onToggle(r.id)} />
                </div>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}