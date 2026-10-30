import { beforeEach, describe, expect, it } from 'vitest'
import { REPORT_SCHEMA_VERSION, type ChartSpec, type ReportDocument } from '@/domain'
import { makeSpec } from '@/core/recommendations/specs'
import { useReportStore } from './reportStore'

const spec: ChartSpec = makeSpec({
  id: 'bar:a:b',
  type: 'bar',
  title: 'Revenue by Region',
  y: [{ columnId: 'b', aggregation: 'sum' }],
})

const doc = (): ReportDocument => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'r',
  title: 'Original',
  themeId: 'ledger',
  layoutTemplateId: 'standard',
  outputFormat: 'document',
  sections: [
    { block: { id: 'a', kind: 'cover', title: 'Original' } },
    { block: { id: 'b', kind: 'text', body: 'Hello' } },
    { block: { id: 'c', kind: 'chart', chartId: spec.id } },
  ],
  charts: { [spec.id]: structuredClone(spec) },
  insightEdits: {},
})

const s = () => useReportStore.getState()
const order = () => s().report!.sections.map((x) => x.block.id)
const history = () => useReportStore.temporal.getState()

describe('reportStore', () => {
  beforeEach(() => s().start(doc(), 'ds1'))

  it('starts with an empty undo history', () => {
    expect(history().pastStates).toHaveLength(0)
  })

  it('reorders sections and undoes it', () => {
    s().moveSection(0, 2)
    expect(order()).toEqual(['b', 'c', 'a'])
    history().undo()
    expect(order()).toEqual(['a', 'b', 'c'])
    history().redo()
    expect(order()).toEqual(['b', 'c', 'a'])
  })

  it('moves a section by one step and ignores moves past the ends', () => {
    s().moveBy('a', -1)
    expect(order()).toEqual(['a', 'b', 'c'])
    s().moveBy('a', 1)
    expect(order()).toEqual(['b', 'a', 'c'])
  })

  it('keeps the report title in sync with the cover title', () => {
    s().updateBlock('a', { title: 'Q4 Review' })
    expect(s().report!.title).toBe('Q4 Review')
  })

  it('hides sections', () => {
    s().toggleHidden('b')
    expect(s().report!.sections[1].hidden).toBe(true)
  })

  it('removes a chart section together with its spec', () => {
    s().removeSection('c')
    expect(order()).toEqual(['a', 'b'])
    expect(s().report!.charts[spec.id]).toBeUndefined()
  })

  it('adds a chart once and patches its options', () => {
    s().removeSection('c')
    s().addChart(spec)
    s().addChart(spec)
    expect(order()).toHaveLength(3)
    s().patchChart(spec.id, { type: 'barHorizontal' }, { dataLabels: true })
    expect(s().report!.charts[spec.id]).toMatchObject({ type: 'barHorizontal' })
    expect(s().report!.charts[spec.id].options.dataLabels).toBe(true)
  })

  it('stores and clears insight edits', () => {
    s().setInsightEdit('i1', 'My wording')
    expect(s().report!.insightEdits.i1).toBe('My wording')
    s().setInsightEdit('i1', null)
    expect(s().report!.insightEdits.i1).toBeUndefined()
  })

  it('does not record history when nothing changes', () => {
    s().moveSection(1, 1)
    expect(history().pastStates).toHaveLength(0)
  })
})