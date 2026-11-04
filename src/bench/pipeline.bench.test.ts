import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { resolveChart } from '@/core/charts/resolveChart'
import { generateInsights } from '@/core/insights/generateInsights'
import { buildDataset } from '@/core/parsing/buildDataset'
import { recommendCharts } from '@/core/recommendations/recommend'
import { makeSpec } from '@/core/recommendations/specs'

function makeCsv(rows: number): string {
  const regions = ['North America', 'EMEA', 'APAC', 'LATAM']
  const plans = ['Enterprise', 'Growth', 'Starter']
  const out = ['Date,Region,Plan,Revenue,Units,Churn Rate']
  for (let i = 0; i < rows; i++) {
    const month = i % 36
    const date = `${2022 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`
    const revenue = 1000 + ((i * 7919) % 90000)
    out.push(
      `${date},${regions[i % 4]},${plans[i % 3]},"$${revenue.toLocaleString('en-US')}",${Math.floor(revenue / 300)},${(((i * 31) % 500) / 100).toFixed(1)}%`,
    )
  }
  return out.join('\n')
}

/** Manual benchmark. Run with VITE_BENCH=1 (see the verify steps). Skipped in normal test runs. */
describe.runIf(!!import.meta.env.VITE_BENCH)('pipeline benchmark', () => {
  it.each([100_000, 500_000])('processes %i rows', (rows) => {
    const ms: Record<string, number> = {}
    const time = <T>(label: string, fn: () => T): T => {
      const t = performance.now()
      const result = fn()
      ms[label] = Math.round(performance.now() - t)
      return result
    }

    const text = makeCsv(rows)
    const grid = time('1 parse csv', () => Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' }).data)
    const ds = time('2 types + columns', () => buildDataset(grid, { fileName: 'b.csv', fileSize: text.length, format: 'csv' }))
    const profile = time('3 profile', () => buildProfile(ds))
    const insights = time('4 insights', () => generateInsights({ dataset: ds, profile }))
    const recs = time('5 chart suggestions', () => recommendCharts({ dataset: ds, profile, insights }))
    time('6 one chart', () =>
      resolveChart(
        makeSpec({
          id: 'b',
          type: 'bar',
          title: 'b',
          x: { columnId: 'col_1' },
          y: [{ columnId: 'col_3', aggregation: 'sum' }],
        }),
        ds,
      ),
    )
    ms['total (ms)'] = Object.values(ms).reduce((a, b) => a + b, 0)

    console.log(`\n${rows.toLocaleString('en-US')} rows · ${(text.length / 1024 / 1024).toFixed(1)} MB`)
    console.table(ms)
    expect(ds.rowCount).toBe(rows)
    expect(recs.length).toBeGreaterThan(0)
  }, 180_000)
})