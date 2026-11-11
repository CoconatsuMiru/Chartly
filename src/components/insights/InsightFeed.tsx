import type { Insight, InsightKind } from '@/domain'
import { Icon } from '../ui/Icon'

const KIND: Record<InsightKind, { label: string; fg: string; dot: string }> = {
  trend: { label: 'Trend', fg: '#084a4d', dot: '#1aa7a0' },
  change: { label: 'Change', fg: '#8a5a00', dot: '#e0951a' },
  correlation: { label: 'Correlation', fg: '#4f3568', dot: '#8a63b0' },
  outlier: { label: 'Outliers', fg: '#7d2a48', dot: '#c2557a' },
  concentration: { label: 'Concentration', fg: '#475216', dot: '#8a9a3c' },
  distribution: { label: 'Distribution', fg: '#3d4753', dot: '#8d97a3' },
  'data-quality': { label: 'Data quality', fg: '#3d4753', dot: '#8d97a3' },
  extreme: { label: 'Extreme', fg: '#8a5a00', dot: '#e0951a' },
  seasonality: { label: 'Seasonality', fg: '#084a4d', dot: '#1aa7a0' },
}

interface Props {
  insights: Insight[]
  /** Ids of charts that exist, so a finding can offer a "Show chart" button. */
  chartIds?: Set<string>
  onShowChart?: (chartId: string) => void
}

/** Findings as a plain, readable list. Colour is a small signal, not a box. */
export function InsightFeed({ insights, chartIds, onShowChart }: Props) {
  if (insights.length === 0) {
    return (
      <div className="border-t border-line py-8">
        <p className="h-card">Nothing stands out</p>
        <p className="mt-1 text-sm text-muted">No notable findings for this file yet.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {insights.map((i) => {
        const tone = KIND[i.kind]
        const chartId = i.suggestedChartId
        const canShow = !!chartId && !!onShowChart && !!chartIds?.has(chartId)
        return (
          <li key={i.id} className="py-6">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: tone.fg }}
            >
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: tone.dot }} />
              {tone.label}
              <span className="font-normal normal-case tracking-normal text-muted">· {i.confidence} confidence</span>
            </p>
            <h4 className="h-card mt-2.5">{i.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{i.narrative}</p>

            <div className="mt-3 flex items-start justify-between gap-2">
              <details className="group min-w-0 text-xs text-muted">
                <summary className="-ml-1 inline-flex cursor-pointer list-none items-center gap-1 rounded-md px-1 py-1 font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                  Why this?
                  <Icon name="chevron" size={14} className="transition-transform group-open:rotate-180" />
                </summary>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 rounded-lg bg-surface p-3.5 font-mono ring-1 ring-line">
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
              {canShow && (
                <button type="button" onClick={() => onShowChart(chartId)} className="btn btn-ghost btn-sm shrink-0">
                  Show chart
                  <Icon name="arrowRight" size={14} />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}