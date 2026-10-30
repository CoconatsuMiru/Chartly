import type { ChartType } from '@/domain'

export const CHART_TYPE_LABEL: Record<ChartType, string> = {
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