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

const CHART_HEIGHT = 360

interface Props {
  spec: ChartSpec
  columns: ColumnMeta[]
  theme?: Theme
  footer?: ReactNode
  /** Marks the figure as part of the report. */
  selected?: boolean
}

/** A chart presented as a figure: no box of its own, so a list of them reads like a page of an analysis. */
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
    <article className="relative p-6 sm:p-8">
      {selected && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}

      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h4 className="h-card">{spec.title}</h4>
          {spec.subtitle && <p className="mt-1 text-xs text-muted">{spec.subtitle}</p>}
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
            className="btn btn-ghost btn-sm"
          >
            <Icon name="table" size={15} />
            Table
          </button>
        </div>
      </header>

      <div className="mt-6">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : !data || !option ? (
          <div className="shimmer rounded-lg" style={{ height: CHART_HEIGHT }} aria-busy="true" />
        ) : asTable ? (
          <ChartDataTable chart={data} />
        ) : (
          <ChartView
            option={option}
            height={CHART_HEIGHT}
            ariaLabel={`${spec.title}. ${CHART_TYPE_LABEL[type]} chart with ${data.stats.plottedPoints} data points. Use the Table button for exact values.`}
          />
        )}
      </div>

      {notes.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-muted">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {footer && <div className="mt-6">{footer}</div>}
    </article>
  )
}