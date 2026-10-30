import { compatibleTypes } from '@/core/charts/compat'
import { CHART_TYPE_LABEL } from '@/core/charts/labels'
import type { ChartSpec, ReportDocument } from '@/domain'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { ThemePicker } from './ThemePicker'

interface Props {
  report: ReportDocument
  selectedId: string | null
}

type OptionKey = 'legend' | 'dataLabels' | 'gridlines' | 'trendline'

function ChartOptions({ spec }: { spec: ChartSpec }) {
  const columns = useSessionStore((s) => s.result?.columns) ?? []
  const patchChart = useReportStore((s) => s.patchChart)
  const types = compatibleTypes(spec, columns)

  const toggles: { key: OptionKey; label: string }[] = [
    { key: 'legend', label: 'Legend' },
    { key: 'dataLabels', label: 'Data labels' },
    { key: 'gridlines', label: 'Gridlines' },
    ...(spec.type === 'scatter' ? [{ key: 'trendline' as const, label: 'Trend line' }] : []),
  ]

  return (
    <div className="space-y-3">
      <p className="truncate text-sm font-medium" title={spec.title}>
        {spec.title}
      </p>
      {types.length > 1 && (
        <div role="group" aria-label="Chart type" className="flex flex-wrap gap-1">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === spec.type}
              onClick={() => patchChart(spec.id, { type: t })}
              className={`rounded-md border px-2 py-1 text-xs ${
                t === spec.type ? 'border-primary bg-primary text-white' : 'border-line text-muted hover:bg-paper'
              }`}
            >
              {CHART_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        {toggles.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!spec.options[key]}
              onChange={(e) => patchChart(spec.id, {}, { [key]: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function Inspector({ report, selectedId }: Props) {
  const setTheme = useReportStore((s) => s.setTheme)
  const selected = report.sections.find((s) => s.block.id === selectedId)?.block
  const chart = selected?.kind === 'chart' ? report.charts[selected.chartId] : undefined

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-serif text-lg">Theme</h3>
        <ThemePicker value={report.themeId} onChange={setTheme} />
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg">Selected chart</h3>
        {chart ? (
          <ChartOptions spec={chart} />
        ) : (
          <p className="text-sm text-muted">Click a chart in the report to change its type and options.</p>
        )}
      </section>
    </div>
  )
}