import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { buildProfile } from '@/core/analysis/profile'
import { generateInsights } from '@/core/insights/generateInsights'
import { buildDataset } from '@/core/parsing/buildDataset'
import { recommendCharts } from '@/core/recommendations/recommend'
import { reportDocumentSchema } from '@/domain'
import { makeSampleCsv } from '@/utils/sampleData'
import { cleanTitle, composeDraft } from './composeDraft'

const grid = Papa.parse<string[]>(makeSampleCsv(), { skipEmptyLines: 'greedy' }).data
const dataset = buildDataset(grid, { fileName: 's.csv', fileSize: 1, format: 'csv' })
const profile = buildProfile(dataset)
const insights = generateInsights({ dataset, profile })
const recommendations = recommendCharts({ dataset, profile, insights })

const draftWith = (selectedChartIds: string[], withInsights = true) =>
  composeDraft({
    id: 'r1',
    fileName: 'sample-saas-sales.csv',
    date: 'October 30, 2026',
    rowCount: dataset.rowCount,
    columns: dataset.columns,
    insights: withInsights ? insights : [],
    recommendations,
    selectedChartIds,
  })

describe('cleanTitle', () => {
  it('turns file names into readable titles', () => {
    expect(cleanTitle('sample-saas_sales.csv')).toBe('Sample saas sales')
    expect(cleanTitle('.csv')).toBe('Untitled report')
  })
})

describe('composeDraft', () => {
  const picked = recommendations.slice(0, 3).map((r) => r.id)
  const draft = draftWith(picked)
  const blocks = draft.sections.map((s) => s.block)

  it('produces a valid report document', () => {
    expect(reportDocumentSchema.safeParse(draft).success).toBe(true)
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length)
  })

  it('starts with a cover and an executive summary', () => {
    expect(blocks[0]).toMatchObject({ kind: 'cover', title: 'Sample saas sales' })
    expect(blocks[1]).toMatchObject({ kind: 'text', heading: 'Executive summary' })
  })

  it('adds KPI tiles for the numeric measures', () => {
    const kpis = blocks.find((b) => b.kind === 'kpis')
    expect(kpis?.kind === 'kpis' && kpis.items.map((i) => i.label)).toEqual([
      'Total Revenue',
      'Total Units',
      'Average Churn Rate',
    ])
  })

  it('adds one block per selected chart, with its spec', () => {
    const chartBlocks = blocks.filter((b) => b.kind === 'chart')
    expect(chartBlocks).toHaveLength(3)
    for (const b of chartBlocks) expect(draft.charts[b.chartId]).toBeDefined()
  })

  it('skips chart blocks when nothing is selected, and falls back without findings', () => {
    const bare = draftWith([], false)
    expect(bare.sections.some((s) => s.block.kind === 'chart')).toBe(false)
    const text = bare.sections[1].block
    expect(text.kind === 'text' && text.body).toContain('96 rows')
  })
})