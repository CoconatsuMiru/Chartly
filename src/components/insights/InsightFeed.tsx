import type { Insight, InsightKind } from '@/domain'

const KIND_LABEL: Record<InsightKind, string> = {
  trend: 'Trend',
  change: 'Change',
  correlation: 'Correlation',
  outlier: 'Outliers',
  concentration: 'Concentration',
  distribution: 'Distribution',
  'data-quality': 'Data quality',
  extreme: 'Extreme',
  seasonality: 'Seasonality',
}

export function InsightFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-muted">No notable findings for this file yet.</p>
  }

  return (
    <ul className="space-y-3">
      {insights.map((i) => (
        <li key={i.id} className="rounded-lg border border-line p-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-primary-soft px-1.5 py-0.5 font-medium text-primary">
              {KIND_LABEL[i.kind]}
            </span>
            <span className="text-muted">{i.confidence} confidence</span>
          </div>
          <h4 className="mt-2 font-serif text-lg">{i.title}</h4>
          <p className="mt-1 text-sm">{i.narrative}</p>
          <details className="mt-2 text-xs text-muted">
            <summary className="cursor-pointer select-none">Why this?</summary>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono">
              {i.evidence.map((e) => (
                <div key={e.label} className="contents">
                  <dt>{e.label}</dt>
                  <dd className="text-ink">{e.value}</dd>
                </div>
              ))}
              <div className="contents">
                <dt>Rule</dt>
                <dd className="text-ink">{i.ruleId}</dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ul>
  )
}