import { describe, expect, it } from 'vitest'
import { makeSpec } from '@/core/recommendations/specs'
import type { ChartSpec, ChartType, ResolvedChart } from '@/domain'
import { THEMES } from '@/themes/builtin'
import { nativeChart, numberFormatCode } from './nativeChart'

const theme = THEMES[0]
const stats = { sourceRows: 2, plottedPoints: 2, downsampled: false }

const make = (
  type: ChartType,
  over: Partial<ResolvedChart> = {},
  options: Partial<ChartSpec['options']> = {},
): ResolvedChart => ({
  spec: makeSpec({ id: 'x', type, title: 't', y: [{ columnId: 'c', aggregation: 'sum' }], options }),
  categories: ['A', 'B'],
  series: [{ name: 'Revenue', values: [1, 2] }],
  stats,
  format: { y: { unit: 'currency', currencySymbol: '$', integer: true, decimals: 0 } },
  warnings: [],
  ...over,
})

describe('numberFormatCode', () => {
  it('builds Excel-style codes', () => {
    expect(numberFormatCode()).toBe('#,##0')
    expect(numberFormatCode({ unit: 'currency', currencySymbol: '$', integer: true, decimals: 0 })).toBe('"$"#,##0')
    expect(numberFormatCode({ unit: 'percent', integer: false, decimals: 1 })).toBe('#,##0.0"%"')
  })
})

describe('nativeChart', () => {
  it('maps column, bar and stacked charts', () => {
    const col = nativeChart(make('bar'), theme, 1)!
    expect(col.kind).toBe('BAR')
    expect(col.options).toMatchObject({ barDir: 'col', barGrouping: 'clustered', valAxisLabelFormatCode: '"$"#,##0' })
    expect(col.options.chartColors).toHaveLength(1)
    expect(nativeChart(make('barHorizontal'), theme, 1)!.options).toMatchObject({ barDir: 'bar', catAxisOrientation: 'maxMin' })
    expect(nativeChart(make('stackedBar'), theme, 1)!.options).toMatchObject({ barGrouping: 'stacked' })
  })

  it('scales text for slides', () => {
    expect(nativeChart(make('bar'), theme, 1)!.options.catAxisLabelFontSize).toBe(9)
    expect(nativeChart(make('bar'), theme, 1.55)!.options.catAxisLabelFontSize).toBe(14)
  })

  it('uses images instead when a native chart would hide gaps', () => {
    const gaps = make('line', { series: [{ name: 'Revenue', values: [1, null] }] })
    expect(nativeChart(gaps, theme, 1)).toBeNull()
    expect(nativeChart(make('line'), theme, 1)!.kind).toBe('LINE')
  })

  it('maps donuts with one colour per slice', () => {
    const d = nativeChart(make('donut'), theme, 1)!
    expect(d.kind).toBe('DOUGHNUT')
    expect(d.options.chartColors).toHaveLength(2)
  })

  it('keeps simple scatter charts native but not trend lines or groups', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]
    const plain = nativeChart(make('scatter', { points, series: [] }), theme, 1)!
    expect(plain.kind).toBe('SCATTER')
    expect(plain.data).toHaveLength(2)
    expect(nativeChart(make('scatter', { points, series: [] }, { trendline: true }), theme, 1)).toBeNull()
    const grouped = points.map((p) => ({ ...p, group: 'G' }))
    expect(nativeChart(make('scatter', { points: grouped, series: [] }), theme, 1)).toBeNull()
  })

  it('does not support tables or KPI tiles', () => {
    expect(nativeChart(make('table'), theme, 1)).toBeNull()
  })
})