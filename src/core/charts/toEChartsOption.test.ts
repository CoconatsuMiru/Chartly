import { describe, expect, it } from 'vitest'
import { THEMES } from '@/themes/builtin'
import { toEChartsOption } from './toEChartsOption'
import { makeSpec } from '@/core/recommendations/specs'
import type { ResolvedChart } from '@/domain'

type Opt = { series: { type: string; data: unknown }[]; color: string[] }

const stats = { sourceRows: 3, plottedPoints: 3, downsampled: false }

describe('toEChartsOption', () => {
  it('draws bars with the theme palette', () => {
    const rc: ResolvedChart = {
      spec: makeSpec({ id: 'b', type: 'bar', title: 't', y: [{ columnId: 'c', aggregation: 'sum' }] }),
      categories: ['A', 'B', 'C'],
      series: [{ name: 'Revenue', values: [1, 2, 3] }],
      stats,
      warnings: [],
    }
    const o = toEChartsOption(rc, THEMES[0]) as Opt
    expect(o.series[0].type).toBe('bar')
    expect(o.color).toEqual(THEMES[0].dataPalette)
  })

  it('adds a trend line to scatter charts when requested', () => {
    const rc: ResolvedChart = {
      spec: makeSpec({
        id: 's',
        type: 'scatter',
        title: 't',
        y: [{ columnId: 'c', aggregation: 'mean' }],
        options: { trendline: true },
      }),
      categories: [],
      series: [],
      points: [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
      ],
      stats,
      warnings: [],
    }
    const o = toEChartsOption(rc, THEMES[0]) as Opt
    expect(o.series.map((s) => s.type)).toEqual(['scatter', 'line'])
  })
})