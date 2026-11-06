import { compatibleTypes } from '@/core/charts/compat'
import { CHART_TYPE_LABEL } from '@/core/charts/labels'
import type { ChartSpec, ReportDocument } from '@/domain'
import { setLayoutTemplate } from '@/state/reportActions'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { Switch } from '../ui/Switch'
import { LayoutPicker } from './LayoutPicker'
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
    <div className="space-y-4">
      <p className="truncate text-sm font-semibold" title={spec.title}>
        {spec.title}
      </p>
      {types.length > 1 && (
        <div role="group" aria-label="Chart type" className="seg flex-wrap">
          {types.map((t) => (
            <button key={t} type="button" aria-pressed={t === spec.type} onClick={() => patchChart(spec.id, { type: t })}>
              {CHART_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {toggles.map(({ key, label }) => (
          <div key={key}>
            <Switch label={label} checked={!!spec.options[key]} onChange={(v) => patchChart(spec.id, {}, { [key]: v })} />
          </div>
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
        <h3 className="mb-2.5 font-serif text-xl">Layout</h3>
        <LayoutPicker value={report.layoutTemplateId} onChange={setLayoutTemplate} />
        <p className="mt-2 text-xs text-muted">Shown in the Preview tab and used for exports.</p>
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="mb-2.5 font-serif text-xl">Theme</h3>
        <ThemePicker value={report.themeId} onChange={setTheme} />
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="mb-2.5 font-serif text-xl">Selected chart</h3>
        {chart ? (
          <ChartOptions spec={chart} />
        ) : (
          <p className="text-sm text-muted">Click a chart in the report to change its type and options.</p>
        )}
      </section>
    </div>
  )
}