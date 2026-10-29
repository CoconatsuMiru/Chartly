import type { ChartRecommendation, ChartType } from '@/domain'

const TYPE_LABEL: Record<ChartType, string> = {
  bar: 'Bar',
  barHorizontal: 'Bar',
  stackedBar: 'Stacked bar',
  line: 'Line',
  area: 'Area',
  scatter: 'Scatter',
  donut: 'Donut',
  histogram: 'Histogram',
  kpi: 'KPI',
  table: 'Table',
}

export function RecommendationList({ items }: { items: ChartRecommendation[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No chart suggestions for this file yet.</p>
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((r) => (
        <li key={r.id} className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="rounded bg-accent-soft px-1.5 py-0.5 font-medium text-accent">
              {TYPE_LABEL[r.spec.type]}
            </span>
            <span className="font-mono text-muted">{Math.round(r.score * 100)}% match</span>
          </div>
          <h4 className="mt-2 font-serif text-lg">{r.spec.title}</h4>
          {r.spec.subtitle && <p className="text-xs text-muted">{r.spec.subtitle}</p>}
          <p className="mt-1 text-sm">{r.reason}</p>
        </li>
      ))}
    </ul>
  )
}