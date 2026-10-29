import { aggregationFor, getMeasures, getTimeColumn } from '@/core/insights/columns'
import { GRAIN_ADJ } from '@/core/insights/format'
import { buildMeasureSeries } from '@/core/insights/timeSeries'
import type { ChartRecommendation } from '@/domain'
import { capitalise } from '../helpers'
import { makeSpec } from '../specs'
import type { RecommendationRule } from '../types'

export const lineRule: RecommendationRule = {
  id: 'chart.line',
  run({ dataset, profile }) {
    const time = getTimeColumn(dataset, profile)
    if (!time) return []

    const out: ChartRecommendation[] = []
    for (const m of getMeasures(dataset, 3)) {
      const agg = aggregationFor(m.meta)
      const { points, grain } = buildMeasureSeries(time.values, m.values, time.stats, agg)
      if (points.length < 4) continue

      const id = `line:${time.meta.id}:${m.meta.id}`
      out.push({
        id,
        ruleId: 'chart.line',
        score: 0.7 + Math.min(0.1, points.length / 200),
        reason: `A date column and a measure: ${points.length} ${grain} periods to follow over time.`,
        spec: makeSpec({
          id,
          type: 'line',
          title: `${m.meta.name} over time`,
          subtitle: capitalise(`${GRAIN_ADJ[grain]} ${agg === 'sum' ? 'total' : 'average'}`),
          x: { columnId: time.meta.id, dateGrain: grain },
          y: [{ columnId: m.meta.id, aggregation: agg, label: m.meta.name }],
          options: { axisTitles: { x: time.meta.name, y: m.meta.name } },
        }),
      })
    }
    return out
  },
}