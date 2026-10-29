import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { generateInsights } from '@/core/insights/generateInsights'
import { recommendCharts } from '@/core/recommendations/recommend'
import { buildDataset } from './buildDataset'
import { getRowsAsText } from './datasetAccess'
import { parseMonthName } from './dateParsing'
import { inferColumn } from './typeInference'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

describe('parseMonthName', () => {
  it('accepts full names, abbreviations and Sept.', () => {
    expect(parseMonthName('January')).toBe(1)
    expect(parseMonthName('dec')).toBe(12)
    expect(parseMonthName('Sept.')).toBe(9)
    expect(parseMonthName(' MAY ')).toBe(5)
  })

  it('rejects typos and non-months', () => {
    expect(parseMonthName('Apirl')).toBeNull()
    expect(parseMonthName('constructor')).toBeNull()
    expect(parseMonthName('North')).toBeNull()
  })
})

describe('inferColumn with month names', () => {
  it('treats a month-name column as a time axis', () => {
    expect(inferColumn(MONTHS, 'month')).toMatchObject({ type: 'date', role: 'time', monthNames: true })
  })

  it('tolerates one typo out of twelve', () => {
    const typo = MONTHS.map((m) => (m === 'April' ? 'Apirl' : m))
    expect(inferColumn(typo, 'month')).toMatchObject({ type: 'date', monthNames: true })
  })

  it('does not mistake ordinary categories for months', () => {
    expect(inferColumn(['North', 'South', 'May', 'East', 'West', 'March'], 'region').type).toBe('category')
  })
})

describe('month-name datasets', () => {
  const grid = [
    ['Month', 'Amount'],
    ...MONTHS.map((m, i) => [m, String(100 * (i + 1))]),
  ]
  const dataset = buildDataset(grid, { fileName: 'b.csv', fileSize: 1, format: 'csv' })
  const profile = buildProfile(dataset)

  it('shows month names, not placeholder dates', () => {
    expect(getRowsAsText(dataset, 0, 1)[0][0]).toBe('January')
    expect(getRowsAsText(dataset, 11, 1)[0][0]).toBe('December')
  })

  it('reports a trend without a year', () => {
    const trend = generateInsights({ dataset, profile }).find((i) => i.kind === 'trend')!
    expect(trend.narrative).toContain('from Jan to Dec')
    expect(trend.narrative).not.toContain('2000')
  })

  it('recommends a line chart', () => {
    const ids = recommendCharts({ dataset, profile, insights: [] }).map((r) => r.id)
    expect(ids).toContain('line:col_0:col_1')
  })

  it('warns about a misspelled month and keeps the rest', () => {
    const typo = grid.map((r) => (r[0] === 'April' ? ['Apirl', r[1]] : r))
    const ds = buildDataset(typo, { fileName: 'b.csv', fileSize: 1, format: 'csv' })
    expect(ds.columns[0].type).toBe('date')
    expect(ds.source.parseWarnings.some((w) => w.code === 'unparseable-dates')).toBe(true)
  })
})