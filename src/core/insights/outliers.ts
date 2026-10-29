import type { Insight } from '@/domain'
import { columnProfile, getMeasures } from './columns'
import { fmtNum, fmtPct } from './format'
import type { InsightRule } from './types'

const MAX_RATE = 0.15

export const outlierRule: InsightRule = {
  id: 'outlier.iqr',
  run({ dataset, profile }) {
    const out: Insight[] = []
    for (const m of getMeasures(dataset, 20)) {
      const p = columnProfile(profile, m.meta.id)
      const s = p?.numeric
      if (!p || !s || s.outlierCount === 0) continue

      const rate = s.outlierCount / p.count
      // When this many values are "unusual", the data is just skewed, not odd.
      if (rate > MAX_RATE) continue

      const iqr = s.q3 - s.q1
      const lower = s.q1 - 1.5 * iqr
      const upper = s.q3 + 1.5 * iqr
      const high = s.max > upper
      const low = s.min < lower
      const extreme = high && low
        ? `values range from ${fmtNum(s.min, m.meta)} to ${fmtNum(s.max, m.meta)}`
        : high
          ? `the highest is ${fmtNum(s.max, m.meta)}`
          : `the lowest is ${fmtNum(s.min, m.meta)}`

      const name = m.meta.name
      out.push({
        id: `outlier.iqr:${m.meta.id}`,
        ruleId: 'outlier.iqr',
        kind: 'outlier',
        importance: Math.min(1, 0.25 + Math.min(0.35, rate * 5)),
        confidence: p.count >= 30 ? 'medium' : 'low',
        title: `${name} has unusual values`,
        narrative: `${s.outlierCount} of ${p.count.toLocaleString('en-US')} ${name} values (${fmtPct(rate)}) fall outside the typical range of ${fmtNum(Math.max(lower, s.min), m.meta)} to ${fmtNum(Math.min(upper, s.max), m.meta)}; ${extreme}.`,
        evidence: [
          { label: 'Unusual values', value: s.outlierCount },
          { label: 'Typical range', value: `${fmtNum(Math.max(lower, s.min), m.meta)} to ${fmtNum(Math.min(upper, s.max), m.meta)}` },
          { label: 'Median', value: fmtNum(s.median, m.meta) },
          { label: 'Method', value: '1.5 x IQR fences' },
        ],
        columnIds: [m.meta.id],
        suggestedChartId: `histogram:${m.meta.id}`,
      })
    }
    return out
  },
}