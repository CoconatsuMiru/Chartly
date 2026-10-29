import type { ChartSpec, ChartType } from '@/domain'

interface SpecInput {
  id: string
  type: ChartType
  title: string
  subtitle?: string
  x?: ChartSpec['encoding']['x']
  y: ChartSpec['encoding']['y']
  series?: ChartSpec['encoding']['series']
  transforms?: ChartSpec['transforms']
  options?: Partial<ChartSpec['options']>
}

/** Single place that fills in sensible defaults for every recommended chart. */
export function makeSpec(i: SpecInput): ChartSpec {
  return {
    id: i.id,
    type: i.type,
    title: i.title,
    subtitle: i.subtitle,
    encoding: { x: i.x, y: i.y, series: i.series },
    transforms: { sort: 'none', ...i.transforms },
    options: {
      legend: false,
      dataLabels: false,
      gridlines: true,
      axisTitles: {},
      ...i.options,
    },
  }
}