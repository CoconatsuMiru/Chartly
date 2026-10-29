import { useMemo, useState, type ReactNode } from 'react'
import { compatibleTypes } from '@/core/charts/compat'
import { toEChartsOption } from '@/core/charts/toEChartsOption'
import type { ChartSpec, ChartType, ColumnMeta, Theme } from '@/domain'
import { useResolvedChart } from '@/hooks/useResolvedChart'
import { THEMES } from '@/themes/builtin'
import { ChartDataTable } from './ChartDataTable'
import { ChartView } from './ChartView'

const TYPE_LABEL: Record<ChartType, string> = {
  bar: 'Column',
  barHorizontal: 'Bar',
  stackedBar: 'Stacked',
  line: 'Line',
  area: 'Area',
  scatter: 'Scatter',
  donut: 'Donut',
  histogram: 'Histogram',
  kpi: 'KPI',
  table: 'Table',
}

interface Props {
  spec: ChartSpec
  columns: ColumnMeta[]
  theme?: Theme
  footer?: ReactNode
}

export function ChartCard({ spec, columns, theme = THEMES[0], footer }: Props) {
  const [type, setType] = useState<ChartType>(spec.type)
  const [asTable, setAsTable] = useState(false)

  const effective = useMemo<ChartSpec>(
    () => ({
      ...spec,
      type,
      options: { ...spec.options, legend: type === 'donut' ? true : spec.options.legend },
    }),
    [spec, type],
  )
  const types = useMemo(() => compatibleTypes(spec, columns), [spec, columns])
  const { data, error } = useResolvedChart(effective)
  const option = useMemo(() => (data ? toEChartsOption(data, theme) : null), [data, theme])

  const notes: string[] = []
  if (data?.stats.downsampled) {
    notes.push(
      `Showing ${data.stats.plottedPoints.toLocaleString('en-US')} of ${data.stats.sourceRows.toLocaleString('en-US')} points.`,
    )
  }
  if (data) notes.push(...data.warnings)

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-serif text-lg">{spec.title}</h4>
          {spec.subtitle && <p className="text-xs text-muted">{spec.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {types.length > 1 && (
            <div role="group" aria-label="Chart type" className="flex rounded-lg border border-line p-0.5">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={t === type}
                  onClick={() => setType(t)}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    t === type ? 'bg-primary text-white' : 'text-muted hover:bg-paper'
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
            className={`rounded-lg border border-line px-2 py-1 transition-colors ${
              asTable ? 'bg-primary text-white' : 'text-muted hover:bg-paper'
            }`}
          >
            Table
          </button>
        </div>
      </header>

      <div className="mt-3">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : !data || !option ? (
          <div className="h-[280px] animate-pulse rounded-lg bg-paper" aria-busy="true" />
        ) : asTable ? (
          <ChartDataTable chart={data} />
        ) : (
          <ChartView
            option={option}
            ariaLabel={`${spec.title}. ${TYPE_LABEL[type]} chart with ${data.stats.plottedPoints} data points. Use the Table button for exact values.`}
          />
        )}
      </div>

      {notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {footer && <div className="mt-3 border-t border-line pt-2">{footer}</div>}
    </article>
  )
}