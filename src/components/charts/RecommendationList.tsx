import type { ChartRecommendation, ColumnMeta } from '@/domain'
import { ChartCard } from './ChartCard'

interface Props {
  items: ChartRecommendation[]
  columns: ColumnMeta[]
}

export function RecommendationList({ items, columns }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No chart suggestions for this file yet.</p>
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {items.map((r) => (
        <li key={r.id}>
          <ChartCard
            spec={r.spec}
            columns={columns}
            footer={
              <p className="text-xs text-muted">
                {r.reason} <span className="font-mono">({Math.round(r.score * 100)}% match)</span>
              </p>
            }
          />
        </li>
      ))}
    </ul>
  )
}