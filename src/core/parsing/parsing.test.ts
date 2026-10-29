import { describe, expect, it } from 'vitest'
import { buildDataset } from './buildDataset'
import { getRowsAsText } from './datasetAccess'
import { detectDateOrder, parseDate } from './dateParsing'
import { normaliseGrid } from './headerDetection'
import { parseNumber } from './numberParsing'
import { inferColumn } from './typeInference'

describe('parseNumber', () => {
  it('handles common formats', () => {
    expect(parseNumber('1,234.56')?.value).toBe(1234.56)
    expect(parseNumber('1.234,56')?.value).toBe(1234.56)
    expect(parseNumber('12,5')?.value).toBe(12.5)
    expect(parseNumber('(1,200)')?.value).toBe(-1200)
    expect(parseNumber('-$5')?.value).toBe(-5)
    expect(parseNumber('$1,200')).toMatchObject({ value: 1200, unit: 'currency', currencySymbol: '$' })
    expect(parseNumber('12.5%')).toMatchObject({ value: 12.5, unit: 'percent', decimals: 1 })
  })

  it('rejects non-numbers', () => {
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('2024-01-05')).toBeNull()
    expect(parseNumber('')).toBeNull()
  })
})

describe('dates', () => {
  it('parses common formats', () => {
    expect(parseDate('2024-07-05')).toBe(Date.UTC(2024, 6, 5))
    expect(parseDate('05/07/2024', 'dmy')).toBe(Date.UTC(2024, 6, 5))
    expect(parseDate('05/07/2024', 'mdy')).toBe(Date.UTC(2024, 4, 7))
    expect(parseDate('Jan 5, 2024')).toBe(Date.UTC(2024, 0, 5))
    expect(parseDate('5 Jan 2024')).toBe(Date.UTC(2024, 0, 5))
    expect(parseDate('31/02/2024', 'dmy')).toBeNull()
  })

  it('detects day-first order and ambiguity', () => {
    expect(detectDateOrder(['13/01/2024', '02/03/2024'])).toEqual({ order: 'dmy', ambiguous: false })
    expect(detectDateOrder(['01/02/2024']).ambiguous).toBe(true)
  })
})

describe('normaliseGrid', () => {
  it('skips title rows and removes a total row', () => {
    const grid = [
      ['Sales Report', '', ''],
      ['', '', ''],
      ['Region', 'Revenue', 'Date'],
      ['North', '100', '2024-01-01'],
      ['South', '200', '2024-01-02'],
      ['Total', '300', ''],
    ]
    const n = normaliseGrid(grid)
    expect(n.headers).toEqual(['Region', 'Revenue', 'Date'])
    expect(n.rows).toHaveLength(2)
    expect(n.warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining(['skipped-rows', 'total-row-removed']),
    )
  })

  it('names blank headers and dedupes repeats', () => {
    const n = normaliseGrid([['A', 'A', ''], ['1', '2', '3']])
    expect(n.headers).toEqual(['A', 'A (2)', 'Column 3'])
  })
})

describe('inferColumn', () => {
  it('infers core types', () => {
    expect(inferColumn(['1', '2', '3.5'])).toMatchObject({ type: 'number', role: 'measure' })
    expect(inferColumn(['$1,200', '$300']).format).toMatchObject({ unit: 'currency', currencySymbol: '$' })
    expect(inferColumn(['2024-01-01', '2024-02-01'])).toMatchObject({ type: 'date', role: 'time' })
    expect(inferColumn(['North', 'South', 'North', 'East'])).toMatchObject({ type: 'category' })
    expect(inferColumn(['yes', 'no', 'yes']).type).toBe('boolean')
    expect(inferColumn(['', 'n/a'])).toMatchObject({ type: 'text', role: 'ignored' })
  })

  it('does not treat zero-padded codes as numbers', () => {
    expect(inferColumn(['00123', '00456']).type).not.toBe('number')
  })

  it('flags id-named numeric columns as identifiers', () => {
    const ids = Array.from({ length: 30 }, (_, i) => String(i + 1))
    expect(inferColumn(ids, 'Customer ID').type).toBe('identifier')
  })
})

describe('buildDataset', () => {
  it('builds typed columns and formats them back', () => {
    const grid = [
      ['Date', 'Region', 'Revenue'],
      ['2024-01-01', 'North', '$100'],
      ['2024-01-02', 'South', '$250.50'],
      ['2024-01-03', 'North', 'n/a'],
    ]
    const ds = buildDataset(grid, { fileName: 't.csv', fileSize: 1, format: 'csv' })
    expect(ds.rowCount).toBe(3)
    expect(ds.columns.map((c) => c.type)).toEqual(['date', 'category', 'number'])

    const rev = ds.data[2]
    expect(rev.kind).toBe('f64')
    if (rev.kind === 'f64') {
      expect(rev.values[0]).toBe(100)
      expect(Number.isNaN(rev.values[2])).toBe(true)
    }
    expect(getRowsAsText(ds, 0, 1)[0]).toEqual(['2024-01-01', 'North', '$100.00'])
  })
})