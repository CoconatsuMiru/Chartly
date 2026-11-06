import { useMemo, useState, type ReactNode } from 'react'
import { compatibleTypes } from '@/core/charts/compat'
import { CHART_TYPE_LABEL } from '@/core/charts/labels'
import { toEChartsOption } from '@/core/charts/toEChartsOption'
import type { ChartSpec, ChartType, ColumnMeta, Theme } from '@/domain'
import { useResolvedChart } from '@/hooks/useResolvedChart'
import { THEMES } from '@/themes/builtin'
import { Icon } from '../ui/Icon'
import { ChartDataTable } from './ChartDataTable'
import { ChartView } from './ChartView'

interface Props {
  spec: ChartSpec
  columns: ColumnMeta[]
  theme?: Theme
  footer?: ReactNode
  /** Highlights the card when it is part of the report. */
  selected?: boolean
}

export function ChartCard({ spec, columns, theme = THEMES[0], footer, selected }: Props) {
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
    <article
      className={`card relative overflow-hidden p-5 transition-shadow ${
        selected ? 'ring-2 ring-primary/45' : ''
      }`}
    >
      {selected && <span aria-hidden="true" className="bg-brand-bar absolute inset-x-0 top-0 h-[3px]" />}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-serif text-[1.2rem] leading-snug">{spec.title}</h4>
          {spec.subtitle && <p className="mt-0.5 text-xs text-muted">{spec.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {types.length > 1 && (
            <div role="group" aria-label="Chart type" className="seg">
              {types.map((t) => (
                <button key={t} type="button" aria-pressed={t === type} onClick={() => setType(t)}>
                  {CHART_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
            className={`btn btn-ghost btn-sm ${asTable ? 'bg-primary-soft text-primary-strong' : ''}`}
          >
            <Icon name="table" size={15} />
            Table
          </button>
        </div>
      </header>

      <div className="mt-4">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : !data || !option ? (
          <div className="shimmer h-[280px] rounded-xl" aria-busy="true" />
        ) : asTable ? (
          <ChartDataTable chart={data} />
        ) : (
          <ChartView
            option={option}
            ariaLabel={`${spec.title}. ${CHART_TYPE_LABEL[type]} chart with ${data.stats.plottedPoints} data points. Use the Table button for exact values.`}
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
      {footer && <div className="mt-4 border-t border-line pt-3.5">{footer}</div>}
    </article>
  )
}