import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { generateInsights } from '@/core/insights/generateInsights'
import { buildDataset } from '@/core/parsing/buildDataset'
import { recommendCharts } from '@/core/recommendations/recommend'
import { makeSampleCsv } from './sampleData'

describe('sample data', () => {
  const grid = Papa.parse<string[]>(makeSampleCsv(), { skipEmptyLines: 'greedy' }).data
  const dataset = buildDataset(grid, { fileName: 's.csv', fileSize: 1, format: 'csv' })
  const profile = buildProfile(dataset)
  const insights = generateInsights({ dataset, profile })

  it('is read with the expected shape and types', () => {
    expect(dataset.rowCount).toBe(96)
    expect(dataset.columns.map((c) => c.type)).toEqual([
      'date',
      'category',
      'category',
      'number',
      'number',
      'number',
    ])
    expect(dataset.columns[3].format?.unit).toBe('currency')
    expect(dataset.columns[5].format?.unit).toBe('percent')
  })

  it('produces findings and chart suggestions', () => {
    expect(insights.some((i) => i.kind === 'trend')).toBe(true)
    const ids = recommendCharts({ dataset, profile, insights }).map((r) => r.id)
    expect(ids).toContain('line:col_0:col_3')
    expect(ids).toContain('bar:col_1:col_3')
  })
})