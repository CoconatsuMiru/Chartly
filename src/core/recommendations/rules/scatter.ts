import { metaById } from '@/core/insights/columns'
import type { ChartRecommendation } from '@/domain'
import { makeSpec } from '../specs'
import type { RecommendationRule } from '../types'

export const scatterRule: RecommendationRule = {
  id: 'chart.scatter',
  run({ dataset, profile }) {
    const out: ChartRecommendation[] = []
    // Correlations arrive sorted by strength; the aggregation on y is ignored for scatter charts.
    for (const c of profile.correlations) {
      const abs = Math.abs(c.r)
      if (abs < 0.4 || c.n < 10) continue
      const a = metaById(dataset, c.a)?.name ?? c.a
      const b = metaById(dataset, c.b)?.name ?? c.b
      const id = `scatter:${c.a}:${c.b}`

      out.push({
        id,
        ruleId: 'chart.scatter',
        score: 0.4 + 0.4 * abs,
        reason: `${a} and ${b} are ${abs >= 0.8 ? 'strongly' : 'moderately'} related (r = ${c.r.toFixed(2)}).`,
        spec: makeSpec({
          id,
          type: 'scatter',
          title: `${b} vs ${a}`,
          x: { columnId: c.a },
          y: [{ columnId: c.b, aggregation: 'mean', label: b }],
          options: { trendline: true, axisTitles: { x: a, y: b } },
        }),
      })
      if (out.length >= 3) break
    }
    return out
  },
}