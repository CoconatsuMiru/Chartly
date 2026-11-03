import { beforeEach, describe, expect, it } from 'vitest'
import { REPORT_SCHEMA_VERSION, type ReportDocument } from '@/domain'
import { setLayoutTemplate } from './reportActions'
import { useReportStore } from './reportStore'

const doc = (): ReportDocument => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'r',
  title: 'T',
  themeId: 'ledger',
  layoutTemplateId: 'standard',
  outputFormat: 'document',
  sections: [{ block: { id: 'a', kind: 'cover', title: 'T' } }],
  charts: {},
  insightEdits: {},
})

const report = () => useReportStore.getState().report!

describe('setLayoutTemplate', () => {
  beforeEach(() => useReportStore.getState().start(doc(), 'ds'))

  it('switches to slides and makes the output a deck, and undo restores it', () => {
    setLayoutTemplate('slides')
    expect(report()).toMatchObject({ layoutTemplateId: 'slides', outputFormat: 'deck' })
    useReportStore.temporal.getState().undo()
    expect(report()).toMatchObject({ layoutTemplateId: 'standard', outputFormat: 'document' })
  })

  it('falls back to the executive layout for unknown ids', () => {
    setLayoutTemplate('nope')
    expect(report()).toMatchObject({ layoutTemplateId: 'executive', outputFormat: 'document' })
  })
})