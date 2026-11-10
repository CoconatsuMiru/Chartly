import type { Insight, InsightKind } from '@/domain'
import { stagger } from '@/utils/stagger'
import { Icon, type IconName } from '../ui/Icon'

const KIND: Record<InsightKind, { label: string; icon: IconName; bg: string; fg: string; rail: string }> = {
  trend: { label: 'Trend', icon: 'trend', bg: '#d9ecea', fg: '#084a4d', rail: '#1aa7a0' },
  change: { label: 'Change', icon: 'bolt', bg: '#fbefd5', fg: '#8a5a00', rail: '#e0951a' },
  correlation: { label: 'Correlation', icon: 'scatter', bg: '#ebe3f3', fg: '#4f3568', rail: '#8a63b0' },
  outlier: { label: 'Outliers', icon: 'alert', bg: '#f6e0e6', fg: '#7d2a48', rail: '#c2557a' },
  concentration: { label: 'Concentration', icon: 'pie', bg: '#e8ecd6', fg: '#475216', rail: '#8a9a3c' },
  distribution: { label: 'Distribution', icon: 'bars', bg: '#e9e6dd', fg: '#3d4753', rail: '#8d97a3' },
  'data-quality': { label: 'Data quality', icon: 'info', bg: '#e9e6dd', fg: '#3d4753', rail: '#8d97a3' },
  extreme: { label: 'Extreme', icon: 'bolt', bg: '#fbefd5', fg: '#8a5a00', rail: '#e0951a' },
  seasonality: { label: 'Seasonality', icon: 'trend', bg: '#d9ecea', fg: '#084a4d', rail: '#1aa7a0' },
}

interface Props {
  insights: Insight[]
  /** Ids of charts that exist, so a finding can offer a "Show chart" button. */
  chartIds?: Set<string>
  onShowChart?: (chartId: string) => void
}

export function InsightFeed({ insights, chartIds, onShowChart }: Props) {
  if (insights.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-serif text-lg">Nothing stands out</p>
        <p className="mt-1 text-sm text-muted">No notable findings for this file yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {insights.map((i, idx) => {
        const tone = KIND[i.kind]
        const chartId = i.suggestedChartId
        const canShow = !!chartId && !!onShowChart && !!chartIds?.has(chartId)
        return (
          <li key={i.id} className="card rise relative overflow-hidden p-5 pl-6" style={stagger(idx)}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone.rail }} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: tone.bg, color: tone.fg }}
              >
                <Icon name={tone.icon} size={12} />
                {tone.label}
              </span>
              <span className="text-xs text-muted">{i.confidence} confidence</span>
            </div>
            <h4 className="mt-3 font-serif text-[1.1rem] leading-snug">{i.title}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{i.narrative}</p>

            <div className="mt-4 flex items-start justify-between gap-2">
              <details className="group min-w-0 text-xs text-muted">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-1 font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                  Why this?
                  <Icon name="chevron" size={14} className="transition-transform group-open:rotate-180" />
                </summary>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-[#faf8f2] p-3.5 font-mono ring-1 ring-black/5">
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