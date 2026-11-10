import type { ChartRecommendation, ColumnMeta } from '@/domain'
import { stagger } from '@/utils/stagger'
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
      <div className="card p-10 text-center">
        <p className="font-serif text-xl">No chart suggestions yet</p>
        <p className="mt-1 text-sm text-muted">This file has no combination of columns that charts well.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-6">
      {items.map((r, i) => {
        const pct = Math.round(r.score * 100)
        const on = selectedIds.includes(r.id)
        return (
          <li key={r.id} id={`chart-${r.id}`} className="rise scroll-mt-6" style={stagger(i)}>
            <ChartCard
              spec={r.spec}
              columns={columns}
              selected={on}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="text-xs leading-relaxed text-muted">{r.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10">
                        <span className="bg-brand-bar block h-full rounded-full" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="font-mono">{pct}% match</span>
                    </div>
                  </div>
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