import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/core/parsing/buildDataset'
import { categoricalFromCodes } from './categorical'
import { pearson } from './correlation'
import { dateStats } from './dateStats'
import { numericStats, quantile } from './descriptive'
import { buildProfile } from './profile'

const arr = (...v: number[]) => Float64Array.from(v)

describe('numericStats', () => {
  it('matches known values for 1..5', () => {
    const s = numericStats(arr(1, 2, 3, 4, 5))!
    expect(s.mean).toBe(3)
    expect(s.median).toBe(3)
    expect(s.q1).toBe(2)
    expect(s.q3).toBe(4)
    expect(s.sum).toBe(15)
    expect(s.std).toBeCloseTo(1.5811, 3)
    expect(s.skewness).toBeCloseTo(0, 10)
    expect(s.outlierCount).toBe(0)
  })

  it('ignores NaN and counts IQR outliers', () => {
    const s = numericStats(arr(1, 2, NaN, 3, 4, 100))!
    expect(s.max).toBe(100)
    expect(s.outlierCount).toBe(1)
  })

  it('builds a histogram that covers every value', () => {
    const s = numericStats(arr(1, 2, 3, 4, 5, 6, 7, 8, 9, 10))!
    expect(s.histogram.reduce((t, b) => t + b.count, 0)).toBe(10)
  })

  it('returns null for all-missing data and a single bin for constants', () => {
    expect(numericStats(arr(NaN, NaN))).toBeNull()
    expect(numericStats(arr(5, 5, 5))!.histogram).toHaveLength(1)
  })

  it('interpolates quantiles', () => {
    expect(quantile(arr(1, 2, 3, 4), 0.5)).toBe(2.5)
  })
})

describe('pearson', () => {
  it('detects perfect positive and negative relationships', () => {
    expect(pearson(arr(1, 2, 3), arr(2, 4, 6))!.r).toBeCloseTo(1)
    expect(pearson(arr(1, 2, 3), arr(6, 4, 2))!.r).toBeCloseTo(-1)
  })

  it('skips rows with missing values and rejects constants', () => {
    expect(pearson(arr(1, 2, NaN, 4), arr(2, 4, 6, 8))!.n).toBe(3)
    expect(pearson(arr(1, 1, 1), arr(1, 2, 3))).toBeNull()
  })
})

describe('dateStats', () => {
  it('detects monthly and daily granularity', () => {
    const monthly = arr(
      Date.UTC(2024, 0, 1),
      Date.UTC(2024, 1, 1),
      Date.UTC(2024, 2, 1),
      Date.UTC(2024, 3, 1),
    )
    expect(dateStats(monthly)!.granularity).toBe('month')
    const day = 86_400_000
    expect(dateStats(arr(0, day, 2 * day, 3 * day))!.granularity).toBe('day')
  })
})

describe('categoricalFromCodes', () => {
  it('counts and ranks values', () => {
    const r = categoricalFromCodes(Int32Array.from([0, 0, 1, -1]), ['A', 'B'])
    expect(r.count).toBe(3)
    expect(r.stats.top[0]).toMatchObject({ value: 'A', count: 2 })
  })
})

describe('buildProfile', () => {
  it('profiles a small dataset end to end', () => {
    const grid = [
      ['Date', 'Region', 'Units', 'Revenue'],
      ...Array.from({ length: 12 }, (_, i) => [
        `2024-${String(i + 1).padStart(2, '0')}-01`,
        i % 3 === 0 ? 'North' : 'South',
        String(10 + i),
        i === 5 ? 'n/a' : String((10 + i) * 20),
      ]),
      ['2025-01-01', 'South', '21', '420'],
      ['2025-01-01', 'South', '21', '420'],
    ]
    const ds = buildDataset(grid, { fileName: 't.csv', fileSize: 1, format: 'csv' })
    const p = buildProfile(ds)

    expect(p.rowCount).toBe(14)
    expect(p.duplicateRowCount).toBe(1)
    const rev = p.columns[3]
    expect(rev.missing).toBe(1)
    expect(p.columns[0].date!.granularity).toBe('month')
    expect(p.correlations[0].r).toBeGreaterThan(0.99)
  })
})