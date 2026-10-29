import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { buildDataset } from '@/core/parsing/buildDataset'
import { generateInsights } from './generateInsights'

function run(grid: string[][]) {
  const dataset = buildDataset(grid, { fileName: 't.csv', fileSize: 1, format: 'csv' })
  return generateInsights({ dataset, profile: buildProfile(dataset) })
}

describe('generateInsights', () => {
  const grid = [
    ['Date', 'Region', 'Revenue', 'Units'],
    ...Array.from({ length: 24 }, (_, i) => [
      `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
      i % 2 === 0 ? 'North' : ['South', 'East', 'West'][Math.floor(i / 2) % 3],
      String(1000 + i * 100),
      String(10 + i * 2),
    ]),
  ]

  it('finds a steady upward trend with evidence', () => {
    const trend = run(grid).find((i) => i.kind === 'trend' && i.columnIds[0] === 'col_2')!
    expect(trend.narrative).toContain('rose 230%')
    expect(trend.confidence).toBe('high')
    expect(trend.evidence.find((e) => e.label === 'R²')?.value).toBe('1.00')
  })

  it('finds correlation and concentration', () => {
    const insights = run(grid)
    expect(insights.some((i) => i.kind === 'correlation')).toBe(true)
    const conc = insights.find((i) => i.kind === 'concentration' && i.columnIds[1] === 'col_2')!
    expect(conc.title).toContain('North')
    expect(conc.narrative).toContain('49%')
  })

  it('reports no data-quality problems on clean data', () => {
    expect(run(grid).some((i) => i.kind === 'data-quality')).toBe(false)
  })

  it('flags outliers', () => {
    const scores = [['Score'], ...Array.from({ length: 20 }, (_, i) => [String(i + 1)]), ['500']]
    const outlier = run(scores).find((i) => i.kind === 'outlier')!
    expect(outlier.narrative).toContain('1 of 21')
  })

  it('flags columns that are mostly empty', () => {
    const rows = Array.from({ length: 10 }, (_, i) => [String(i + 1), i < 4 ? String(i) : ''])
    const quality = run([['A', 'B'], ...rows]).find((i) => i.kind === 'data-quality')!
    expect(quality.narrative).toContain('60%')
  })

  it('does not report trends with too few periods', () => {
    const short = [
      ['Date', 'Revenue'],
      ['2024-01-01', '100'],
      ['2024-02-01', '200'],
      ['2024-03-01', '300'],
      ['2024-04-01', '400'],
    ]
    expect(run(short).some((i) => i.kind === 'trend')).toBe(false)
  })
})