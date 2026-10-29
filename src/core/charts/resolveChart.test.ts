import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/core/parsing/buildDataset'
import { makeSpec } from '@/core/recommendations/specs'
import { resolveChart } from './resolveChart'

const build = (grid: string[][]) =>
  buildDataset(grid, { fileName: 't.csv', fileSize: 1, format: 'csv' })

// March is missing on purpose, to test gap filling.
const sales = build([
  ['Date', 'Region', 'Revenue', 'Units'],
  ['2024-01-01', 'North', '100', '1'],
  ['2024-01-15', 'South', '50', '2'],
  ['2024-02-01', 'North', '200', '3'],
  ['2024-02-15', 'North', '300', '4'],
  ['2024-04-01', 'South', '400', '5'],
])

const byRegion = (agg: 'sum' | 'mean', extra = {}) =>
  makeSpec({
    id: 's',
    type: 'bar',
    title: 't',
    x: { columnId: 'col_1' },
    y: [{ columnId: 'col_2', aggregation: agg }],
    ...extra,
  })

describe('resolveChart', () => {
  it('sums by category and sorts descending', () => {
    const r = resolveChart(byRegion('sum', { transforms: { sort: 'desc' } }), sales)
    expect(r.categories).toEqual(['North', 'South'])
    expect(r.series[0].values).toEqual([600, 450])
  })

  it('averages by category', () => {
    const r = resolveChart(byRegion('mean'), sales)
    expect(r.series[0].values).toEqual([200, 225])
  })

  it('buckets dates by month and leaves empty months as gaps', () => {
    const spec = makeSpec({
      id: 'l',
      type: 'line',
      title: 't',
      x: { columnId: 'col_0', dateGrain: 'month' },
      y: [{ columnId: 'col_2', aggregation: 'sum' }],
    })
    const r = resolveChart(spec, sales)
    expect(r.categories).toEqual(['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024'])
    expect(r.series[0].values).toEqual([150, 500, null, 400])
  })

  it('applies filters', () => {
    const spec = byRegion('sum', {
      transforms: { filter: [{ columnId: 'col_1', op: 'eq', value: 'North' }] },
    })
    const r = resolveChart(spec, sales)
    expect(r.categories).toEqual(['North'])
    expect(r.series[0].values).toEqual([600])
  })

  it('counts rows instead when asked to sum a non-numeric column', () => {
    const spec = makeSpec({
      id: 'c',
      type: 'bar',
      title: 't',
      x: { columnId: 'col_1' },
      y: [{ columnId: 'col_1', aggregation: 'sum' }],
    })
    const r = resolveChart(spec, sales)
    expect(r.series[0].values).toEqual([3, 2])
    expect(r.warnings.join(' ')).toContain('counted')
  })

  it('keeps the top N and groups the rest as Other', () => {
    const ds = build([
      ['Region', 'Revenue'],
      ['A', '100'],
      ['B', '50'],
      ['C', '30'],
      ['D', '20'],
    ])
    const spec = makeSpec({
      id: 't',
      type: 'bar',
      title: 't',
      x: { columnId: 'col_0' },
      y: [{ columnId: 'col_1', aggregation: 'sum' }],
      transforms: { sort: 'desc', topN: 2, groupRestAsOther: true },
    })
    const r = resolveChart(spec, ds)
    expect(r.categories).toEqual(['A', 'B', 'Other'])
    expect(r.series[0].values).toEqual([100, 50, 50])
  })

  it('splits a series by a category column', () => {
    const spec = makeSpec({
      id: 'st',
      type: 'stackedBar',
      title: 't',
      x: { columnId: 'col_0', dateGrain: 'month' },
      y: [{ columnId: 'col_2', aggregation: 'sum' }],
      series: { columnId: 'col_1' },
    })
    const r = resolveChart(spec, sales)
    expect(r.series.map((s) => s.name)).toEqual(['North', 'South'])
    expect(r.series[0].values).toEqual([100, 500, null, null])
    expect(r.series[1].values).toEqual([50, null, null, 400])
  })

  it('bins a histogram', () => {
    const ds = build([['Score'], ...Array.from({ length: 10 }, (_, i) => [String(i + 1)])])
    const spec = makeSpec({
      id: 'h',
      type: 'histogram',
      title: 't',
      x: { columnId: 'col_0', bins: 5 },
      y: [{ columnId: 'col_0', aggregation: 'count' }],
    })
    const r = resolveChart(spec, ds)
    expect(r.series[0].values).toEqual([2, 2, 2, 2, 2])
    expect(r.stats.sourceRows).toBe(10)
  })

  it('downsamples large scatter charts', () => {
    const ds = build([['X', 'Y'], ...Array.from({ length: 6000 }, (_, i) => [String(i), String(i * 2)])])
    const spec = makeSpec({
      id: 'sc',
      type: 'scatter',
      title: 't',
      x: { columnId: 'col_0' },
      y: [{ columnId: 'col_1', aggregation: 'mean' }],
    })
    const r = resolveChart(spec, ds)
    expect(r.points).toHaveLength(5000)
    expect(r.stats).toMatchObject({ sourceRows: 6000, plottedPoints: 5000, downsampled: true })
  })
})