import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { generateInsights } from '@/core/insights/generateInsights'
import { buildDataset } from '@/core/parsing/buildDataset'
import { recommendCharts } from './recommend'

function recs(grid: string[][], withInsights = true) {
  const dataset = buildDataset(grid, { fileName: 't.csv', fileSize: 1, format: 'csv' })
  const profile = buildProfile(dataset)
  const insights = withInsights ? generateInsights({ dataset, profile }) : []
  return recommendCharts({ dataset, profile, insights })
}

const grid = [
  ['Date', 'Region', 'Revenue', 'Units'],
  ...Array.from({ length: 24 }, (_, i) => [
    `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    i % 2 === 0 ? 'North' : ['South', 'East', 'West'][Math.floor(i / 2) % 3],
    String(1000 + i * 100),
    String(10 + i * 2),
  ]),
]

describe('recommendCharts', () => {
  it('suggests the expected chart types with stable ids', () => {
    const ids = recs(grid).map((r) => r.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'line:col_0:col_2',
        'bar:col_1:col_2',
        'donut:col_1:col_2',
        'scatter:col_2:col_3',
        'histogram:col_2',
      ]),
    )
  })

  it('builds specs that point at the right columns', () => {
    const line = recs(grid).find((r) => r.id === 'line:col_0:col_2')!
    expect(line.spec.type).toBe('line')
    expect(line.spec.encoding.x).toMatchObject({ columnId: 'col_0', dateGrain: 'month' })
    expect(line.spec.encoding.y[0]).toMatchObject({ columnId: 'col_2', aggregation: 'sum' })
  })

  it('boosts charts that back a finding', () => {
    const withInsights = recs(grid).find((r) => r.id === 'line:col_0:col_2')!
    const without = recs(grid, false).find((r) => r.id === 'line:col_0:col_2')!
    expect(withInsights.score).toBeGreaterThan(without.score)
    expect(withInsights.reason).toContain('Supports the finding')
  })

  it('returns scores between 0 and 1, sorted high to low, without duplicates', () => {
    const list = recs(grid)
    const ids = list.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let i = 0; i < list.length; i++) {
      expect(list[i].score).toBeGreaterThan(0)
      expect(list[i].score).toBeLessThanOrEqual(1)
      if (i > 0) expect(list[i].score).toBeLessThanOrEqual(list[i - 1].score)
    }
  })

  it('counts rows per category when there is no numeric column', () => {
    const rows = Array.from({ length: 10 }, (_, i) => [['North', 'South', 'East'][i % 3]])
    const list = recs([['Region'], ...rows])
    expect(list.map((r) => r.id)).toContain('bar:col_0:count')
    expect(list[0].spec.encoding.y[0].aggregation).toBe('count')
  })

  it('skips line charts when there are too few periods', () => {
    const short = [
      ['Date', 'Revenue'],
      ['2024-01-01', '100'],
      ['2024-02-01', '200'],
      ['2024-03-01', '300'],
    ]
    expect(recs(short).some((r) => r.spec.type === 'line')).toBe(false)
  })
})