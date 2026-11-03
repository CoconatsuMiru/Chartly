import { describe, expect, it } from 'vitest'
import { makeSpec } from '@/core/recommendations/specs'
import {
  REPORT_SCHEMA_VERSION,
  type ChartSpec,
  type Insight,
  type PositionedElement,
  type ReportDocument,
  type SectionBlock,
} from '@/domain'
import { THEMES } from '@/themes/builtin'
import { layoutReport } from './layoutReport'
import { approxMeasure } from './measure'

const spec = (id: string): ChartSpec =>
  makeSpec({ id, type: 'bar', title: `Chart ${id}`, y: [{ columnId: 'c', aggregation: 'sum' }] })

const insight: Insight = {
  id: 'i1',
  kind: 'trend',
  importance: 0.5,
  confidence: 'high',
  title: 'Revenue is up',
  narrative: 'Revenue rose 20% over the period.',
  evidence: [],
  columnIds: [],
  ruleId: 'trend.linear',
}

const blocks: SectionBlock[] = [
  { id: 'cv', kind: 'cover', title: 'Quarterly report', subtitle: 'All regions', date: 'October 30, 2026' },
  { id: 'tx', kind: 'text', heading: 'Summary', body: '- Revenue grew\n- Churn fell' },
  { id: 'k', kind: 'kpis', items: [
    { label: 'Total Revenue', columnId: 'c', aggregation: 'sum' },
    { label: 'Units', columnId: 'c', aggregation: 'count' },
  ] },
  { id: 'c1', kind: 'chart', chartId: 'a', caption: 'First chart caption.' },
  { id: 'c2', kind: 'chart', chartId: 'b', caption: '' },
  { id: 'c3', kind: 'chart', chartId: 'c', caption: '' },
  { id: 'in', kind: 'insights', insightIds: ['i1'] },
]

const doc = (over: Partial<ReportDocument> = {}): ReportDocument => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'r',
  title: 'Quarterly report',
  themeId: 'ledger',
  layoutTemplateId: 'executive',
  outputFormat: 'document',
  sections: blocks.map((block) => ({ block })),
  charts: { a: spec('a'), b: spec('b'), c: spec('c') },
  insightEdits: {},
  ...over,
})

const ctx = {
  theme: THEMES[0],
  insights: [insight],
  kpiText: { k: ['$1.2M', '340'] },
  measure: approxMeasure,
}

const all = (p: ReturnType<typeof layoutReport>): PositionedElement[] => p.pages.flatMap((pg) => pg.elements)
const texts = (p: ReturnType<typeof layoutReport>) =>
  all(p).flatMap((e) => (e.kind === 'text' ? [e.text] : []))
const chartEls = (p: ReturnType<typeof layoutReport>) => all(p).filter((e) => e.kind === 'chart')

describe('layoutReport: executive document', () => {
  const plan = layoutReport(doc(), ctx)

  it('uses A4 pages', () => {
    expect(plan.format).toBe('document')
    expect(plan.page).toEqual({ width: 595, height: 842 })
  })

  it('keeps every element on the page', () => {
    for (const e of all(plan)) {
      expect(e.x).toBeGreaterThanOrEqual(0)
      expect(e.y).toBeGreaterThanOrEqual(0)
      expect(e.x + e.w).toBeLessThanOrEqual(595.01)
      expect(e.y + e.h).toBeLessThanOrEqual(842.01)
    }
  })

  it('includes the cover, KPI values, charts and findings', () => {
    const t = texts(plan).join('\n')
    expect(t).toContain('Quarterly report')
    expect(t).toContain('$1.2M')
    expect(t).toContain('Revenue rose 20%')
    expect(chartEls(plan)).toHaveLength(3)
  })

  it('adds page footers', () => {
    expect(texts(plan)).toContain(`1 / ${plan.pages.length}`)
  })

  it('has no warnings for a healthy report', () => {
    expect(plan.warnings).toEqual([])
  })
})

describe('layoutReport: pagination', () => {
  it('splits long text across pages without losing or overflowing anything', () => {
    const body = Array.from({ length: 150 }, (_, i) => `Line ${i} of text`).join('\n\n')
    const plan = layoutReport(
      doc({ sections: [{ block: { id: 'tx', kind: 'text', heading: 'Long', body } }] }),
      ctx,
    )
    expect(plan.pages.length).toBeGreaterThan(1)
    const t = texts(plan).join('\n')
    expect(t).toContain('Line 0 of text')
    expect(t).toContain('Line 149 of text')

    // Content must stay above the footer zone; the background shape and footers are excluded.
    for (const e of all(plan)) {
      const isBackground = e.kind === 'shape' && e.w === 595 && e.h === 842
      if (isBackground || e.y >= 770) continue
      expect(e.y + e.h).toBeLessThanOrEqual(767.6)
    }
  })
})

describe('layoutReport: grid document', () => {
  it('places two charts side by side', () => {
    const plan = layoutReport(doc({ layoutTemplateId: 'grid' }), ctx)
    const [a, b] = chartEls(plan)
    expect(a.y).toBe(b.y)
    expect(a.x).toBeLessThan(b.x)
    expect(a.w).toBeLessThan(260)
  })
})

describe('layoutReport: slides', () => {
  it('makes 16:9 slides with a new slide per section', () => {
    const plan = layoutReport(doc({ layoutTemplateId: 'slides', outputFormat: 'deck' }), ctx)
    expect(plan.format).toBe('deck')
    expect(plan.page).toEqual({ width: 960, height: 540 })
    expect(plan.pages.length).toBeGreaterThanOrEqual(blocks.length)
  })

  it('leaves hidden sections out', () => {
    const sections = blocks.map((block) => ({ block, hidden: block.id === 'c3' }))
    const plan = layoutReport(doc({ layoutTemplateId: 'slides', sections }), ctx)
    expect(chartEls(plan)).toHaveLength(2)
  })
})

describe('layoutReport: warnings', () => {
  it('flags an empty cover title', () => {
    const sections = [{ block: { id: 'cv', kind: 'cover', title: '  ' } as SectionBlock }]
    const plan = layoutReport(doc({ sections }), ctx)
    expect(plan.warnings.some((w) => w.message.includes('no title'))).toBe(true)
  })

  it('flags a report with every section hidden, and still returns one page', () => {
    const plan = layoutReport(doc({ sections: blocks.map((block) => ({ block, hidden: true })) }), ctx)
    expect(plan.pages).toHaveLength(1)
    expect(plan.warnings.some((w) => w.message.includes('hidden'))).toBe(true)
  })

  it('flags a chart whose spec is missing', () => {
    const plan = layoutReport(doc({ charts: { a: spec('a') } }), ctx)
    expect(plan.warnings.some((w) => w.message.includes('no longer available'))).toBe(true)
    expect(chartEls(plan)).toHaveLength(1)
  })
})