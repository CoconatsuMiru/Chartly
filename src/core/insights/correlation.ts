import type { Insight } from '@/domain'
import { metaById } from './columns'
import type { InsightRule } from './types'

export const correlationRule: InsightRule = {
  id: 'correlation.pearson',
  run({ dataset, profile }) {
    const out: Insight[] = []
    for (const c of profile.correlations) {
      const abs = Math.abs(c.r)
      if (abs < 0.6 || c.n < 20) continue
      const a = metaById(dataset, c.a)?.name ?? c.a
      const b = metaById(dataset, c.b)?.name ?? c.b
      const strength = abs >= 0.8 ? 'strongly' : 'moderately'

      const sentence =
        c.r > 0
          ? `${a} and ${b} tend to rise and fall together (${strength}, r = ${c.r.toFixed(2)}, ${c.n.toLocaleString('en-US')} rows).`
          : `${a} and ${b} tend to move in opposite directions (${strength}, r = ${c.r.toFixed(2)}, ${c.n.toLocaleString('en-US')} rows).`

      out.push({
        id: `correlation.pearson:${c.a}+${c.b}`,
        ruleId: 'correlation.pearson',
        kind: 'correlation',
        importance: Math.min(1, 0.25 + 0.5 * abs),
        confidence: c.n >= 100 && abs >= 0.8 ? 'high' : c.n >= 30 ? 'medium' : 'low',
        title: `${a} is linked to ${b}`,
        narrative: `${sentence} This shows association, not cause.`,
        evidence: [
          { label: 'Correlation (r)', value: c.r.toFixed(3) },
          { label: 'Rows compared', value: c.n },
          { label: 'Method', value: c.method },
        ],
        columnIds: [c.a, c.b],
        suggestedChartId: `scatter:${c.a}:${c.b}`,
      })
    }
    return out
  },
}