import type { Insight } from '@/domain'
import { metaById } from './columns'
import { fmtPct } from './format'
import type { InsightRule } from './types'

export const qualityRule: InsightRule = {
  id: 'quality.checks',
  run({ dataset, profile }) {
    const out: Insight[] = []
    const name = (id: string) => metaById(dataset, id)?.name ?? id
    const base = { ruleId: 'quality.checks', kind: 'data-quality', confidence: 'high' } as const

    for (const c of profile.columns) {
      const n = name(c.columnId)

      if (c.qualityFlags.includes('high-missing')) {
        out.push({
          ...base,
          id: `quality.missing:${c.columnId}`,
          importance: c.missingRate >= 0.5 ? 0.5 : 0.35,
          title: `${n} has many empty cells`,
          narrative: `${fmtPct(c.missingRate)} of ${n} is empty (${c.missing.toLocaleString('en-US')} of ${dataset.rowCount.toLocaleString('en-US')} rows), so totals and trends for this column may be understated.`,
          evidence: [
            { label: 'Empty cells', value: c.missing },
            { label: 'Share empty', value: fmtPct(c.missingRate) },
          ],
          columnIds: [c.columnId],
        })
      }

      if (c.qualityFlags.includes('constant')) {
        out.push({
          ...base,
          id: `quality.constant:${c.columnId}`,
          importance: 0.2,
          title: `${n} never changes`,
          narrative: `${n} has the same value in every row, so it won't reveal differences between records.`,
          evidence: [{ label: 'Distinct values', value: c.distinct }],
          columnIds: [c.columnId],
        })
      }

      if (c.qualityFlags.includes('ambiguous-dates')) {
        out.push({
          ...base,
          id: `quality.dates:${c.columnId}`,
          importance: 0.4,
          title: `Check the dates in ${n}`,
          narrative: `Dates in ${n} could be read day-first or month-first. Month-first was assumed, so spot-check a few dates.`,
          evidence: [{ label: 'Assumed order', value: 'month-first' }],
          columnIds: [c.columnId],
        })
      }
    }

    if (profile.duplicateRowCount > 0) {
      const rate = profile.duplicateRowCount / Math.max(1, dataset.rowCount)
      out.push({
        ...base,
        id: 'quality.duplicates',
        importance: Math.min(0.6, 0.3 + rate * 3),
        title: 'Duplicate rows found',
        narrative: `${profile.duplicateRowCount.toLocaleString('en-US')} rows (${fmtPct(rate)}) are exact copies of another row. They may be counted twice in totals.`,
        evidence: [
          { label: 'Duplicate rows', value: profile.duplicateRowCount },
          { label: 'Total rows', value: dataset.rowCount },
        ],
        columnIds: [],
      })
    }

    for (const w of dataset.source.parseWarnings) {
      if (w.code !== 'non-numeric-cells' && w.code !== 'unparseable-dates') continue
      out.push({
        ...base,
        id: `quality.unreadable:${w.columnId ?? w.code}`,
        importance: 0.4,
        title: 'Some cells could not be read',
        narrative: w.message,
        evidence: [{ label: 'Issue', value: w.code }],
        columnIds: w.columnId ? [w.columnId] : [],
      })
    }
    return out
  },
}