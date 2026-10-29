import { describe, expect, it } from 'vitest'
import { REPORT_SCHEMA_VERSION, reportDocumentSchema, type ReportDocument } from './report'

const valid: ReportDocument = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'r1',
  title: 'Test report',
  themeId: 'ledger',
  layoutTemplateId: 'standard',
  outputFormat: 'document',
  sections: [{ block: { id: 's1', kind: 'text', body: 'Hello' } }],
  charts: {},
  insightEdits: {},
}

describe('reportDocumentSchema', () => {
  it('accepts a valid report', () => {
    expect(reportDocumentSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an unknown block kind', () => {
    const bad = { ...valid, sections: [{ block: { id: 's1', kind: 'video' } }] }
    expect(reportDocumentSchema.safeParse(bad).success).toBe(false)
  })
})