import { useMemo } from 'react'
import { toEChartsOption } from '@/core/charts/toEChartsOption'
import type { ChartSpec, Theme } from '@/domain'
import { useResolvedChart } from '@/hooks/useResolvedChart'
import { ChartView } from '../charts/ChartView'

export function ReportChart({ spec, theme, height = 240 }: { spec: ChartSpec; theme: Theme; height?: number }) {
  const { data, error } = useResolvedChart(spec)
  const option = useMemo(() => (data ? toEChartsOption(data, theme) : null), [data, theme])

  if (error) return <p role="alert" className="text-sm text-danger">{error}</p>
  if (!data || !option) {
    return <div aria-busy="true" style={{ height }} className="animate-pulse rounded-lg bg-black/5" />
  }
  return (
    <ChartView
      option={option}
      height={height}
      ariaLabel={`${spec.title}. ${data.stats.plottedPoints} data points.`}
    />
  )
}