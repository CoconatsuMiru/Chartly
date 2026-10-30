import { aggregationFor } from '@/core/insights/columns'
import {
  REPORT_SCHEMA_VERSION,
  type ChartRecommendation,
  type ChartSpec,
  type ColumnMeta,
  type Insight,
  type ReportDocument,
  type SectionBlock,
} from '@/domain'

export interface DraftInput {
  id: string
  fileName: string
  date: string
  rowCount: number
  columns: ColumnMeta[]
  insights: Insight[]
  recommendations: ChartRecommendation[]
  selectedChartIds: string[]
}

const MAX_KPIS = 4
const MAX_SUMMARY = 3
const MAX_FINDINGS = 5

export function cleanTitle(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Untitled report'
}

export function defaultKpiItems(columns: ColumnMeta[]) {
  return columns
    .filter((c) => c.type === 'number' && c.role === 'measure')
    .slice(0, MAX_KPIS)
    .map((c) => {
      const aggregation = aggregationFor(c)
      return {
        label: `${aggregation === 'sum' ? 'Total' : 'Average'} ${c.name}`,
        columnId: c.id,
        aggregation,
      }
    })
}

/** Builds the first version of the report. Pure: the same input always gives the same draft. */
export function composeDraft(input: DraftInput): ReportDocument {
  let n = 0
  const nextId = () => `sec_${++n}`
  const sections: ReportDocument['sections'] = []
  const charts: Record<string, ChartSpec> = {}
  const add = (block: SectionBlock) => sections.push({ block })

  const title = cleanTitle(input.fileName)
  add({
    id: nextId(),
    kind: 'cover',
    title,
    subtitle: `${input.rowCount.toLocaleString('en-US')} rows across ${input.columns.length} columns`,
    date: input.date,
  })

  // Findings about data quality belong in the Import stage, not in the story.
  const story = input.insights.filter((i) => i.kind !== 'data-quality')
  const summary = story.slice(0, MAX_SUMMARY)
  add({
    id: nextId(),
    kind: 'text',
    heading: 'Executive summary',
    body:
      summary.length > 0
        ? summary.map((i) => `- ${i.narrative}`).join('\n')
        : `This report summarises ${input.rowCount.toLocaleString('en-US')} rows from ${input.fileName}.`,
  })

  const kpis = defaultKpiItems(input.columns)
  if (kpis.length > 0) add({ id: nextId(), kind: 'kpis', items: kpis })

  const captions = new Map<string, Insight>()
  for (const i of story) {
    if (i.suggestedChartId && !captions.has(i.suggestedChartId)) captions.set(i.suggestedChartId, i)
  }

  const captioned = new Set<string>()
  for (const rec of input.recommendations) {
    if (!input.selectedChartIds.includes(rec.id)) continue
    charts[rec.id] = structuredClone(rec.spec)
    const insight = captions.get(rec.id)
    if (insight) captioned.add(insight.id)
    add({ id: nextId(), kind: 'chart', chartId: rec.id, caption: insight?.narrative ?? '' })
  }

  const summarised = new Set(summary.map((i) => i.id))
  const findings = story.filter((i) => !summarised.has(i.id) && !captioned.has(i.id)).slice(0, MAX_FINDINGS)
  if (findings.length > 0) add({ id: nextId(), kind: 'insights', insightIds: findings.map((i) => i.id) })

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: input.id,
    title,
    themeId: 'ledger',
    layoutTemplateId: 'standard',
    outputFormat: 'document',
    sections,
    charts,
    insightEdits: {},
  }
}