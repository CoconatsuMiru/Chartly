import { describe, expect, it } from 'vitest'
import { makeSpec } from '@/core/recommendations/specs'
import { layoutReport } from '@/core/report/layout/layoutReport'
import { approxMeasure } from '@/core/report/layout/measure'
import { REPORT_SCHEMA_VERSION, type ReportDocument, type SectionBlock } from '@/domain'
import { THEMES } from '@/themes/builtin'
import { runPreflight } from './preflight'
import type { ExportFormat } from './types'

const spec = makeSpec({ id: 'a', type: 'bar', title: 'Chart A', y: [{ columnId: 'c', aggregation: 'sum' }] })

const blocks: SectionBlock[] = [
  { id: 'cv', kind: 'cover', title: 'Quarterly report' },
  { id: 'tx', kind: 'text', heading: 'Summary', body: 'Revenue grew.' },
  { id: 'c1', kind: 'chart', chartId: 'a', caption: '' },
]

const doc = (over: Partial<ReportDocument> = {}): ReportDocument => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'r',
  title: 'Quarterly report',
  themeId: 'ledger',
  layoutTemplateId: 'executive',
  outputFormat: 'document',
  sections: blocks.map((block) => ({ block })),
  charts: { a: spec },
  insightEdits: {},
  ...over,
})

const check = (report: ReportDocument, format: ExportFormat = 'pdf') => {
  const plan = layoutReport(report, { theme: THEMES[0], insights: [], kpiText: {}, measure: approxMeasure })
  return runPreflight(report, plan, format)
}
const levels = (cs: ReturnType<typeof check>) => cs.map((c) => c.level)

describe('runPreflight', () => {
  it('passes a healthy report with only notes', () => {
    const cs = check(doc())
    expect(levels(cs)).not.toContain('error')
    expect(levels(cs)).not.toContain('warn')
    expect(cs.some((c) => c.id === 'summary')).toBe(true)
    expect(cs.some((c) => c.id === 'captions')).toBe(true)
  })

  it('blocks an export when every section is hidden', () => {
    const cs = check(doc({ sections: blocks.map((block) => ({ block, hidden: true })) }))
    expect(levels(cs)[0]).toBe('error')
    expect(cs.some((c) => c.id === 'summary')).toBe(false)
  })

  it('warns that PowerPoint from a document layout is portrait', () => {
    expect(check(doc(), 'pptx').some((c) => c.id === 'portrait')).toBe(true)
    const slides = doc({ layoutTemplateId: 'slides', outputFormat: 'deck' })
    expect(check(slides, 'pptx').some((c) => c.id === 'portrait')).toBe(false)
  })

  it('warns about characters the PDF fonts cannot draw, only for PDF', () => {
    const report = doc({
      sections: [{ block: { id: 'tx', kind: 'text', body: '数据报告' } }],
    })
    expect(check(report, 'pdf').some((c) => c.id === 'fonts')).toBe(true)
    expect(check(report, 'pptx').some((c) => c.id === 'fonts')).toBe(false)
  })

  it('forwards layout warnings and flags a missing title', () => {
    const report = doc({
      title: ' ',
      sections: [{ block: { id: 'cv', kind: 'cover', title: ' ' } }],
    })
    const cs = check(report)
    expect(cs.some((c) => c.message.includes('no title'))).toBe(true)
    expect(cs.some((c) => c.id === 'title')).toBe(true)
  })

  it('sorts problems before notes', () => {
    const order = levels(check(doc({ title: '' }), 'pptx'))
    expect(order).toEqual([...order].sort((a, b) => ['error', 'warn', 'info', 'ok'].indexOf(a) - ['error', 'warn', 'info', 'ok'].indexOf(b)))
  })
})