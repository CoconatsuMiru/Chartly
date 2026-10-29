import { columnProfile, getMeasures } from '@/core/insights/columns'
import type { ChartRecommendation } from '@/domain'
import { makeSpec } from '../specs'
import type { RecommendationRule } from '../types'

export const histogramRule: RecommendationRule = {
  id: 'chart.histogram',
  run({ dataset, profile }) {
    const out: ChartRecommendation[] = []
    for (const m of getMeasures(dataset, 4)) {
      const p = columnProfile(profile, m.meta.id)
      const s = p?.numeric
      if (!p || !s || p.count < 20 || p.distinct < 5) continue

      const id = `histogram:${m.meta.id}`
      const skewed = Math.abs(s.skewness) > 1
      out.push({
        id,
        ruleId: 'chart.histogram',
        score: 0.3 + 0.1 * Math.min(1, Math.abs(s.skewness) / 2),
        reason: skewed
          ? `${m.meta.name} is lopsided, so its spread says more than its average.`
          : `Shows how ${m.meta.name} values are spread across ${p.count.toLocaleString('en-US')} rows.`,
        spec: makeSpec({
          id,
          type: 'histogram',
          title: `Distribution of ${m.meta.name}`,
          x: { columnId: m.meta.id, bins: s.histogram.length },
          y: [{ columnId: m.meta.id, aggregation: 'count', label: 'Rows' }],
          options: { axisTitles: { x: m.meta.name, y: 'Rows' } },
        }),
      })
    }
    return out
  },
}