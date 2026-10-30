import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/core/parsing/buildDataset'
import { computeKpi } from './kpi'

const ds = buildDataset(
  [
    ['Region', 'Revenue'],
    ['North', '100'],
    ['South', '50'],
    ['North', '150'],
    ['South', 'n/a'],
  ],
  { fileName: 't.csv', fileSize: 1, format: 'csv' },
)

describe('computeKpi', () => {
  it('aggregates numeric columns, ignoring empty cells', () => {
    const k = (aggregation: Parameters<typeof computeKpi>[1]['aggregation']) =>
      computeKpi(ds, { columnId: 'col_1', aggregation })
    expect(k('sum')).toBe(300)
    expect(k('mean')).toBe(100)
    expect(k('count')).toBe(3)
    expect(k('min')).toBe(50)
    expect(k('max')).toBe(150)
    expect(k('median')).toBe(100)
  })

  it('counts rows and distinct values in a category column', () => {
    expect(computeKpi(ds, { columnId: 'col_0', aggregation: 'count' })).toBe(4)
    expect(computeKpi(ds, { columnId: 'col_0', aggregation: 'countDistinct' })).toBe(2)
  })

  it('returns null for impossible requests', () => {
    expect(computeKpi(ds, { columnId: 'col_0', aggregation: 'sum' })).toBeNull()
    expect(computeKpi(ds, { columnId: 'nope', aggregation: 'sum' })).toBeNull()
  })
})