import type { ChartSpec, ChartType, ColumnMeta } from '@/domain'

/** Chart types a spec can be switched to without changing what it measures. */
export function compatibleTypes(spec: ChartSpec, columns: ColumnMeta[]): ChartType[] {
  if (spec.type === 'scatter' || spec.type === 'histogram') return [spec.type]

  const x = columns.find((c) => c.id === spec.encoding.x?.columnId)
  if (!x) return [spec.type]

  const base: ChartType[] =
    x.type === 'date'
      ? ['line', 'area', 'bar']
      : ['bar', 'barHorizontal', spec.encoding.series ? 'stackedBar' : 'donut']

  if (!base.includes(spec.type)) base.unshift(spec.type)
  return base
}